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


---

# Milestone v0.2 — Roadmap (Evolução do Modelo / Workshop I — Unidasul)

> Evolução do produto do contrato `fgcoop-coe-v2.html` (v0.1) para o novo contrato `_giba_wsi-dashboard.html` — score de 5 fatores, FTE, RPA Fit, registro de riscos e view de Relatório, aplicado globalmente a todos os tenants.
>
> Fonte da verdade do escopo: [.planning/PROJECT.md](PROJECT.md) → "Current Milestone: v0.2". Requisitos: [.planning/REQUIREMENTS.md](REQUIREMENTS.md). Fonte da verdade visual/modelo: [`_giba_wsi-dashboard.html`](../_giba_wsi-dashboard.html).
>
> **Numeração:** continua a partir do v0.1 (que terminou na Phase 8). A primeira fase do v0.2 é a **Phase 9**.
>
> **Granularidade:** standard (7 fases). **Cobertura:** 35/35 REQ-IDs mapeados.
>
> **Carryover v0.1 (não faz parte deste roadmap):** Phase 7.6 (Enriquecimento por IA) será REALINHADA aos novos campos do v0.2 antes de executar (REALIGN-7.6). Deploy de produção foi ADIADO (Future Requirements) — **não há fase de deploy no v0.2**.

## Phases

- [x] **Phase 9: Schema Evolution + Score/Risk/Contract Foundation** ✅ — Migration `0011` aplicada (write-only): `opportunities` evoluída (7 col + `rpa_score` GENERATED + `tempo`→frequência), `opportunity_score()` 5 fatores, view recriada, backfill FGCoop (29, escopado ao tenant), `opportunity_risks` (tenant_id + RLS + priority via trigger). Contrato trocado p/ `_giba`, `fgcoop` deprecated. Validado por dry-run 11/11.
- [x] **Phase 10: Backend — Queries, Validação e Paridade de Score** ✅ — Tipos pós-0011 (hand-derived, verificados vs catálogo vivo), Zod aditivo (criterios minúsculo, tempo→frequência, campos novos, mass-assignment preservado), whitelist ampliada, `riskInputSchema`. SCORE-04: fórmula única `lib/opportunities/score.ts` (cliente=backend, paridade validada ao vivo 100/88/59/36/67). Migration `0012` (RPC pública → frequência, dropa overload duplicado). tsc 0 erros, suíte 109 passed/0 failed.
- [ ] **Phase 11: Wizard de Fluxo Único (5 steps)** — Substitui o split persona/formulário por um wizard de 5 steps com critérios, benefícios, FTE e priorização de 5 fatores.
- [ ] **Phase 12: Registro de Riscos (UI do modal)** — Aba "Risco" do modal: criar/editar/remover riscos com prioridade auto-calculada pela matriz impacto×probabilidade.
- [ ] **Phase 13: Atualizações de Tela (KPI / Tabela / Kanban / Modal)** — KPI FTE Total/mês, novas colunas e ordenação na tabela, FTE somado no kanban e modal com 8 abas alinhadas ao novo modelo.
- [ ] **Phase 14: View "Relatório"** — Dashboard analítico: cards de portfólio, distribuição por área (barras qtd + FTE) e 2 pie charts SVG.
- [ ] **Phase 15: Seed dos Dados Reais do Workshop I (Unidasul)** — Importa as 64 oportunidades do Workshop I como seed de um tenant "Unidasul", isolado por tenant.

## Phase Details

### Phase 9: Schema Evolution + Score/Risk/Contract Foundation
**Goal**: O banco passa a suportar o novo modelo (FTE, RPA Fit, fonte, tipoProcesso, benefício qualitativo, 8 critérios first-class, score de 5 fatores e registro de riscos), aplicado a todos os tenants sem perda de dados — e o contrato visual/modelo é oficialmente trocado.
**Depends on**: Phase 8 (v0.1 — schema base existente)
**Requirements**: MODEL-01, MODEL-02, MODEL-03, MODEL-04, MODEL-05, MODEL-06, MODEL-07, MODEL-08, MODEL-09, MODEL-10, SCORE-01, SCORE-02, SCORE-03, RISK-04, CONTRACT-01, CONTRACT-02
**Success Criteria** (what must be TRUE):
  1. Uma migration aplicada (write-only mode: arquivo + handoff de apply manual no Supabase Cloud SQL Editor) adiciona `fteHoras`, `rpaScore`, `fonte`, `tipoProcesso`, `beneficioQualitativo` e os 8 critérios first-class (SIM/NÃO/PARCIAL) às oportunidades, com backfill dos critérios antigos de `formulario_extras` sem perda de dados.
  2. A função `opportunity_score()` recriada retorna 5 fatores × 20 = 100 (esforço + complexidade + tempo[frequência] + objetivo + fte) batendo com `_giba:483-490`; a view `opportunities_with_score` expõe `score` + `priority_level` (alta ≥70 / média 40–69 / baixa <40). Score continua calculado em runtime, nunca persistido em coluna.
  3. `rpaScore` (0–6) é derivado dos 8 critérios por regra determinística documentada (em função SQL ou na view), não persistido como input manual arbitrário.
  4. A tabela `opportunity_risks` existe com `tenant_id not null` + RLS ativado e as 4 policies padrão (select/insert/update/delete por `current_tenant_id()`); um teste cruzado confirma que tenant A não enxerga riscos do tenant B.
  5. `_giba_wsi-dashboard.html` está documentado como a fonte da verdade visual/modelo e o `CLAUDE.md` reflete a nova fórmula de score, o novo modelo e o novo wizard; `fgcoop-coe-v2.html` está marcado como deprecated.
