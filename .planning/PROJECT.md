# CoE Hiperautomação — Plataforma de Gestão de Demandas

## What This Is

Plataforma SaaS multi-tenant que permite ao cliente (empresa contratante do CoE de Hiperautomação) acompanhar o pipeline de demandas de automação e solicitar novas oportunidades. Cada cliente acessa apenas as suas próprias demandas via login; a empresa provedora (PSW) entrega o produto como serviço e, futuramente, terá um painel administrativo para gerenciar todos os tenants.

O esqueleto visual e o modelo de dados já foram validados no protótipo `fgcoop-coe-v2.html` (29 itens mockados, 9 personas + 20 formulários). Este projeto transforma o mockup em sistema real com banco, backend e frontend.

## Core Value

**O cliente final consegue, em um único lugar, ver o status real de cada demanda de automação que pediu e cadastrar novas oportunidades — sem depender de planilhas, e-mails ou reuniões com o CoE.**

Se tudo mais falhar, esta jornada (login → ver minhas demandas → cadastrar nova) precisa funcionar.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(Nenhum ainda — em pré-MVP. O mockup `fgcoop-coe-v2.html` valida fluxo visual mas não a entrega real.)

### Active

<!-- Current scope. Building toward these. -->

- [ ] **Autenticação por tenant**: cliente faz login e só enxerga dados da sua empresa (isolamento via RLS)
- [ ] **Listagem de oportunidades** em 3 visualizações: Tabela, Cards, Gestão à Vista (Kanban por status)
- [ ] **CRUD de oportunidades** via wizard multi-step (fluxo "Nova Oportunidade" do mockup)
- [ ] **Dois tipos de origem**: `persona` (entrevista qualitativa) e `formulario` (autoatendimento), com schemas próprios
- [ ] **Pipeline de 8 status**: Novo → Em Análise → Planejamento → Backlog → Desenvolvimento → Homologação → Produção → Concluído
- [ ] **Score de priorização** calculado a partir de esforço × complexidade × tempo × objetivo (fórmula do mockup, linhas 410-413)
- [ ] **Fases com datas de início/fim** por etapa do pipeline (para gestão à vista)
- [ ] **Filtros + busca + ordenação** (por nome, processo, área, ferramenta, prioridade, status)
- [ ] **KPIs no topo**: total, por tipo, por prioridade, por status, por ferramenta (RPA / n8n / ambos)
- [ ] **Modal de detalhe** com edição inline (header com troca rápida de status)
- [ ] **Deploy em produção** com acesso por domínio próprio

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Painel administrativo (super-admin / cross-tenant)** — adiado para milestone posterior; foco do MVP é entrega ao cliente final
- **Integração viva com n8n / RPA** — `ferramenta` é apenas um campo de classificação; orquestração real fica para depois
- **IA generativa** (minutas, análise de contratos, etc. mencionadas nas personas) — fora do escopo; é demanda dos clientes, não da plataforma
- **Notificações por e-mail / push** — não no MVP; usuário consulta sob demanda
- **Audit log / histórico de alterações por campo** — adiar até existir cliente que peça compliance
- **Importação em massa (CSV / Excel)** — adiar; cadastro manual via wizard cobre o início
- **Mobile nativo** — apenas web responsivo

## Context

**Origem do projeto:**
- PSW está construindo um CoE de Hiperautomação como produto/serviço.
- Primeiro cliente piloto: **FGCoop** (Fundo Garantidor do Cooperativismo).
- O mockup `fgcoop-coe-v2.html` (1798 linhas, dados estáticos) foi validado com o cliente e serve como contrato visual + modelo de dados.

**Modelo de dados extraído do mockup** (`DATA[]` em linha 408):
- Campos comuns: `id`, `seq_id`, `tipo` (persona|formulario), `solicitante`, `email`, `area`, `subarea`, `processo`, `frequencia`, `volumeMedio`, `tempoExecucao`, `numPessoas`, `ferramenta` (RPA|n8n|ambos), `escopoAutomacao[]`, `beneficiosEsperados[]`, `prioridade{esforco,complexidade,tempo,objetivo}`, `status`, `fases{emAnalise{ini,fim},...}`.
- Campos só de persona: `cargo`, `tempo_funcao`, `local`, `papel`, `sistemas`, `objetivos`, `metricas`, `desafios`, `dados`, `automacao_atual`, `expectativas`, `processos_detalhados`.
- Campos só de formulário: `criterios_objetivos{}`, `beneficios_mensuraveis{}`.

**Conhecimento prévio do time:**
- Stack preferencial é Vercel + Next.js + Supabase (skills auto-injetados nesta sessão sugerem isso).
- n8n já é usado internamente — pode virar canal de automação operacional pós-MVP.

**Risco-chave:**
- Vazamento entre tenants é o risco existencial — qualquer query que esqueça `tenant_id` quebra o produto. RLS no Postgres é a defesa em profundidade.

## Constraints

- **Tech stack**: Next.js 16 (App Router) + Tailwind + shadcn/ui no frontend; Supabase (Postgres + Auth + Storage) no backend; deploy na Vercel — alinha com o ecossistema já licenciado pela PSW e elimina infra customizada
- **Multi-tenancy**: isolamento obrigatório por Row Level Security do Postgres — toda tabela de domínio carrega `tenant_id` com policy `auth.uid() → tenant_id`
- **Idioma**: UI 100% pt-BR; identificadores de código em inglês (`opportunity`, `tenant`, `phase`)
- **Compatibilidade visual**: a nova UI deve replicar o esqueleto do mockup (tabela / cards / kanban + modal multi-aba + wizard 5–6 steps) antes de evoluir
- **Sem painel admin no MVP**: economiza ~30% do escopo e permite ir ao ar rápido com 1 cliente
- **Segurança**: nenhum endpoint público pode retornar dados de oportunidade sem sessão autenticada + verificação de tenant

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Supabase + Vercel como stack base | Stack já dominada pelo time, multi-tenant via RLS é nativo, deploy é trivial | — Pending |
| **Um único projeto Supabase compartilhado entre todos os tenants** | Migrations e operação centralizadas; custo controlado; RLS faz o isolamento. Confirmado pelo time em 2026-05-20 | ✓ Decidido |
| Multi-tenancy via RLS (não schema-per-tenant) | RLS escala melhor para muitos clientes pequenos e simplifica migrations | ✓ Decidido |
| Score calculado em runtime (não persistido) | Fórmula pode mudar; persistir vira fonte de bug. Recalcula via função SQL `opportunity_score()` | ✓ Decidido |
| `tipo` (persona/formulario) como discriminator com campos opcionais na mesma tabela | Compartilham 80% dos campos; tabelas separadas duplicariam JOIN. JSONB para campos exclusivos | ✓ Decidido |
| Pipeline de status fixo no código (não configurável por tenant) | MVP não precisa flexibilidade; muda quando segundo cliente pedir | — Pending |
| Admin panel adiado para pós-MVP | PSW pode operar via Supabase Studio enquanto não há volume de tenants | — Pending |
| **Começar pela modelagem do banco antes de qualquer código de app** | Schema é o contrato; corrigir migration depois é caro. Front e back se encaixam sobre ele | ✓ Decidido (2026-05-20) |

---
*Last updated: 2026-05-20 after initial project bootstrap from mockup `fgcoop-coe-v2.html`*
