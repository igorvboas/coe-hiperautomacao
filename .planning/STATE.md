---
gsd_state_version: 1.0
milestone: v0.1
milestone_name: MVP — Sistema Real a partir do Mockup
status: in_progress
next_action: execute-phase
active_phase: "7.5"
next_phases: ["7.5", "8"]
progress:
  total_phases: 9
  completed_phases: 7
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Cliente final consegue ver suas demandas de automação e cadastrar novas em um único lugar, sem planilhas/e-mails.
**Current focus:** Bootstrap do projeto — saindo do mockup HTML estático para sistema real (Next.js + Supabase + Vercel).

## Current Position

Phase: 7.5 — Hardening de Segurança MVP. Wave 0 + Wave 1 + Wave 2 + Wave 3 + Wave 4 completos.
Plan: 5 of 6
Status: Plans 01 (Wave 0), 02 (Wave 1), 03 (Wave 2), 04 (Wave 3), 05 (Wave 4) done — somente Plan 06 (Wave 5 — formulário público hardened) pendente. Plan 04 (Wave 3 — RLS tenant-isolation) completo em **write-only mode**: 12 specs HARDEN-A-01..05 em skip mode aguardando `.env.test` apontar para Supabase Cloud de teste. Plan 06 desbloqueado pelo Plan 05 (CSP libera Turnstile).
Last activity: 2026-05-22 — `/gsd-execute-phase 7.5` executou Plan 04 em **write-only mode** (Supabase Cloud, sem .env.test ainda): 1 commit (e3b9736 tenant-isolation.test.ts 399 linhas com 4 grupos × 12 specs HARDEN-A-01..05 + sanity + schema integration; padrão describe.skipIf + lazy-init de serviceRoleClient em beforeAll mirroring Plan 02). 1 deviation Rule 2 (auto-add spec HARDEN-A-05d INSERT em opportunity_phases com tenant_id forjado por simetria de cobertura 4 verbos × 3 tabelas). typecheck clean. npm run test:security exit 0 (18 mass-assignment pass + 3 atomicity skipped + 12 tenant-isolation skipped). Total ~3min.

Progress: [████████░░] 83%
<!-- Phase 7.5: 5/6 plans completos (01, 02, 03, 04, 05) — Plan 06 pendente -->


## Milestone v0.1 — Roadmap (Reordenado em 2026-05-20)

| # | Fase | Entrega |
|---|------|---------|
| **1** | **Modelagem do Banco** | **`.planning/DATA-MODEL.md` + migration SQL inicial (`supabase/migrations/0001_init.sql`) com enums, tabelas, RLS, funções (`opportunity_score`), triggers (`seq_id`), índices. Aplicada em ambiente Supabase.** |
| 2 | Bootstrap App | Repo Next.js 16 inicializado, Supabase linkado, Vercel conectada, env vars + types gerados |
| 3 | Auth & Tenant Context | Login Supabase Auth, callback, hook `useTenant()`, middleware de proteção de rotas |
| 4 | Migração Visual do Mockup | Header, KPI bar, toolbar e as 3 views (tabela / cards / kanban) com dados reais — somente leitura |
| 5 | CRUD via Wizard | Modal "Nova Oportunidade" multi-step (5 para persona, 6 para formulário), incluindo edição inline |
| 6 | Pipeline & Fases | Troca de status pelo header do modal, gravação de datas início/fim por fase, atualização do kanban |
| 7 | Filtros, Busca, Ordenação, KPIs | Paridade com o mockup nos filtros, recálculo de score, KPIs reativos |
| **7.5** | **Hardening de Segurança MVP** | **Testes automatizados de isolamento de tenant (RLS), Zod centralizado em Server Actions, atomicidade do `seq_id`, rate limit + captcha no formulário público, headers de segurança, auditoria de segredos.** |
| 8 | Polish & Deploy | Responsivo, loading states, error boundaries, deploy de produção, smoke test com cliente piloto |

**Reordenação (2026-05-20):** banco antes do bootstrap do app. Schema é o contrato; corrigir migration depois é caro.

**Inserção (2026-05-21):** Phase 7.5 (Hardening de Segurança MVP) inserida entre 7 e 8. Motivo: deploy de produção com cliente piloto sem testes automatizados de isolamento de tenant + sem rate limit no formulário público é risco real. Documentado em `.planning/phases/07.5-hardening-seguranca-mvp/PHASE.md`.

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 5.8min
- Total execution time: ~29min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 7.5 | 5 | 29min | 5.8min |

