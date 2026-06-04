---
gsd_state_version: 1.0
milestone: v0.2
milestone_name: Evolução do Modelo (Workshop I / Unidasul)
status: phase_complete
next_action: plan-phase
active_phase: 10
next_phases: [11, 12, 13, 14, 15]
progress:
  total_phases: 7
  completed_phases: 1
  percent: 14
carryover_from_v0.1:
  pending_phases: ["7.6 — Enriquecimento por IA (realinhar aos novos campos)", "8 — Deploy (adiado — Future Requirements)"]
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Cliente final consegue ver suas demandas de automação e cadastrar novas em um único lugar, sem planilhas/e-mails.
**Current focus:** Bootstrap do projeto — saindo do mockup HTML estático para sistema real (Next.js + Supabase + Vercel).

## Current Position

Phase: **9 — Schema Evolution + Score/Risk/Contract Foundation** (próxima a planejar; ainda não iniciada).
Plan: —
Status: **roadmap_ready**. Roadmap v0.2 criado pelo gsd-roadmapper (2026-06-04): 7 fases (9–15), 35/35 REQ-IDs mapeados, seção "Milestone v0.2 — Roadmap" anexada ao ROADMAP.md (v0.1 preservado). Traceability de REQUIREMENTS.md preenchida. Numeração continua a partir do v0.1 (Phase 9). Próximo: `/gsd-plan-phase 9`.
Last activity: 2026-06-04 — `/gsd-new-milestone` iniciou o v0.2 (Evolução do Modelo a partir de `_giba_wsi-dashboard.html`). PROJECT.md atualizado com seção "Current Milestone: v0.2", 4 novas Key Decisions e seção Evolution. Decisões travadas com o PO: (1) novo milestone v0.2 (não inserir na v0.1); (2) `_giba` é evolução GLOBAL do produto — aposenta `fgcoop-coe-v2.html` como contrato; (3) pesquisa de ecossistema pulada (delta totalmente especificado pelo HTML). Pesquisa do delta concluída: todos os campos novos (`fteHoras`, `rpaScore`, `fonte`, `tipoProcesso`, `beneficioQualitativo`, `riscos[]`) confirmados ausentes no mockup antigo; fórmula de score nova mapeada (`calcScore` _giba:483-490, 5 fatores × 20); matriz de risco mapeada (_giba:1180-1185); wizard 5-steps mapeado (_giba:1504-1597); view Relatório mapeada (_giba:853-928).

**Carryover do v0.1 (pendente):** Phase 7.6 (Enriquecimento por IA) ficou `ready_to_execute` mas será REALINHADA aos novos campos do v0.2 antes de executar (os 9 campos-alvo do enrichment mudam). Phase 8 (Deploy) será ABSORVIDA ao final do v0.2 (schema muda por baixo). Artefatos do 7.6 preservados em `.planning/phases/07.6-enriquecimento-ia-oportunidades/`.

Previous activity: 2026-05-26 — `/gsd-insert-phase 7.6` (Enriquecimento por IA das Oportunidades) inserida entre 7.5 e 8 a pedido do PO. Criados: `.planning/phases/07.6-enriquecimento-ia-oportunidades/PHASE.md` (148 linhas, escopo em 6 blocos A-F). ROADMAP.md atualizado. `.env.example` (linha 30) e `.env.local` (linha 24) ganharam `OPENAI_API_KEY=` vazio. Reversão escopada da decisão "IA generativa = out-of-scope" do PROJECT.md.

