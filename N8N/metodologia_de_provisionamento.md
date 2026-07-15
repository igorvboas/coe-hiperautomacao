# Calculadora de Infraestrutura n8n — Metodologia de Cálculo

Documento técnico explicando como a calculadora dimensiona recursos para uma instalação self-hosted do n8n. Toda a lógica vive no `<script>` do arquivo `calculadora-n8n.html` e pode ser ajustada nas constantes do topo.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Entradas coletadas](#2-entradas-coletadas)
3. [Decisão de arquitetura: Single Process vs Queue Mode](#3-decisão-de-arquitetura-single-process-vs-queue-mode)
4. [Cálculo de cada componente](#4-cálculo-de-cada-componente)
5. [Totais consolidados](#5-totais-consolidados)
6. [Classificação de tier](#6-classificação-de-tier)
7. [Sistema de avisos](#7-sistema-de-avisos)
8. [Tabela de perfis de workload](#8-tabela-de-perfis-de-workload)
9. [Como calibrar](#9-como-calibrar)
10. [Premissas e limitações](#10-premissas-e-limitações)

---

## 1. Visão geral

A calculadora aceita métricas de volumetria (esperadas em greenfield ou observadas em brownfield) e produz uma proposta inicial de recursos para provisionar a infraestrutura do n8n self-hosted. O resultado inclui:

- **Modo recomendado** (Single Process ou Queue Mode) com a razão da decisão
- **Especificações por componente** (Main, Workers, Webhook Processors, PostgreSQL, Redis)
- **Totais consolidados** (vCPU, RAM, conexões de banco)
- **Avisos contextuais** quando inputs são inconsistentes ou indicam pontos de atenção

O cálculo segue duas regras fundamentais: **dimensionar pelo pior caso realista** (P95, não média) e **expor a margem de segurança ao usuário** em vez de embutir múltiplas camadas escondidas.

---

## 2. Entradas coletadas

As entradas estão organizadas em quatro blocos. Cada uma é usada em pelo menos um cálculo abaixo.

### Bloco 1 — Volumetria

| Campo | Unidade | Usado em |
|---|---|---|
| `peakExecDay` | execuções/dia no pico | decisão de modo, tier, sizing do PG, avisos de consistência |
| `peakConcurrent` | execuções simultâneas no pico | quantidade de workers, sizing do main |
| `avgDuration` | segundos | verificação de consistência com concorrência |
| `p95Duration` | segundos | aviso de cauda lenta (P95/média) |

### Bloco 2 — Perfil dos workflows

| Campo | Tipo | Usado em |
|---|---|---|
| `profile` | enum (api-light, mixed, etl-files, ai-llm, code-custom) | RAM por execução, concorrência por worker, CPU por worker |
| `avgPayload` | KB | informacional |
| `maxPayload` | MB | ajuste de RAM por execução quando >10 MB |

### Bloco 3 — Webhooks e triggers

| Campo | Unidade | Usado em |
|---|---|---|
| `webhookPct` | % | trigger de webhook processor |
| `peakRPS` | requisições/segundo | trigger de webhook processor, sizing do main, avisos |

### Bloco 4 — Operacional

| Campo | Unidade | Usado em |
|---|---|---|
| `workflows` | quantidade ativa | decisão de modo, sizing do PG (disco) |
| `retentionDays` | dias | storage do PG, avisos |
| `editorUsers` | usuários concorrentes | sizing do main |
| `safetyMargin` | % | margem aplicada sobre RAM dos workers e disco do PG |
| `needsHA` | boolean | força queue mode + aviso sobre licença Enterprise |

---

## 3. Decisão de arquitetura: Single Process vs Queue Mode

A decisão é **holística**, não disparada por triggers isolados. POC fica POC, mesmo com pico de RPS pontualmente alto.

### Quando Queue Mode é recomendado

```
useQueue = needsHA
        OR hasRealTrafficVolume    (peakExecDay > 3000)
        OR hasRealConcurrencyNeed  (peakConcurrent > 15)
        OR hasManyWorkflows        (workflows > 50)
        OR hasSustainedRPS         (peakRPS > 15 AND peakExecDay > 2000)
```

### Raciocínio dos thresholds

- **`peakExecDay > 3000`** — volume diário que começa a forçar concorrência sustentada (~0,035 exec/s sustentado já implica fila relevante)
- **`peakConcurrent > 15`** — single process com concorrência além disso compete diretamente com a UI
- **`workflows > 50`** — muitos triggers paralelos (cron, polling) consomem recursos no main mesmo sem execução
- **`peakRPS > 15 + volume confirmando`** — RPS sozinho não dispara; precisa de volume diário compatível, senão é só burst pontual
- **`needsHA`** — exige queue mode obrigatoriamente (e licença Enterprise para multi-main real)

### Por que esses thresholds

Versões anteriores dispararam queue mode com `peakRPS > 3` ou `peakExecDay > 1000`, gerando arquitetura over-engineered para cargas pequenas. Os valores atuais refletem que single process Node.js bem dimensionado absorve facilmente dezenas de RPS e centenas de execuções por dia.

---

## 4. Cálculo de cada componente

### 4.1 Workers (Queue Mode apenas)

**Quantidade:**

```
workers = ceil(peakConcurrent / concurrency_per_worker)
```

A `concurrency_per_worker` vem do perfil (ver [tabela completa](#8-tabela-de-perfis-de-workload)):
- Workloads I/O-bound (API leve, misto): 20–25
- Workloads memory-bound (ETL, IA, Code): 8–10

**RAM por worker:**

```
RAM_MB = (512 + concurrency × memPerExec × INTERNAL_BUFFER) × user_margin
```

Onde:
- `512 MB` é o overhead do processo Node + n8n base
- `concurrency × memPerExec` é a RAM ocupada pelos jobs simultâneos
- `INTERNAL_BUFFER = 1,2` cobre variação normal de runtime (NÃO é margem de segurança)
- `user_margin = 1 + safetyMargin/100` é a margem que o usuário escolheu

O resultado é arredondado para o próximo múltiplo de 0,5 GB.

**Por que duas camadas separadas:**
Versões anteriores embutiam buffer 1,4× E aplicavam margem do usuário em cima — multiplicação composta de 1,4 × 1,35 = 1,89× que inflava o resultado em quase 2×. A separação atual torna a margem do usuário a única alavanca real de "quanto cushion adicional eu quero".

**Ajuste para payload grande:**

```
if maxPayloadMB > 10:
  memPerExec = max(memPerExec, maxPayloadMB × 40)
```

Quando workflows manipulam arquivos grandes, a memória por slot é dominada pelo payload, não pelo perfil base.

**CPU por worker:**

Vem do perfil:
- I/O-bound (api-light, mixed): 1 vCPU
- Memory/compute-bound (etl, ai, code): 2 vCPU

---

### 4.2 Main process

Único componente presente em ambos os modos.

**Queue mode:**
```
mainCPU = 2
mainRAM = 2 GB
```

**Single process:**
```
mainCPU  = 2 se peakConcurrent > 5 OR peakExecDay > 500, senão 1
mainRAM  = 2 GB se peakExecDay > 500, senão 1,5 GB
```

**Ajustes adicionais:**
- `+1 vCPU e +1 GB` se `editorUsers > 10` (UI servindo muitos usuários simultâneos)
- `+1 GB` se não há webhook processor dedicado e `peakRPS > 15` (main absorve o ingresso HTTP)

---

### 4.3 Webhook Processors (Queue Mode apenas)

**Quando entram:**

```
needsWebhookProc = useQueue AND (
    peakRPS > 20
    OR (peakRPS > 10 AND webhookPct > 70 AND editorUsers > 5)
)
```

A primeira condição cobre volume puro: 20 RPS sustentado já justifica isolamento. A segunda cobre o cenário misto onde mesmo RPS médio (10–20) pode interferir na UI quando há muitos usuários no editor.

**Quantidade:**
```
webhookProcs = ceil(peakRPS / 80)
```

Cada processor absorve confortavelmente ~80 RPS de webhooks simples.

**Especificações:**
- 1 vCPU + 1 GB cada (processo enxuto que só faz ingress HTTP + enfileiramento)

**Por que o threshold é alto:**
A documentação oficial do n8n descreve webhook processors como necessários para "huge number of parallel requests". RPS abaixo de ~20 é absorvido pelo main sem competir com a UI. Trigger covarde demais (versão anterior tinha `>5`) gerava infra desnecessária.

---

### 4.4 PostgreSQL

#### Conexões (pool)

A regra que a própria documentação do n8n cita:

```
Queue Mode:
  totalConnections = workers × concurrency_per_worker
                   + 5 (main)
                   + webhook_procs × 2
                   + 10 (reserva)

Single Process:
  totalConnections = peakConcurrent + 5 (main)
```

Esse número precisa caber em `max_connections` do Postgres (default 100). A calculadora avisa quando passa de 150.

#### CPU e RAM

Tabela por volume diário:

| `peakExecDay` | vCPU | RAM |
|---|---|---|
| > 100.000 | 8 | 16 GB |
| > 30.000 | 4 | 8 GB |
| > 5.000 | 2 | 4 GB |
| > 500 | 2 | 4 GB |
| ≤ 500 (POC) | 1 | 2 GB |

**Override por pool:**
- Se `totalConnections > 200`: força mínimo de 8 vCPU + 16 GB
- Se `totalConnections > 100`: força mínimo de 4 vCPU + 8 GB

#### Storage (disco)

```
logStorageGB = retentionDays × peakExecDay × 0.000040
diskGB = ceil((logStorageGB + 10 + workflows × 0.01) × user_margin)
```

Componentes:
- `0,000040 GB por execução` ≈ 40 KB médios por log de execução
- `+10 GB baseline` para n8n base, OS, swap, indices
- `workflows × 0,01 GB` para definições de workflow e credenciais

O resultado é NVMe — disco rotacional não é aceitável para PG em produção.

---

### 4.5 Redis (Queue Mode apenas)

```
redisCPU = 1
redisRAM = 2 GB
```

Valores fixos. Redis em queue mode raramente é gargalo — usa pouca RAM (filas Bull são leves) e pouco CPU. 2 GB cobre folgadamente cargas até centenas de milhares de jobs/dia.

Em Single Process, Redis não é provisionado.

---

## 5. Totais consolidados

```
totalCPU = mainCPU
         + workers × cpuPerWorker
         + webhookProcs × 1
         + dbCPU
         + redisCPU

totalRAM = mainRAM
         + workers × ramPerWorker
         + webhookProcs × 1
         + dbRAM
         + redisRAM
```

Valores em vCPU e GB. Os totais NÃO incluem overhead do sistema operacional dos nodes (Linux + Docker daemon): some +500 MB a 1 GB por VM física se for fazer cálculo de instância cloud.

---

## 6. Classificação de tier

Independente do modo, classifica a operação por escala:

| Tier | `peakExecDay` | Característica |
|---|---|---|
| **POC / Dev** | ≤ 100 | Single process, recursos mínimos |
| **Pequena prod** | 101–10.000 | Single ou queue (1 worker), PG dedicado |
| **Média prod** | 10.001–100.000 | Queue mode, 2–5 workers |
| **Larga escala** | > 100.000 | Queue mode, N workers, webhook procs dedicados |

O tier é informacional — a decisão de modo (single vs queue) tem sua própria lógica (seção 3) e pode ser disparada por concorrência ou HA mesmo em volume baixo.

---

## 7. Sistema de avisos

A calculadora emite avisos contextuais quando detecta:

### 7.1 Inputs inconsistentes (cross-validation)

**RPS vs volume diário:**
```
if peakRPS × 60 > peakExecDay × 2:
  warn: "RPS sustentado por 1 minuto já geraria mais execuções que o volume diário"
```
1 minuto de pico de RPS gera `peakRPS × 60` execuções. Se isso é mais do que o dobro do total diário declarado, ou o RPS é só um burst curtíssimo, ou o volume diário foi subestimado.

**Concorrência vs volume:**
```
avgConcurrent = (peakExecDay / 86400) × avgDuration
if peakConcurrent > avgConcurrent × 100 AND peakConcurrent > 5:
  warn: "Pico de concorrência é >100× a média esperada — cenário muito bursty"
```

### 7.2 Avisos de arquitetura

| Condição | Aviso |
|---|---|
| `P95 / avgDuration > 5` | Cauda lenta acentuada → considere pool de workers dedicado |
| `totalConnections > 150` | Pool alto → verifique `max_connections` (default 100) |
| `maxPayloadMB > 50` | Payload grande → considere offload para S3/GCS |
| `needsHA AND useQueue` | HA real exige licença Enterprise (multi-main) |
| `!useQueue AND workflows > 20` | Muitos workflows com volume baixo — reavaliar em 30 dias |
| `retentionDays > 60 AND peakExecDay > 10k` | Retenção longa + volume alto → DB cresce muito |
| `logStorageGB > 100` | Logs > 100 GB → arquivar ou reduzir retenção |

---

## 8. Tabela de perfis de workload

Constante `PROFILE_CONFIG` no topo do script:

| Perfil | `memPerExecMB` | `concurrency` | `cpuPerWorker` | Cenário típico |
|---|---|---|---|---|
| `api-light` | 30 | 25 | 1 | Integração API-to-API, JSON pequeno, espera de resposta HTTP |
| `mixed` | 60 | 20 | 1 | Mistura I/O com alguma transformação simples |
| `etl-files` | 200 | 10 | 2 | CSV, planilhas, transformação, arquivos médios |
| `ai-llm` | 250 | 8 | 2 | Chamadas a LLM (OpenAI, Claude), embeddings, RAG |
| `code-custom` | 150 | 10 | 2 | Nós Code (JS/Python) com lógica não-trivial, sandbox runner |

**Como esses valores foram derivados:**
n8n é dominantemente I/O-bound — a maior parte do tempo de execução é esperando resposta de API externa, com o payload pequeno em memória. Os valores de `memPerExec` refletem RAM **ativa** por slot em produção observada, não o pior caso teórico. Para casos extremos (payload >10 MB), o cálculo escala automaticamente via `maxPayload`.

**`INTERNAL_BUFFER = 1,2`** — buffer único aplicado sobre o cálculo de RAM para absorver variação normal de runtime. Não confundir com margem de segurança (essa é exposta ao usuário).

---

## 9. Como calibrar

A calculadora é uma heurística. Calibrar com dados reais melhora muito a precisão.

### Onde mexer

**1. `PROFILE_CONFIG` (linha ~542 do HTML)**
Ajuste `memPerExecMB`, `concurrency` e `cpuPerWorker` por perfil. Se seu histórico mostra que workloads "mistos" do seu cliente típico consomem 100 MB por slot (não 60), suba o valor.

**2. `INTERNAL_BUFFER` (linha ~554)**
Diminuir para cenários mais previsíveis (workloads estáveis com pouco outlier). Aumentar para cenários com variabilidade alta.

**3. Thresholds de modo (linha ~585)**
`hasRealTrafficVolume`, `hasRealConcurrencyNeed`, `hasManyWorkflows`, `hasSustainedRPS` — todos os números podem ser ajustados. Se você tem evidência de que queue mode vale a pena a partir de 1.500 exec/dia (não 3.000), troque o valor.

**4. Thresholds de webhook processor (linha ~616)**
Se observa que seu main tem dificuldade com 12 RPS, abaixe o threshold de 20.

**5. Tabela de PG (linha ~651)**
Se seus bancos de produção mostram que 2 vCPU aguentam até 50k exec/dia (não 30k), ajuste as faixas.

### Processo de calibragem

1. **Colete dados de 3–5 clientes reais** — sizing atual, volumetria, comportamento (UI lag, fila, OOM)
2. **Rode a calculadora** com a volumetria de cada um — compare o output com o sizing real
3. **Identifique desvios sistemáticos** — se a calculadora sempre sugere 30% mais RAM que o necessário, ajuste o buffer ou `memPerExec`
4. **Re-rode** após ajuste e verifique se o desvio sumiu sem criar novos
5. **Documente os números calibrados** com a fonte (qual cliente, qual período)

---

## 10. Premissas e limitações

### Premissas

- **n8n é predominantemente I/O-bound** — o cálculo de RAM assume esse padrão. Workloads CPU-bound (compressão pesada, criptografia, transcodificação) precisam de overrides manuais.
- **Workloads concorrentes são independentes** — não há cálculo de RAM compartilhada entre execuções (não é uma premissa do n8n)
- **Postgres bem configurado** — `shared_buffers`, `work_mem`, `effective_cache_size` adequados para o tamanho da instância
- **Network latency desprezível** entre processos n8n e PG/Redis — em deploy distribuído entre regiões, somar latência ao cálculo de duração
- **Margem de segurança aplicada uma única vez** — sobre RAM dos workers e disco do PG. CPU não recebe margem porque vCPUs são unidades discretas (você não pede "1,35 vCPU")

### Limitações conhecidas

- **Não modela cache** — PG e Redis se beneficiam de RAM extra para cache; o cálculo é apenas para working set
- **Não modela picos sazonais separados do pico declarado** — Black Friday e dia comum têm necessidades diferentes; declare o pico real
- **Não modela latência de APIs externas** — workflows que dependem de APIs lentas inflam concorrência sem inflar volume
- **Não decide entre Cloud e Self-hosted** — só dimensiona self-hosted. Para decisão Cloud, considerar custo de execuções e operacional
- **Não considera HPA explicitamente** — recomenda número fixo de workers/webhooks; em Kubernetes, considere esses números como pontos de partida do HPA, não tetos
- **Não dimensiona observabilidade** — Prometheus, Grafana, log aggregator (Loki) precisam de recursos próprios, somar à parte

### O que fazer quando os números parecem errados

Se o output diverge muito do que sua experiência indica:

- **Para mais (over-sized):** verifique se `peakConcurrent` está realista ou se foi declarado pelo pior cenário teórico. Verifique também se a margem de segurança está empilhada com outras camadas mentais.
- **Para menos (under-sized):** verifique se o perfil de workload bate. "Misto" cobre integração leve; ETL pesado deveria ser `etl-files`. Verifique também se `maxPayload` reflete o real.

Em ambos os casos: prefira observabilidade a heurística. Instrumente e meça por 2–3 semanas antes de fixar o sizing definitivo.

---

## Referências

- [Documentação oficial — Queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/)
- [Documentação oficial — Scaling](https://docs.n8n.io/hosting/scaling/)
- [Documentação oficial — Prerequisites](https://docs.n8n.io/hosting/oem-deployment/prerequisites/)