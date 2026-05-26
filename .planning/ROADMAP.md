# ROADMAP — CoE Hiperautomação · Milestone v0.1 (MVP)

> Roadmap das 8 fases para o MVP. Vai sair daqui um sistema multi-tenant com login, listagem, CRUD e kanban — pronto pro cliente piloto FGCoop usar de verdade.
>
> Fonte da verdade do escopo: [.planning/PROJECT.md](PROJECT.md). Estado de execução: [.planning/STATE.md](STATE.md).

## Visão geral

| # | Phase | Status | Entrega Verificável | Plans |
|---|---|---|---|---|
| 1 | **Modelagem do Banco** | ✅ Done | Schema + RLS + funções + 29 oportunidades reais no Supabase | (modelagem feita manualmente) |
| 2 | **Bootstrap + Login** | ✅ Done | Login com `admin.fgcoop`, route guard, dashboard com nome + tenant + RLS check | 02-01 a 02-04 |
| 3 | **Lista (Tabela read-only)** | ✅ Done | Vê as 29 oportunidades reais em tabela com paridade visual do mockup | 03-01 a 03-03 |
| 4 | **Modal de Detalhe (read-only)** | ✅ Done | Modal com 6 abas por tipo (persona/formulário), URL-navegável, fullscreen fallback | 04-01 a 04-04 |
| 5 | **Trocar Status + Cards + Kanban** | ✅ Done | Drag-and-drop kanban + dropdown modal + trigger SQL sincronia | 05-01 a 05-03 |
| 6 | **Wizard CRUD (Criar + Editar + Excluir)** | ✅ Done | Wizard criar/editar + popup confirmação de delete (extra) | 06-01 a 06-03 |
| 7 | **Filtros, Busca, Sort, KPIs reativos** | ✅ Done | Paridade total com toolbar do mockup + KPI bar reativa | 07-01 a 07-03 |
| 7.5 | **Hardening de Segurança MVP** | ✅ Done (6/6) | Testes RLS, Zod centralizado, atomicidade `seq_id`, hardening form público (BotID+Turnstile+RPC limits+IP hashed), headers de segurança | **6 plans** (07.5-01 a 07.5-06) |
| 7.6 | **Enriquecimento por IA das Oportunidades** *(INSERTED)* | 🔜 Planejado (0/6) | Remove steps "Automação" e "Priorização" do user input; pós-processamento OpenAI server-side preenche 9 campos automaticamente; admin edita no modal de detalhe | **6 plans** (07.6-01 a 07.6-06) |
| 8 | **Polish + Deploy** | ⏸ Aguardando 7.6 | Loading states, error boundaries, responsivo, deploy Vercel | 08-01 a 08-03 |

## Phase 7.5 — Plans (planejados em 2026-05-21)

**Goal:** Endurecer a plataforma contra os vetores de ataque relevantes ao contexto multi-tenant + formulário público anônimo, antes do deploy de produção (Phase 8).

**Plans:** 6 plans em 6 waves (paralelismo limitado — cada plan tem dependência clara).