Previous activity: 2026-05-22 — `/gsd-execute-phase 7.5` executou Plan 06 em **write-only mode** (Supabase Cloud, sem .env.test): 8 commits (f4f17f9 install botid+@marsidev/react-turnstile, 4f9974a migration 0007 public_form_submissions+RPC hardened, 909e016 handoff doc, be85e0b lib/security/* helpers, 02b6e6a createPublicOpportunity refatorado com BotID+Turnstile+log+pt-BR genérico, a779acb withBotId+initBotId, 55b6689 PublicForm widget invisible + token, b98bf6d 13 specs turnstile unit + public-form integration). 1 deviation Rule 3 (server-only não resolve em Vitest — alias para stub em vitest.config.ts; padrão Next.js, zero impacto em prod). typecheck clean. `npm run test:security` exit 0 (24 passed = 6 turnstile + 18 mass-assignment + 22 skipped = 3 atomicity + 7 public-form + 12 tenant-isolation). audit:secrets clean (TURNSTILE_SECRET_KEY só em server-only). Total ~17min.

Progress: [█████████░] 89%
<!-- Phase 7.5: 6/6 plans completos. Próximo phase: 8 (Polish & Deploy) -->


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

**Inserção (2026-05-26):** Phase 7.6 (Enriquecimento por IA das Oportunidades) inserida entre 7.5 e 8 (URGENT). Motivo: o wizard de criação e o formulário público pedem 9 campos (`ferramenta`, `escopo_automacao[]`, `beneficios_esperados[]`, `observacao`, `risco`, `esforco`, `complexidade`, `tempo`, `objetivo`) que o usuário final não tem contexto pra responder bem. Esses campos passam a ser **output** de um pós-processamento OpenAI server-side, disparado assincronamente após o INSERT da oportunidade. Reverte escopadamente "IA generativa = out-of-scope" do PROJECT.md — IA é auxiliar interno invisível, não feature do produto. `OPENAI_API_KEY` já adicionada (vazia) em `.env.example` e `.env.local`. Documentado em `.planning/phases/07.6-enriquecimento-ia-oportunidades/PHASE.md`. Próximo: `/gsd-discuss-phase 7.6` (decisões em aberto: disparo via `after()` do Next vs Supabase Edge Function via webhook vs Vercel Cron).

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 7.7min
- Total execution time: ~46min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 7.5 | 6 | 46min | 7.7min |

**Recent Trend:**
- Last 6 plans: 07.5-01 (8min), 07.5-03 (5min), 07.5-05 (5min), 07.5-02 (8min), 07.5-04 (3min), 07.5-06 (17min)
- Trend: ↗ Plan 06 maior (17min) — esperado: 8 tasks vs ~3-4 nos plans anteriores, install de 2 runtime deps, mudanças em 12 arquivos (5 novos helpers + Server Action refactor + UI + config + 2 test files + alias config). Plan single maior do MVP. 1 deviation Rule 3 (server-only alias) absorvida sem replan.

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
- **Formulário público hardened (Plan 07.5-06)**: 4 camadas de defesa em `/r/[slug]` — (1) Vercel BotID edge classifier, (2) Cloudflare Turnstile invisível (challenge → siteverify single-use), (3) Server Action valida ambos + loga em `public_form_submissions`, (4) RPC `create_public_opportunity` enforce length/array/jsonb limits no DB (SECURITY DEFINER). Rate limit por janela fixa NÃO implementado — deferido para backlog 999.x (CONTEXT.md `<deferred>` lock); BotID+Turnstile+limits cobrem ~95%, Upstash custo só justifica com monitoring real de abuso. IP hashado por construção (`hashIp()` THROW sem `IP_HASH_SALT` env). `error.message` raw NUNCA retornado ao cliente — só para `public_form_submissions.error_message` (audit). pt-BR genérico em todas as respostas. Token Turnstile single-use, reset() após cada submit. `withBotId(nextConfig)` + `initBotId({protect: [{ path: '/r/*', method: 'POST' }]})` em `instrumentation-client.ts`. BotID retorna `isBot:false` em local dev (RESEARCH Pitfall 1) — E2E ficam manuais em preview deploy.
- **server-only stub para Vitest (Plan 07.5-06)**: `vitest.config.ts` alias `'server-only' → ./tests/setup/server-only-stub.ts` (módulo vazio). Pacote `server-only` é dev-dep do Next bundler — não existe em Node puro de teste. Padrão recomendado pela própria doc do Next. Zero impacto em produção. Necessário para que helpers `lib/security/*` (todos abrem com `import 'server-only';`) sejam importáveis em test.

### Pending Todos

- **Aplicar `supabase/migrations/0006_seq_id_atomic.sql` no Supabase Cloud SQL Editor** (Phase 7.5 Plan 02 deliverable — handoff em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-02-MIGRATION-HANDOFF.md`). Após apply, rodar `npm run gen:types` para regenerar `lib/database.types.ts`. Sem isso, o teste `tests/security/atomicity.test.ts` permanece em skip mode quando `.env.test` apontar para o projeto Cloud.
- **Aplicar `supabase/migrations/0007_public_form_hardening.sql` no Supabase Cloud SQL Editor** (Phase 7.5 Plan 06 deliverable — handoff em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-06-MIGRATION-HANDOFF.md`). Cria `public_form_submissions` + funções `log_public_form_attempt`/`update_public_form_attempt` + recria `create_public_opportunity` hardened. Após apply, rodar `npm run gen:types` para remover os casts em `lib/public-form/log.ts`.
- **Configurar 3 env vars no Vercel** (Phase 7.5 Plan 06 — formulário público anônimo):
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (público) + `TURNSTILE_SECRET_KEY` (server): criar widget Mode:Invisible em Cloudflare Dashboard → Turnstile. Setar via `vercel env add ... production preview`.
  - `IP_HASH_SALT`: gerar com `openssl rand -hex 32`. Setar via `vercel env add ... production preview`. Sem isso, Server Action retorna sempre "Erro de configuração do servidor."
- **Popular `.env.test` apontando para projeto Supabase Cloud DE TESTE** (Phase 7.5 Plan 04+06 activation — instruções em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-04-SUMMARY.md` §"Apply Manually" + `07.5-06-SUMMARY.md` §"User Setup"). Ativa 22 integration specs (3 atomicity + 12 tenant-isolation + 7 public-form) em modo green. Sem isso, suite roda em skip mode (válido para CI sem Docker, mas não verifica RLS/RPC de fato). REQUER: aplicar todas migrations 0001..0007 no projeto Cloud de teste antes (não usar produção).
- Definir nome final do projeto (`fgcoop-coe`? `coe-platform`? `psw-coe`?) antes da Fase 2 (bootstrap do app)
- Levantar a marca / paleta do cliente piloto (FGCoop usa azul `#1a3c6e` + verde `#00a878` no mockup — manter como tema inicial?)
- Decidir provedor de e-mail/magic link (Supabase nativo basta para MVP)
- ~~Confirmar com o time se Supabase será compartilhado~~ — **decidido: compartilhado + RLS (2026-05-20)**

### Blockers/Concerns

- **Risco**: vazamento entre tenants caso alguma query backend esqueça `tenant_id`. Mitigação: RLS obrigatório + testes de integração simulando dois tenants
- **Risco**: divergência entre o mockup e o sistema final cria retrabalho. Mitigação: na Fase 4, replicar a estrutura visual fielmente antes de evoluir
- **Risco**: dependência de Supabase como SPOF — aceitar por enquanto, plano B é migrar para Postgres gerenciado próprio só se cliente exigir

## Session Continuity

Last session: 2026-06-04 — `/gsd-discuss-phase 9`. Contexto da Phase 9 (Schema Evolution + Score/Risk/Contract Foundation) capturado: 4 áreas discutidas e travadas (17 decisões D-01..D-17). Destaques: backfill FGCoop deriva `tempo` da coluna `frequencia` existente (personas→NULL), `fte_horas`/`fte` NULL, `fonte='FGCoop'`; critérios e benefícios em colunas jsonb dedicadas (não escalares); `rpa_score` como coluna GENERATED dos critérios com regra inferida por engenharia reversa do `_giba` (validada contra o seed); `opportunity_risks` com enums (tipo/impacto/probabilidade/status), `responsavel` text livre (tenant-agnóstico) e `priority` GENERATED da matriz. Artefatos: `.planning/phases/09-schema-evolution-foundation/09-CONTEXT.md` + `09-DISCUSSION-LOG.md` (commit bd58604). Próximo: `/gsd-plan-phase 9`.
Resume file: `.planning/phases/09-schema-evolution-foundation/09-01-SUMMARY.md`

---

Update 2026-06-04 (mesma sessão) — **Phase 9 COMPLETA.** Migration `0011` aplicada no Supabase Cloud pelo PO (confirmado "applied") após validação por **dry-run transacional (begin/rollback) 11/11 checks green** contra dados reais. 5 deviations descobertas e corrigidas no apply (todas no `09-01-SUMMARY.md`): (1) drop do overload antigo de `opportunity_score`; (2) CHECKs sem subquery (Postgres 0A000); (3) `opportunity_risks.priority` via TRIGGER em vez de GENERATED (42P17 — qualquer cast de enum é não-imutável); (4) backfill de `fonte` escopado ao tenant FGCoop (banco tinha 33 opps, 4 de outro tenant 99999999 — não carimbar 'FGCoop'); (5) 2 valores de `frequencia` mapeados (eventual→anual, '5 vezes por dia'→diario). typecheck clean, suite 103 passed/27 skipped/0 failed. **Pendências p/ Phase 10 (não bloqueiam):** `npm run gen:types` (falta SUPABASE_PROJECT_REF) → vai quebrar typecheck dos 7 testes com `tempo:'medio'` (corrigir junto); remover `any`-casts do teste de riscos; decidir destino do tenant 99999999. Próximo: `/gsd-plan-phase 10`.
Status: **phase_complete** → Phase 10.

---

Update 2026-06-04 (mesma sessão) — `/gsd-execute-phase 9` (inline sequential). **Wave 0 + Wave 1 escritos e commitados; bloqueado no checkpoint [BLOCKING] de apply manual de 0011.** 09-02 (contrato/docs) ✅ completo. 09-03 (testes de validação) ✅ completo — 33 testes puros green (rpa_score/score/matriz), 5 de isolamento em skip mode; `tsc --noEmit` clean; suite completa 103 passed/27 skipped/0 failed. 09-01 (migration 0011 + handoff) escrito e commitado, **Task 3 = apply manual no Supabase Cloud SQL Editor PENDENTE** (resume: usuário digita "applied" ou descreve erro; ver `09-MIGRATION-HANDOFF.md`). Após apply: rodar `npm run gen:types`. Regressão conhecida deferida p/ Phase 10: 7 testes existentes usam `tempo:'medio'` (domínio antigo) — integração quebra quando test DB tiver 0011. Commits fe6ea42..eb31590.
Status: **executing_blocked_on_apply** — Phase 9 NÃO marcada completa até apply + verificação.

---

Update 2026-06-04 (mesma sessão) — `/gsd-plan-phase 9`. RESEARCH.md produzido (regra do rpa_score resolvida por engenharia reversa: reproduz 64/64 linhas do `_giba` — soma de 6 indicadores; `causaReclamacoes`+`temDocumentacao` excluídos). 3 plans criados em 2 waves e **aprovados pelo plan-checker após 1 revisão** (corrigidos 2 blockers: backfill abortava na linha seq_id 18 sem `padronizacao_docs` → coalesce p/ 'nao'; smoke-test esperava score 100 num caso que dá 88 → trocado p/ `(alto,baixo,diario,5,muito_alto)=100`). Wave 0: 09-01 (migration 0011, `autonomous:false` [BLOCKING] apply manual) ‖ 09-02 (CLAUDE.md + fgcoop deprecated). Wave 1: 09-03 (testes de regra puros + isolamento A≠B). 16/16 REQ-IDs cobertos. Commits: research, 3 plans. **Próximo: `/gsd-execute-phase 9`.**
Status: **ready_to_execute**.

---

Previous session: 2026-05-22
Stopped at: **Phase 7.5 COMPLETA** (6/6 plans). Plan 07.5-06 (Wave 5 — formulário público hardened) completo em **write-only mode**. 8 commits atômicos (f4f17f9 install botid+@marsidev/react-turnstile, 4f9974a migration 0007 public_form_submissions+RPC hardened, 909e016 handoff doc, be85e0b lib/security/* helpers, 02b6e6a createPublicOpportunity refatorado com BotID+Turnstile+log+pt-BR genérico, a779acb withBotId+initBotId, 55b6689 PublicForm widget invisible + token, b98bf6d 13 specs turnstile unit + public-form integration). 1 deviation Rule 3 (server-only não resolve em Vitest — alias para stub em vitest.config.ts; padrão Next.js, zero impacto em prod). typecheck clean. `npm run test:security` exit 0 (24 passed = 6 turnstile + 18 mass-assignment + 22 skipped = 3 atomicity + 7 public-form + 12 tenant-isolation). audit:secrets clean (TURNSTILE_SECRET_KEY só em server-only). Total ~17min. Próximo: `/gsd-verify-work 7.5` (UAT — recomendado aguardar apply de 0006+0007 + setup de Turnstile/BotID/IP_HASH_SALT para E2E real em preview), depois Phase 8 (Polish & Deploy).
Resume file: `/gsd-verify-work 7.5` ou `/gsd-plan-phase 8` quando setup do Vercel/Cloud estiver pronto.