**Plans**: 3 plans (planejados em 2026-06-04) — Wave 0: 01 (migration) ‖ 02 (docs); Wave 1: 03 (testes)
- [ ] 09-01-PLAN.md — Migração 0011 (enums, colunas, rpa_score GENERATED, tempo→frequência, opportunity_score 5-fatores, backfill FGCoop, opportunity_risks + RLS) + handoff de apply manual [BLOCKING]
- [ ] 09-02-PLAN.md — Troca de contrato: CLAUDE.md (nova fórmula/modelo/wizard/risco) + fgcoop-coe-v2.html marcado deprecated
- [ ] 09-03-PLAN.md — Validação: testes de regra puros (rpa_score, score, matriz priority) + isolamento cross-tenant A≠B em opportunity_risks (skipIf)

### Phase 10: Backend — Queries, Validação e Paridade de Score
**Goal**: A camada de aplicação (queries de leitura, server actions de mutação, Zod schema e tipos gerados) cobre o novo modelo, e o preview de score exibido no cliente é idêntico ao calculado no backend.
**Depends on**: Phase 9
**Requirements**: SCORE-04
**Success Criteria** (what must be TRUE):
  1. Tipos TypeScript regenerados (`gen:types`) expõem os novos campos e a tabela `opportunity_risks`; as queries de leitura selecionam os novos campos via whitelist de colunas (sem `select('*')` cego).
  2. O `opportunityInputSchema` (Zod `.strict()` / discriminatedUnion) aceita e valida `fteHoras`, `rpaScore`, `fonte`, `tipoProcesso`, `beneficioQualitativo`, os 8 critérios e o bucket `prioridade.fte`, rejeitando campos não reconhecidos (defesa anti mass-assignment preservada).
  3. O preview de score calculado no cliente (durante o wizard) produz exatamente o mesmo número que `opportunity_score()` no backend para o mesmo input — verificado por um teste de paridade que compara as duas fórmulas em casos representativos.
  4. O schema permanece compatível com o enrichment por IA (MODEL-10): campos derivados são preenchíveis manualmente agora e por IA depois, sem exigir refatoração de schema.
**Plans**: 4 plans (planejados em 2026-06-04) — Wave 1: 01 (tipos+RPC) ‖ 02 (paridade score); Wave 2: 03 (schema+whitelist); Wave 3: 04 (testes legados+AI-compat)
- [ ] 10-01-PLAN.md — Regen de tipos (MCP) + migration 0012 (RPC create_public_opportunity p_tempo→frequency_bucket, BLOCKING apply) + remoção dos any-casts do teste de riscos [SC1, D-04]
- [ ] 10-02-PLAN.md — Paridade SCORE-04: módulo único lib/opportunities/score.ts + rewire do ScorePreview + teste de paridade 2 níveis (puro + skipIf SQL contra opportunity_score()) [SCORE-04, D-01]
- [ ] 10-03-PLAN.md — opportunityInputSchema aditivo (campos novos + criterios minúsculo + tempo frequência + bucket prioridade.fte) + riskInputSchema + whitelist OPPORTUNITY_COLUMNS ampliada [SC1, SC2, D-02, D-03]
- [ ] 10-04-PLAN.md — Migração dos ~7 testes legados ao domínio de frequência + verificação MODEL-10/SC4 (AI-compat) + suite/tsc verdes [SC4, D-04]