**Recent Trend:**
- Last 5 plans: 07.5-01 (8min), 07.5-03 (5min), 07.5-05 (5min), 07.5-02 (8min), 07.5-04 (3min)
- Trend: ↘ Plan 04 mais rápido (3min) — reuso integral do padrão describe.skipIf + lazy-init do Plan 02; zero infraestrutura nova, só specs sobre helpers existentes do Wave 0. Pattern density continua pagando dividendos.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisões registradas em `.planning/PROJECT.md` → tabela "Key Decisions". Resumo das que já guiam o trabalho:

- **Stack**: Next.js 16 + Supabase + Vercel
- **Multi-tenancy**: Row Level Security do Postgres (não schema-per-tenant)
- **Score**: calculado em runtime, não persistido
- **Tipos**: `persona` e `formulario` na mesma tabela `opportunities` com discriminator + JSONB para campos exclusivos
- **Admin panel**: fora do MVP
- **Test runner (Plan 07.5-01)**: Vitest 3.2.x com `pool='forks'` `singleFork=true` — serializa specs contra mesma instância Supabase (Pitfall 4 do RESEARCH); testes de integração rodam contra Postgres real, NUNCA contra mocks
- **Tenants de teste (Plan 07.5-01)**: `fgcoop-test` (UUID `11111111-...`) + `acme-test` (UUID `22222222-...`); seed via Supabase Admin API; trigger `handle_new_user` cria profiles automaticamente
- **globalSetup unit-only mode (Plan 07.5-03)**: `tests/setup/global-setup.ts` detecta `NEXT_PUBLIC_SUPABASE_URL` vazio e pula seed (loga `[vitest globalSetup] modo unit-only`). Permite que specs puros (mass-assignment, futuros unit) rodem sem `supabase start`. URL apontando para produção ainda ABORTA (defesa hard preservada).
- **Mass Assignment defense por construção (Plan 07.5-03)**: `opportunityInputSchema` é `discriminatedUnion` com `.strict()` em CADA variant — `tenant_id`, `created_by`, `seq_id`, `id`, `created_at`, `updated_at` rejeitados como `unrecognized_keys`. `formularioExtrasSchema` adiciona `.superRefine` 8KB. `updateOpportunity` ganha `.eq('tenant_id', profile.tenant_id)` como defesa em profundidade sobre o RLS.
- **Security headers em proxy.ts (Plan 07.5-05)**: 6 headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`) anexados ao `NextResponse` retornado por `updateSession` — cobre redirect, 200, 404. CSP permite Turnstile (challenges.cloudflare.com em script/frame/connect) e Supabase REST/Realtime (`*.supabase.co` + `wss://`). `'unsafe-inline'` em script-src é tech debt MVP aceito (CONTEXT.md A6); `'unsafe-eval'` somente em `NODE_ENV=development`. `next.config.ts` fica reservado para Plan 06 (`withBotId`).
- **Whitelist de colunas em queries.ts (Plan 07.5-05)**: 3 `.select('*')` substituídos por constantes `OPPORTUNITY_COLUMNS` (30 colunas) e `PHASE_COLUMNS` (8 colunas). `.returns<Opportunity[]>()` posicionado AO FINAL da chain (não logo após `.select()`) para preservar `.eq()/.or()/.order()` do builder e a inferência de tipos do Supabase. Migrations futuras com colunas sensíveis exigem decisão explícita de inclusão.
- **Atomicidade `seq_id` por tenant (Plan 07.5-02)**: aux table `tenant_sequences(tenant_id uuid pk, last_seq int)` com RLS enabled + ZERO policies (acesso só via service_role / SECURITY DEFINER). Função `next_seq_id(p_tenant_id uuid)` usa `INSERT ... ON CONFLICT DO UPDATE ... RETURNING last_seq` — row-lock transacional, sem gaps em rollback (diferente de `CREATE SEQUENCE` cujo `nextval` não rollback). Trigger `trg_opportunities_seq_id` SEMPRE sobrescreve `new.seq_id := next_seq_id(...)` (sem `if null`) — defesa contra forge de seq_id pelo cliente (threat T-07.5-C-02).
- **Write-only mode para Supabase Cloud (Plan 07.5-02)**: projeto roda em Cloud (hosted), não local Docker. Migration 0006 é arquivo + handoff doc copy-paste-ready para Supabase Dashboard SQL Editor (NÃO `supabase db push`). Apply manual via Dashboard mantém controle visual e evita exigência de `SUPABASE_ACCESS_TOKEN` em sessão não-TTY. Padrão para próximas migrations enquanto projeto não tiver CI.
- **Vitest skip-when-no-db pattern (Plan 07.5-02)**: `describe.skipIf(!process.env.NEXT_PUBLIC_SUPABASE_URL)` + lazy-init de `serviceRoleClient()` dentro de `beforeAll` (corpo do describe roda mesmo em skip mode, só pula os `it`s). Permite `npm run test` exit 0 sem `.env.test` populado — específicos de integração entram em modo skipped, unit tests rodam normal.
- **RLS tenant-isolation suite (Plan 07.5-04)**: 12 specs em 4 grupos cobrindo HARDEN-A-01..05. SELECT/UPDATE/DELETE cross-tenant retornam `data: []` (RLS USING filtra silenciosamente). INSERT com `tenant_id` forjado retorna erro (RLS WITH CHECK levanta 42501). Cobertura simétrica em `opportunities` (4 verbos), `opportunity_phases` (4 verbos — HARDEN-A-05d adicionado por simetria), `profiles` (SELECT — `profiles_update_self` é id=auth.uid(), não tenant-based, fora do escopo Bloco A). Grupo 4 cross-check: `opportunityInputSchema.strict()` rejeita `tenant_id` no payload — defesa em profundidade Zod antes do RLS. Padrão skipIf + lazy-init reusado integralmente do Plan 02.