Plans:
- [x] 07.5-01-PLAN.md — Wave 0: Infraestrutura de testes (Vitest + seed + scripts shell) [HARDEN-INFRA-01..04] — **DONE 2026-05-22** (8min, 4 commits 059cddd..4fdfeac)
- [x] 07.5-02-PLAN.md — Wave 1: Atomicidade `seq_id` (migration 0006 + teste 50 inserts paralelos) [Bloco C, HARDEN-C-01..03] — **DONE 2026-05-22** (~8min, 3 commits f964c69 migration 0006 tenant_sequences + next_seq_id atômico + trigger always-override, d11a110 HANDOFF.md para apply manual no Supabase Cloud, d635d22 atomicity.test.ts com describe.skipIf). **Apply manual no Dashboard SQL Editor pendente** — handoff em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-02-MIGRATION-HANDOFF.md`.
- [x] 07.5-03-PLAN.md — Wave 2: Zod `.strict()` + audit de Mass Assignment em Server Actions [Bloco B, HARDEN-B-01..04] — **DONE 2026-05-22** (~5min, 4 commits a91e924..e42b486)
- [x] 07.5-04-PLAN.md — Wave 3: Testes de isolamento de tenant (RLS + IDOR cross-tenant) [Bloco A, HARDEN-A-01..05] — **DONE 2026-05-22** (~3min, 1 commit e3b9736 tenant-isolation.test.ts 399 linhas com 12 specs em 4 grupos cobrindo opportunities/opportunity_phases/profiles + schema integration). **Write-only mode** — suite em skip mode até `.env.test` apontar para Supabase Cloud de teste. Detalhes em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-04-SUMMARY.md`.
- [x] 07.5-05-PLAN.md — Wave 4: Security headers em `proxy.ts` + audit de service-role + whitelist em queries [Bloco E, HARDEN-E-01..06] — **DONE 2026-05-22** (5min, 2 commits c760809 proxy.ts headers + 17e2272 queries whitelist)
- [x] 07.5-06-PLAN.md — Wave 5: Hardening do formulário público (migration 0007 + Turnstile + BotID + logging) [Bloco D, HARDEN-D-01..04, D-06, D-07; D-05 manual-only] — **DONE 2026-05-22** (~17min, 8 commits f4f17f9..b98bf6d). 4 camadas de defesa: BotID edge + Cloudflare Turnstile invisível + Server Action com log/pt-BR genérico + RPC `create_public_opportunity` com length/array/jsonb limits. IP hashed por construção (THROW sem `IP_HASH_SALT`). **Write-only mode** — migration 0007 + 3 env vars Vercel (NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY + IP_HASH_SALT) pendentes de setup manual. Detalhes em `.planning/phases/07.5-hardening-seguranca-mvp/07.5-06-SUMMARY.md`.

**Dependências entre plans:**
- 02, 03, 05 dependem só de 01 (infra de testes)
- 04 depende de 01 + 02 + 03 (testes RLS usam infra + seq_id atômico + schema strict)
- 06 depende de 01 + 02 + 03 + 05 (form público usa todas as defesas, inclusive CSP do Plan 05)

**Tasks com [BLOCKING] schema push:** Plan 02 (migration 0006) e Plan 06 (migration 0007) — pedem confirmação humana antes de aplicar.

## Phase 7.6 — Plans (planejados em 2026-05-26)

**Goal:** Tirar do usuário final a responsabilidade de preencher campos técnicos (Automação + Priorização) e transferi-la para pós-processamento OpenAI server-side disparado via `after()` do Next.js. Usuário NUNCA sabe que existe IA — vê só um formulário menor. Bloqueia Phase 8 (deploy).

**Plans:** 6 plans em 4 waves (paralelismo otimizado em waves 2-3).

