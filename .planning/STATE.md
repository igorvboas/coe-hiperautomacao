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
  percent: 78
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Cliente final consegue ver suas demandas de automação e cadastrar novas em um único lugar, sem planilhas/e-mails.
**Current focus:** Bootstrap do projeto — saindo do mockup HTML estático para sistema real (Next.js + Supabase + Vercel).

## Current Position

Phase: 7.5 — Hardening de Segurança MVP. Wave 0 (infra de testes) completo.
Plan: 1 of 6
Status: Wave 0 done — Plan 02 (Wave 1 — atomicidade do `seq_id`) pronto para execução
Last activity: 2026-05-22 — `/gsd-execute-phase 7.5` executou Plan 01 (Wave 0): vitest 3.2.4 + scripts shell + seed idempotente. 4 tasks committed atomically (059cddd, a6e0c09, 20cc25a, 4fdfeac). Deviation: `.gitignore` ajustado para permitir commit do template `.env.test.example` (Rule 3 - Blocking).

Progress: [███████░░░] 78%

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
- Total plans completed: 1
- Average duration: 8min
- Total execution time: ~8min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 7.5 | 1 | 8min | 8min |

**Recent Trend:**
- Last 5 plans: 07.5-01 (8min)
- Trend: — (1 data point)

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
Stopped at: Plan 07.5-01 (Wave 0 — infra de testes) completo. 4 task commits + plan metadata commit. Vitest 3.2.4 configurado, seed idempotente de fgcoop-test + acme-test pronto, 2 scripts shell de auditoria criados. Próximo: Plan 07.5-02 (Wave 1 — atomicidade do `seq_id` com migration 0006_seq_id_atomic.sql).
Resume file: .planning/phases/07.5-hardening-seguranca-mvp/07.5-02-PLAN.md