### Phase 11: Wizard de Fluxo Único (5 steps)
**Goal**: O usuário cria uma oportunidade por um único wizard de 5 steps que coleta identificação, processo, os 8 critérios, os 8 benefícios + FTE e a priorização de 5 fatores — substituindo o split persona/formulário.
**Depends on**: Phase 10
**Requirements**: WIZARD-01, WIZARD-02, WIZARD-03, WIZARD-04
**Success Criteria** (what must be TRUE):
  1. Ao criar uma oportunidade, o usuário percorre exatamente 5 steps na ordem Identificação → Processo → Critérios → Benefícios → Priorização (sem ramificação persona/formulário).
  2. O step "Critérios" coleta os 8 critérios com valores SIM/NÃO/PARCIAL; o step "Benefícios" coleta os 8 benefícios em escala 1–5 mais a estimativa de FTE em horas/mês.
  3. O step "Priorização" coleta os 5 fatores de score, incluindo o bucket de FTE, com os pesos visíveis ao usuário, e exibe o score resultante.
  4. Validações por step bloqueiam o avanço quando faltam campos obrigatórios (nome + área no step 1; processo no step 2), com mensagem clara em pt-BR.
**Plans**: 3 plans (planejados em 2026-06-04, plan-checker PASSED 1ª passada) — Wave 1: 01 (fundação); Wave 2: 02 ‖ 03 (zero overlap)
- [x] 11-01-PLAN.md — Fundação: `lib/opportunities/fte.ts` `deriveFteBucket` (horas→bucket, fonte única, teste de bordas) + `state.ts` fluxo único create (5 steps, sempre `source='formulario'`, sem Tipo/Classificação) + `validateStep` Identificação(nome+área)/Processo(processo) pt-BR [WIZARD-01, WIZARD-04]
- [ ] 11-02-PLAN.md — Rewrite Critérios + Benefícios p/ modelo first-class v0.2: 8 chaves camelCase em `data.criterios`(sim/nao/parcial, click-to-cycle) e `data.beneficios`(1–5, barras) + captura de `fte_horas`; remove gravação em `formulario_extras` [WIZARD-03, WIZARD-04]
- [ ] 11-03-PLAN.md — Processo: Frequência→select que alimenta `tempo` (fonte única, resolve redundância) + Ferramenta (default n8n); Priorização: 4 fatores manuais com pesos + display read-only do bucket FTE derivado + `ScorePreview` recebe `fte`; `WizardShell` deriva `prioridade_fte` no submit (persiste o 5º fator) [WIZARD-01, WIZARD-02]
**UI hint**: yes

### Phase 12: Registro de Riscos (UI do modal)
**Goal**: Dentro do modal de uma oportunidade, o usuário gerencia riscos estruturados — cadastra, edita e remove — com prioridade auto-calculada pela matriz impacto×probabilidade.
**Depends on**: Phase 9 (tabela `opportunity_risks`), Phase 10 (server actions / validação)
**Requirements**: RISK-01, RISK-02, RISK-03, RISK-05
**Success Criteria** (what must be TRUE):
  1. Na aba "Risco" do modal, o usuário cadastra um risco com descrição, tipo (Impedimento/Risco/Oportunidade), responsável (PSW/UnidaSul), impacto, probabilidade, status (Novo/Gerenciado/Mitigado/Ocorrido), resposta ao risco e descrição do impacto.
  2. A prioridade do risco (Crítica/Alta/Média/Baixa) é exibida automaticamente conforme a matriz impacto×probabilidade de `_giba:1180-1185`, sem o usuário escolhê-la manualmente.
  3. O usuário edita e remove riscos existentes de uma oportunidade, e as mudanças persistem (refletem após reabrir o modal).
  4. A aba "Risco" lista os riscos da oportunidade em tabela com ID (Rxxx), descrição, tipo, responsável, impacto, probabilidade, prioridade, status e ações.
**Plans**: TBD
**UI hint**: yes

### Phase 13: Atualizações de Tela (KPI / Tabela / Kanban / Modal)
**Goal**: As telas existentes (KPI bar, tabela, kanban e modal de detalhe) refletem o novo modelo — FTE, frequência, complexidade, RPA Fit e novo score — em paridade com `_giba_wsi-dashboard.html`.
**Depends on**: Phase 10 (dados do novo modelo disponíveis no front)
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05
**Success Criteria** (what must be TRUE):
  1. A KPI bar exibe FTE Total/mês mais contadores de Novos/Produção/Concluídos.
  2. A tabela exibe as colunas Frequência, Pessoas, Complexidade, FTE/mês e RPA Fit; a ordenação oferece classificar por FTE e pelo novo score.
  3. No kanban (Gestão à Vista), cada coluna de status mostra o FTE somado das oportunidades naquela coluna.
  4. O modal de detalhe exibe as 8 abas alinhadas ao novo modelo (Processo / Critérios / Automação / Benefícios / Score / Fases / Risco / Observação).
**Plans**: TBD
**UI hint**: yes