Plans:
- [ ] 07.6-01-PLAN.md — Wave 0: Infra (npm install openai + `serviceRoleClient()` em lib/supabase/server.ts + migration 0010 + handoff doc + OPPORTUNITY_COLUMNS update) [AI-DB-01, AI-DB-02, AI-RLS-01, HARDEN-E-06-EXT]. Inclui **[BLOCKING] apply manual** da migration 0010 no Supabase Cloud Dashboard SQL Editor.
- [ ] 07.6-02-PLAN.md — Wave 1: Pipeline IA (`lib/ai/schema.ts` Zod 9 campos + `lib/ai/prompts.ts` builder anti prompt-injection + `lib/ai/enrichment.ts` wrapper completo com gpt-4o-mini + parse + zodResponseFormat + WHERE defensivo triplo + testes mockados via `vi.mock('openai')`) [AI-MODEL-01, AI-RLS-01, AI-IDEMP-01, AI-TEST-01, AI-TEST-02].
- [ ] 07.6-03-PLAN.md — Wave 2: Server Action integration (campos enriquecidos viram opcionais em `opportunityInputSchema` + `createOpportunity`/`createPublicOpportunity` disparam `after(enrichOpportunity)` envolto em try/catch + testes mockam `next/server.after` para verificar wiring) [AI-ASYNC-01, AI-SCHEMA-OPT-01].
- [ ] 07.6-04-PLAN.md — Wave 3: Wizard refactor (remover steps `automacao` e `priorizacao` de `STEPS_COMMON`, `STEPS_PERSONA_EXTRA`, `STEPS_FORMULARIO_EXTRA` em `state.ts` + remover branch validateStep priorizacao + componentes `AutomacaoStep`/`PriorizacaoStep` PRESERVADOS para mode='edit' + testes puros sobre `stepsFor()`) [AI-WIZARD-01]. **Paralelo com 05 e 06.**
- [ ] 07.6-05-PLAN.md — Wave 3: PublicForm refactor (reduzir `app/r/[slug]/PublicForm.tsx` de 6 para 2-3 steps; remover campos enriquecidos do `FormState`/`initialState`/submit payload; Turnstile widget INTACTO via 7.5 Plan 06; testes via regex sobre source code) [AI-PUB-01]. **Paralelo com 04 e 06.**
- [ ] 07.6-06-PLAN.md — Wave 3: Modal badge + smoke E2E (componente novo `AiEnrichmentBadge.tsx` com 3 estados pt-BR pending/failed/enriched + integração em `ModalHeader.tsx` ao lado do StatusSelector + instalar `@testing-library/react` + `jsdom` + tests + `checkpoint:human-verify` para smoke A wizard interno + smoke B form público + smoke C path de falha com `OPENAI_API_KEY` inválida) [AI-UI-01, AI-ADMIN-01]. **Paralelo com 04 e 05.**

**Dependências entre plans (encoded em frontmatter `depends_on`):**
- Wave 0: Plan 01 sozinho (sem deps; bloqueia tudo).
- Wave 1: Plan 02 depende de 01 (precisa do openai npm pkg + `serviceRoleClient()` para implementar enrichment).
- Wave 2: Plan 03 depende de 01 + 02 (importa `enrichOpportunity` de Plan 02).
- Wave 3: Plans 04, 05, 06 dependem só de 01 (no overlap de arquivos entre eles → paralelos). Plan 06 também depende de 02 + 03 (smoke checkpoint precisa do pipeline funcionando).

**Tasks com [BLOCKING] schema push:** Plan 01 Task 6 (migration 0010 — `add column ai_enrichment_status` + DROP/CREATE view `opportunities_with_score`).
**Tasks com [BLOCKING] smoke verification:** Plan 06 Task 3 (smoke E2E manual com `OPENAI_API_KEY` real).

