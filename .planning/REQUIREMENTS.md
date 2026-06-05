# Requirements — Milestone v0.2 (Evolução do Modelo / Workshop I)

Fonte da verdade do delta: [`_giba_wsi-dashboard.html`](../_giba_wsi-dashboard.html). Cada requisito é específico, testável e centrado no usuário/sistema. REQ-IDs novos para o v0.2.

## v0.2 Requirements

### MODEL — Evolução do schema de oportunidades

- [ ] **MODEL-01**: Oportunidade armazena `fteHoras` (numeric, FTE estimado em horas/mês)
- [ ] **MODEL-02**: Oportunidade armazena `rpaScore` (int 0–6, RPA Fit)
- [ ] **MODEL-03**: Oportunidade armazena `fonte` (text, rótulo de origem/coleta, ex. "Workshop I")
- [ ] **MODEL-04**: Oportunidade armazena `tipoProcesso` (text[], categorias do processo)
- [ ] **MODEL-05**: Oportunidade armazena `beneficioQualitativo` (text)
- [ ] **MODEL-06**: Critérios viram 8 campos first-class com valores `SIM`/`NÃO`/`PARCIAL` (causaReclamacoes, totalmenteManual, regrasClaras, decisaoHumana, padronizacaoDocs, validacaoDados, schedulable, temDocumentacao)
- [ ] **MODEL-07**: Oportunidade armazena `prioridade.fte` (enum bucket muito_baixo…muito_alto) como fator de score
- [ ] **MODEL-08**: `prioridade.tempo` passa a representar **frequência** (diario/semanal/quinzenal/mensal/anual) em vez de bucket de duração; enum/migração tratam a mudança de semântica
- [ ] **MODEL-09**: Migration aplica a todos os tenants existentes e faz backfill/compat dos critérios antigos (`formulario_extras` jsonb) para os 8 critérios first-class, sem perda de dados
- [ ] **MODEL-10**: Schema fica **compatível com o enrichment por IA** (campos derivados preenchíveis manualmente agora, por IA no 2º momento — sem refatoração de schema necessária depois)

### SCORE — Fórmula de priorização reescrita

- [ ] **SCORE-01**: Função SQL `opportunity_score()` calcula 5 fatores × 20 = 100 (esforço + complexidade + tempo[frequência] + objetivo + fte), conforme `_giba:483-490`
- [ ] **SCORE-02**: View `opportunities_with_score` expõe o novo `score` + `priority_level` (alta ≥70 / média 40–69 / baixa <40)
- [ ] **SCORE-03**: `rpaScore` (0–6) derivado dos 8 critérios por regra determinística documentada
- [x] **SCORE-04**: Preview de score no wizard usa exatamente a mesma fórmula do backend (sem divergência cliente/servidor) — Phase 10: `lib/opportunities/score.ts` único, paridade validada ao vivo (100/88/59/36/67)

### RISK — Registro de Riscos

- [x] **RISK-01**: Usuário cadastra um risco de uma oportunidade com descrição, tipo (Impedimento/Risco/Oportunidade), responsável (PSW/UnidaSul), impacto, probabilidade, status (Novo/Gerenciado/Mitigado/Ocorrido), resposta ao risco e descrição do impacto — Phase 12-01: camada de dados `createRisk` (Zod + tenant server-derived); UI de cadastro em 12-02
- [x] **RISK-02**: Prioridade do risco (Crítica/Alta/Média/Baixa) é **auto-calculada** pela matriz impacto×probabilidade (`_giba:1180-1185`) — Phase 12-01: trigger `set_risk_priority()` é a autoridade; query lê `priority` GENERATED, nunca no payload; parity test 16/16
- [x] **RISK-03**: Usuário edita e remove riscos de uma oportunidade — Phase 12-01: `updateRisk`/`deleteRisk` (escopo `.eq('tenant_id', profile.tenant_id)`); UI em 12-02
- [ ] **RISK-04**: Riscos são isolados por tenant — nova tabela `opportunity_risks` com `tenant_id` + RLS (policy padrão)
- [x] **RISK-05**: Aba "Risco" do modal lista os riscos em tabela (ID Rxxx, descrição, tipo, responsável, impacto, probabilidade, prioridade, status, ações)

### REPORT — View "Relatório"

- [ ] **REPORT-01**: Nova view "📈 Relatório" acessível pelo seletor de views da toolbar
- [ ] **REPORT-02**: Cards de portfólio: total de oportunidades, FTE Total/mês, prioridade Alta/Média, RPA Ideal, RPA+n8n, nº de áreas
- [ ] **REPORT-03**: Distribuição por área de negócio com barras de quantidade + FTE estimado
- [ ] **REPORT-04**: Dois pie charts (SVG): oportunidades por área e FTE por área

### WIZARD — Novo fluxo de criação

