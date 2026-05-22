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
| 7.5 | **Hardening de Segurança MVP** | 🏃 Em execução (1/6) | Testes RLS, Zod centralizado, atomicidade `seq_id`, hardening form público, headers de segurança | **6 plans** (07.5-01 a 07.5-06) |
| 8 | **Polish + Deploy** | ⏸ Aguarda 7.5 | Loading states, error boundaries, responsivo, deploy Vercel | 08-01 a 08-03 |

## Phase 7.5 — Plans (planejados em 2026-05-21)

**Goal:** Endurecer a plataforma contra os vetores de ataque relevantes ao contexto multi-tenant + formulário público anônimo, antes do deploy de produção (Phase 8).

**Plans:** 6 plans em 6 waves (paralelismo limitado — cada plan tem dependência clara).

Plans:
- [x] 07.5-01-PLAN.md — Wave 0: Infraestrutura de testes (Vitest + seed + scripts shell) [HARDEN-INFRA-01..04] — **DONE 2026-05-22** (8min, 4 commits 059cddd..4fdfeac)
- [ ] 07.5-02-PLAN.md — Wave 1: Atomicidade `seq_id` (migration 0006 + teste 50 inserts paralelos) [Bloco C, HARDEN-C-01..03]
- [ ] 07.5-03-PLAN.md — Wave 2: Zod `.strict()` + audit de Mass Assignment em Server Actions [Bloco B, HARDEN-B-01..04]
- [ ] 07.5-04-PLAN.md — Wave 3: Testes de isolamento de tenant (RLS + IDOR cross-tenant) [Bloco A, HARDEN-A-01..05]
- [ ] 07.5-05-PLAN.md — Wave 4: Security headers em `proxy.ts` + audit de service-role + whitelist em queries [Bloco E, HARDEN-E-01..06]
- [ ] 07.5-06-PLAN.md — Wave 5: Hardening do formulário público (migration 0007 + Turnstile + BotID + logging) [Bloco D, HARDEN-D-01..07]

**Dependências entre plans:**
- 02, 03, 05 dependem só de 01 (infra de testes)
- 04 depende de 01 + 02 + 03 (testes RLS usam infra + seq_id atômico + schema strict)
- 06 depende de 01 + 02 + 03 + 05 (form público usa todas as defesas, inclusive CSP do Plan 05)

**Tasks com [BLOCKING] schema push:** Plan 02 (migration 0006) e Plan 06 (migration 0007) — pedem confirmação humana antes de aplicar.

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
| Modal de detalhe com edição inline | 4, 6 |
| Deploy em produção | 8 |
| **Defesa contra vazamento entre tenants** | **7.5 (Bloco A)** |
| **Validação centralizada anti-Mass Assignment** | **7.5 (Bloco B)** |
| **Atomicidade `seq_id` (race condition)** | **7.5 (Bloco C)** |
| **Hardening do formulário público anônimo** | **7.5 (Bloco D)** |
| **Headers de segurança + audit de segredos** | **7.5 (Bloco E)** |

## Ordem das Phases

A ordem é por dependência prática, não por importância. Cada fase entrega algo testável.

- **Phase 1 antes de tudo**: nada de UI sem schema. **Feito.**
- **Phase 2 antes de qualquer tela com dados**: precisa de auth + tenant pra RLS fazer sentido. Sem isso, queries retornam vazio.
- **Phase 3 antes de Phase 4**: o modal abre a partir de uma linha da lista.
- **Phase 5 (kanban) antes de Phase 8 (fases/timeline)**: a mudança de status pelo kanban dispara o trigger de fase.
- **Phase 6 (CRUD) pode ser paralela a Phase 5**, mas plano sequencial pra evitar context switching.
- **Phase 7 (filtros/KPIs)** depende da lista funcionando (Phase 3).
- **Phase 7.5 (hardening de segurança)** inserida entre 7 e 8 — deploy de produção sem testes de isolamento de tenant + rate limit no formulário público é risco real, não teórico. Bloqueia Phase 8.
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
*Última atualização: 2026-05-22 — Phase 7.5 Plan 01 (Wave 0) executado. Próximo: Plan 07.5-02 (Wave 1 — atomicidade `seq_id`).*