**User setup pendente antes de executar:**
- `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` (gerado em Supabase Dashboard → Project Settings → API → service_role)
- `OPENAI_API_KEY` em `.env.local` populado com chave real (gerado em https://platform.openai.com/api-keys; já presente vazio em `.env.example` e `.env.local`)
- Aplicar migration 0010 no Dashboard SQL Editor + rodar `npm run gen:types` (gates de Plan 01 Task 6)

## Requisitos validados (mapeados de PROJECT.md)

Cada requisito de PROJECT.md → uma ou mais fases:

| Requisito | Phase(s) |
|---|---|
| Autenticação por tenant | 2 |
| Listagem em 3 views (Tabela/Cards/Kanban) | 3, 5 |
| CRUD via wizard multi-step | 6 |
| Dois tipos (persona/formulário) com schemas próprios | 1 (schema), 6 (UI) |
| Pipeline de 8 status | 1 (enum), 5 (UI), 8 (timeline) |
| Score calculado | 1 (função SQL), 3 (exibir) |
| Fases com datas | 1 (tabela), 8 (UI + trigger) |
| Filtros + busca + ordenação | 7 |
| KPIs no topo | 7 |
| Modal de detalhe com edição inline | 4, 6, **7.6 (badge AI + edit dos 9 campos enriquecidos)** |
| Deploy em produção | 8 |
| **Defesa contra vazamento entre tenants** | **7.5 (Bloco A)** |
| **Validação centralizada anti-Mass Assignment** | **7.5 (Bloco B)** |
| **Atomicidade `seq_id` (race condition)** | **7.5 (Bloco C)** |
| **Hardening do formulário público anônimo** | **7.5 (Bloco D)** |
| **Headers de segurança + audit de segredos** | **7.5 (Bloco E)** |
| **Enriquecimento server-side por IA dos campos técnicos** | **7.6 (Blocos A–F)** |

## Ordem das Phases

A ordem é por dependência prática, não por importância. Cada fase entrega algo testável.

- **Phase 1 antes de tudo**: nada de UI sem schema. **Feito.**
- **Phase 2 antes de qualquer tela com dados**: precisa de auth + tenant pra RLS fazer sentido. Sem isso, queries retornam vazio.
- **Phase 3 antes de Phase 4**: o modal abre a partir de uma linha da lista.
- **Phase 5 (kanban) antes de Phase 8 (fases/timeline)**: a mudança de status pelo kanban dispara o trigger de fase.
- **Phase 6 (CRUD) pode ser paralela a Phase 5**, mas plano sequencial pra evitar context switching.
- **Phase 7 (filtros/KPIs)** depende da lista funcionando (Phase 3).
- **Phase 7.5 (hardening de segurança)** inserida entre 7 e 8 — deploy de produção sem testes de isolamento de tenant + rate limit no formulário público é risco real, não teórico. Bloqueia Phase 8.
- **Phase 7.6 (enriquecimento por IA)** inserida entre 7.5 e 8 (2026-05-26) — wizard precisa ser refatorado antes do deploy (steps "Automação" e "Priorização" deixam de ser inputs do usuário; viram output de OpenAI server-side). Reverte escopadamente a decisão "IA generativa = out-of-scope" do PROJECT.md: IA é auxiliar interno invisível, não feature do produto. Bloqueia Phase 8.
- **Phase 8 (polish/deploy)** é sempre por último.

## Princípios de execução

1. **Fatias verticais** — cada plan entrega front + integração com Supabase + verificação visual. Nada de "Plan X = só schema, Plan Y = só API, Plan Z = só UI".
2. **Mockup como contrato** — quando UI for ambígua, abre `fgcoop-coe-v2.html` no navegador e copia o comportamento. Só evolui depois da paridade.
3. **RLS first** — toda query nova passa por teste cruzado: criar segundo tenant (`acme` de teste), garantir que ele NÃO vê dados do FGCoop.
4. **Cada plan tem checkpoint visual** — `npm run dev` rodando + verificação humana antes de marcar plan como complete.

## Pós-MVP (fora desta milestone)

Listado em PROJECT.md → Out of Scope. Resumo:

- Admin panel cross-tenant
- Integração viva com n8n/RPA
- IA generativa
- Notificações por e-mail
- Audit log
- Importação CSV
- Mobile nativo

---
*Última atualização: 2026-05-26 — Phase 7.6 planejada em 6 plans/4 waves. `/gsd-plan-phase 7.6` produziu plans `07.6-01-PLAN.md` a `07.6-06-PLAN.md` em `.planning/phases/07.6-enriquecimento-ia-oportunidades/`. Próximo: rodar Plan 01 (Wave 0 — `npm install openai` + `serviceRoleClient()` + migration 0010 + [BLOCKING] apply manual + handoff doc), depois Plans 02 (Wave 1, depende de 01) → 03 (Wave 2, depende de 02) → 04+05+06 em paralelo (Wave 3, todos dependem só de 01 com 06 também dependendo de 02+03 para smoke).*