### Pending Todos

- **Aplicar `supabase/migrations/0006_seq_id_atomic.sql` no Supabase Cloud SQL Editor** (Phase 7.5 Plan 02 deliverable — handoff em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-02-MIGRATION-HANDOFF.md`). Após apply, rodar `npm run gen:types` para regenerar `lib/database.types.ts`. Sem isso, o teste `tests/security/atomicity.test.ts` permanece em skip mode quando `.env.test` apontar para o projeto Cloud.
- **Popular `.env.test` apontando para projeto Supabase Cloud DE TESTE** (Phase 7.5 Plan 04 activation — instruções em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-04-SUMMARY.md` §"Apply Manually"). Ativa 15 integration specs (3 atomicity + 12 tenant-isolation) em modo green. Sem isso, suite roda em skip mode (válido para CI sem Docker, mas não verifica RLS de fato). REQUER: aplicar todas migrations 0001..0006 no projeto Cloud de teste antes (não usar produção).
- Definir nome final do projeto (`fgcoop-coe`? `coe-platform`? `psw-coe`?) antes da Fase 2 (bootstrap do app)
- Levantar a marca / paleta do cliente piloto (FGCoop usa azul `#1a3c6e` + verde `#00a878` no mockup — manter como tema inicial?)
- Decidir provedor de e-mail/magic link (Supabase nativo basta para MVP)
- ~~Confirmar com o time se Supabase será compartilhado~~ — **decidido: compartilhado + RLS (2026-05-20)**

### Blockers/Concerns

- **Risco**: vazamento entre tenants caso alguma query backend esqueça `tenant_id`. Mitigação: RLS obrigatório + testes de integração simulando dois tenants
- **Risco**: divergência entre o mockup e o sistema final cria retrabalho. Mitigação: na Fase 4, replicar a estrutura visual fielmente antes de evoluir
- **Risco**: dependência de Supabase como SPOF — aceitar por enquanto, plano B é migrar para Postgres gerenciado próprio só se cliente exigir

## Session Continuity

Last session: 2026-05-22
Stopped at: Plan 07.5-04 (Wave 3 — RLS tenant-isolation) completo em **write-only mode**. 1 task commit (e3b9736 tenant-isolation.test.ts 399 linhas — 4 grupos × 12 specs HARDEN-A-01..05 cobrindo opportunities/opportunity_phases/profiles com SELECT/UPDATE/DELETE/INSERT cross-tenant + sanity checks + schema integration). Padrão describe.skipIf(!HAS_DB) + lazy-init de serviceRoleClient em beforeAll reusado integralmente do Plan 02. 1 deviation Rule 2 (auto-add HARDEN-A-05d INSERT em opportunity_phases por simetria 4 verbos × 3 tabelas). typecheck clean. npm run test:security exit 0 (18 mass-assignment pass + 3 atomicity skipped + 12 tenant-isolation skipped). Total ~3min. Próximo: Plan 07.5-06 (Wave 5 — formulário público hardened, último plan da Phase 7.5; depende de migration 0007 + Turnstile + BotID + logging public_form_submissions).
Resume file: .planning/phases/07.5-hardening-seguranca-mvp/07.5-06-PLAN.md (se existir; senão `/gsd-plan-phase 7.5` para Plan 06)