- [x] **WIZARD-01**: Wizard único de 5 steps — Identificação → Processo → Critérios → Benefícios → Priorização (substitui o split persona/formulario)
- [x] **WIZARD-02**: Step "Priorização" coleta os 5 fatores de score, incluindo o bucket de FTE, com os pesos visíveis ao usuário
- [x] **WIZARD-03**: Step "Benefícios" coleta os 8 benefícios (escala 1–5) + estimativa de FTE em horas/mês
- [x] **WIZARD-04**: Step "Critérios" coleta os 8 critérios (SIM/NÃO/PARCIAL); validações por step (nome+área obrigatórios; processo obrigatório)

### VIEW — Atualizações das telas existentes

- [x] **VIEW-01**: KPI bar inclui FTE Total/mês + contadores Novos/Produção/Concluídos
- [x] **VIEW-02**: Tabela inclui colunas Frequência, Pessoas, Complexidade, FTE/mês e RPA Fit
- [x] **VIEW-03**: Ordenação disponível por FTE e pelo novo score
- [x] **VIEW-04**: Kanban (Gestão à Vista) soma e exibe FTE por coluna de status
- [x] **VIEW-05**: Modal exibe as 8 abas alinhadas ao novo modelo (Processo/Critérios/Automação/Benefícios/Score/Fases/Risco/Observação) + edição global (Editar/Salvar/Cancelar) com derivados read-only

### DATA — Dados reais Workshop I

- [ ] **DATA-01**: As 64 oportunidades do Workshop I são importadas como seed de um tenant "Unidasul" (migration de dados isolada por tenant)

### CONTRACT — Fonte da verdade

- [ ] **CONTRACT-01**: `_giba_wsi-dashboard.html` documentado como a fonte da verdade visual + modelo; CLAUDE.md atualizado (nova fórmula de score, novo modelo de dados, novo wizard)
- [ ] **CONTRACT-02**: `fgcoop-coe-v2.html` marcado como deprecated (não mais contrato)

## Future Requirements (deferred)

- **AI-GEN**: Geração por IA dos campos derivados (`fteHoras`, `rpaScore`, `prioridade.fte`, `ferramenta`, `riscos`, score) a partir do input bruto — "2º momento", estende a Phase 7.6. Adiado por decisão do PO (2026-06-04); v0.2 entrega preenchimento manual sobre schema já compatível (MODEL-10).
- **DEPLOY**: Deploy de produção do novo modelo (antiga Phase 8 do v0.1). Não selecionado para o v0.2; será milestone/fase própria quando o modelo estabilizar.
- **REALIGN-7.6**: Realinhar os 9 campos-alvo do enrichment da Phase 7.6 ao novo conjunto de campos do v0.2 antes de executá-la.

## Out of Scope

- **IA generativa como feature do produto** — mantido fora (decisão herdada do v0.1); IA só como auxiliar interno invisível.
- **Painel admin / cross-tenant** — adiado para pós-MVP.
- **Integração viva com n8n/RPA** — `ferramenta` segue sendo classificação.
- **Notificações, mobile nativo, importação CSV genérica** — herdados do Out of Scope do v0.1.

## Traceability

<!-- Preenchido pelo roadmapper (2026-06-04): REQ-ID → Phase. Cobertura 35/35. -->

| REQ-ID | Phase |
|--------|-------|
| MODEL-01 | 9 |
| MODEL-02 | 9 |
| MODEL-03 | 9 |
| MODEL-04 | 9 |
| MODEL-05 | 9 |
| MODEL-06 | 9 |
| MODEL-07 | 9 |
| MODEL-08 | 9 |
| MODEL-09 | 9 |
| MODEL-10 | 9 (compat) / 10 (verificado) |
| SCORE-01 | 9 |
| SCORE-02 | 9 |
| SCORE-03 | 9 |
| SCORE-04 | 10 |
| RISK-01 | 12 |
| RISK-02 | 12 |
| RISK-03 | 12 |
| RISK-04 | 9 |
| RISK-05 | 12 |
| REPORT-01 | 14 |
| REPORT-02 | 14 |
| REPORT-03 | 14 |
| REPORT-04 | 14 |
| WIZARD-01 | 11 |
| WIZARD-02 | 11 |
| WIZARD-03 | 11 |
| WIZARD-04 | 11 |
| VIEW-01 | 13 |
| VIEW-02 | 13 |
| VIEW-03 | 13 |
| VIEW-04 | 13 |
| VIEW-05 | 13 |
| DATA-01 | 15 |
| CONTRACT-01 | 9 |
| CONTRACT-02 | 9 |

**Cobertura:** 35/35 REQ-IDs mapeados, cada um a exatamente uma fase. (MODEL-10 é uma restrição de compatibilidade satisfeita pelo schema da Phase 9 e verificada na Phase 10 — sem duplicação de entrega.)