### Phase 14: View "Relatório"
**Goal**: O usuário acessa uma nova view analítica "Relatório" que sintetiza o portfólio de oportunidades em cards, distribuição por área e gráficos de pizza.
**Depends on**: Phase 10 (dados agregáveis do novo modelo)
**Requirements**: REPORT-01, REPORT-02, REPORT-03, REPORT-04
**Success Criteria** (what must be TRUE):
  1. Uma nova view "📈 Relatório" é selecionável pelo seletor de views da toolbar.
  2. A view exibe cards de portfólio: total de oportunidades, FTE Total/mês, prioridade Alta/Média, RPA Ideal, RPA+n8n e nº de áreas.
  3. A view mostra a distribuição por área de negócio com barras de quantidade somada ao FTE estimado por área.
  4. A view renderiza dois pie charts SVG: oportunidades por área e FTE por área.
**Plans**: TBD
**UI hint**: yes

### Phase 15: Seed dos Dados Reais do Workshop I (Unidasul)
**Goal**: As 64 oportunidades reais do Workshop I existem no sistema como dados de um tenant "Unidasul", isolado dos demais tenants.
**Depends on**: Phase 9 (schema novo pronto — o import depende dos novos campos), Phase 10 (validação do novo modelo)
**Requirements**: DATA-01
**Success Criteria** (what must be TRUE):
  1. Existe um tenant "Unidasul" e as 64 oportunidades do Workshop I aparecem associadas a ele (migration de dados isolada por tenant).
  2. As oportunidades importadas trazem os novos campos preenchidos (fonte = "Workshop I", critérios, benefícios, FTE), e o score/`priority_level`/`rpaScore` calculam corretamente sobre elas.
  3. Um usuário de outro tenant não enxerga nenhuma das 64 oportunidades da Unidasul (verificação cruzada de RLS).
**Plans**: TBD

## Progresso v0.2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. Schema Evolution + Score/Risk/Contract Foundation | 3/3 | ✅ Done | 2026-06-04 |
| 10. Backend — Queries, Validação e Paridade de Score | 4/4 | ✅ Done | 2026-06-04 |
| 11. Wizard de Fluxo Único (5 steps) | 1/3 | In Progress|  |
| 12. Registro de Riscos (UI do modal) | 0/? | Not started | - |
| 13. Atualizações de Tela (KPI/Tabela/Kanban/Modal) | 0/? | Not started | - |
| 14. View "Relatório" | 0/? | Not started | - |
| 15. Seed dos Dados Reais do Workshop I (Unidasul) | 0/? | Not started | - |

## Ordem das Phases (v0.2)

Schema-first, como no v0.1. A ordem é por dependência prática:

- **Phase 9 antes de tudo**: nada de UI/backend sem o schema novo. MODEL + SCORE(SQL) + RISK(tabela) são fundação; CONTRACT dobrado aqui (trocar a fonte da verdade junto com o schema que ela descreve). Migration em **write-only mode** (arquivo + handoff de apply manual no Supabase Cloud — padrão do v0.1).
- **Phase 10 sobre o schema**: queries, server actions, Zod e tipos. SCORE-04 (paridade cliente/servidor) vive aqui porque depende da fórmula SQL já existir (Phase 9) e do preview do cliente já ser implementável.
- **Phase 11 (wizard) sobre o backend**: o wizard grava via as server actions/validação da Phase 10 e usa o preview de score da Phase 10.
- **Phase 12 (riscos UI) depende de 9 (tabela) + 10 (actions)**: pode ser paralela a 11 (arquivos distintos), mas plano sequencial para evitar context switching.
- **Phase 13 (telas) depende de 10**: exibe o novo modelo nas views existentes.
- **Phase 14 (Relatório) depende de 10**: agrega o novo modelo; independente de 11/12/13 (nova view).
- **Phase 15 (seed Unidasul) por último entre as de dados**: depende do schema novo (9) e da validação (10); fecha o milestone com dados reais. **Sem fase de deploy** — adiada para milestone próprio.

## Restrições aplicadas (de PROJECT.md / CLAUDE.md)

1. **Multi-tenant via RLS**: a nova tabela `opportunity_risks` carrega `tenant_id` + RLS com policy padrão `tenant_id = current_tenant_id()`. Todo critério de sucesso de tabela nova inclui verificação cruzada A≠B.
2. **Score calculado, nunca persistido**: a função SQL muda, mas score não vira coluna (Phase 9 SC2).
3. **Stack**: Next.js 16 (App Router) + Supabase + Vercel; Server Components por padrão; `"use client"` só em wizard/modal/kanban/relatório interativos.
4. **Deploy fora de escopo**: nenhuma fase de deploy no v0.2 (Future Requirements / DEPLOY).
5. **Write-only mode para migrations**: arquivo + handoff manual no SQL Editor do Supabase Cloud (Key Decisions v0.1).

---
*Seção v0.2 criada em 2026-06-04 pelo gsd-roadmapper. 7 fases (9–15), 35/35 REQ-IDs mapeados. Próximo: `/gsd-plan-phase 9`.*
