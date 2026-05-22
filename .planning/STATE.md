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
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Cliente final consegue ver suas demandas de automação e cadastrar novas em um único lugar, sem planilhas/e-mails.
**Current focus:** Bootstrap do projeto — saindo do mockup HTML estático para sistema real (Next.js + Supabase + Vercel).

## Current Position

Phase: 7.5 — Hardening de Segurança MVP. Wave 0 + Wave 2 completos.
Plan: 2 of 6
Status: Wave 0 + Wave 2 done — Plan 02 (Wave 1 — atomicidade `seq_id`) pronto; Plan 04 (Wave 3 — RLS tenant-isolation) aguarda `supabase start` + `.env.test` para rodar.
Last activity: 2026-05-22 — `/gsd-execute-phase 7.5` executou Plan 03 (Wave 2 — Zod `.strict()` + Mass Assignment audit): 4 commits (a91e924 globalSetup unit-only fix [Rule 3], aa953a4 RED test, ae6bf0d GREEN schema, e42b486 actions audit + tenant scope [Rule 2]). 18/18 specs HARD-B-01..04 verdes. Typecheck clean. Total ~5min.

Progress: [████████░░] 80%

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
- Total plans completed: 2
- Average duration: 6.5min
- Total execution time: ~13min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 7.5 | 2 | 13min | 6.5min |

**Recent Trend:**
- Last 5 plans: 07.5-01 (8min), 07.5-03 (5min)
- Trend: ↘ menor (TDD ajuda — RED claro corta debug)

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

### Pending Todos

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
Stopped at: Plan 07.5-03 (Wave 2 — Zod `.strict()` + Mass Assignment audit) completo. 4 task commits (a91e924, aa953a4, ae6bf0d, e42b486) + SUMMARY + metadata. Schema Zod blindado contra Mass Assignment (HARDEN-B-01..04 verdes — 18/18 specs); `updateOpportunity` ganhou tenant scope explícito; `globalSetup` virou dual-mode (unit-only sem Supabase, integration com Supabase). Próximo: Plan 07.5-02 (Wave 1 — atomicidade `seq_id`) ou Plan 07.5-04 (Wave 3 — RLS tenant-isolation, depende de `supabase start` up).
Resume file: .planning/phases/07.5-hardening-seguranca-mvp/07.5-02-PLAN.md
