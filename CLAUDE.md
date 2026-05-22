# CLAUDE.md — CoE Hiperautomação

Instruções específicas deste projeto para o Claude Code. Para a visão de produto, requisitos e decisões consulte sempre [.planning/PROJECT.md](.planning/PROJECT.md). Para o estado atual da execução, [.planning/STATE.md](.planning/STATE.md).

## O que estamos construindo

SaaS multi-tenant de gestão de pipeline de automações. O cliente loga e enxerga **apenas** as demandas da sua empresa. Esqueleto visual já validado em [fgcoop-coe-v2.html](fgcoop-coe-v2.html) (mockup estático — fonte da verdade para UI e modelo de dados). Stack-alvo: Next.js 16 + Supabase + Vercel.

## Workflow (Get Shit Done)

O time usa o framework GSD (pasta [get-shit-done/](get-shit-done/)). Convenções:

- Todo estado do projeto vive em `.planning/` — `PROJECT.md`, `STATE.md` e (futuramente) `ROADMAP.md`, `milestones/v0.1/phases/...`.
- Antes de começar trabalho, leia `.planning/STATE.md` para saber em que fase está.
- Para criar um novo plano de fase use `/gsd-plan-phase`. Para executar use `/gsd-execute-phase`.
- Não invente artefatos fora de `.planning/` — se precisar de um doc novo, siga o template em `get-shit-done/sdk/prompts/templates/`.

## Idioma

- **UI e textos visíveis ao usuário final**: pt-BR (cliente brasileiro).
- **Código** (variáveis, tabelas, colunas, nomes de função): inglês. Ex: `opportunity`, `tenant_id`, `current_status`, não `oportunidade_id`.
- **Mensagens de commit, PR e documentação interna**: pt-BR está OK; manter consistente.

## Princípios não-negociáveis

### 1. Isolamento multi-tenant é existencial

- Toda tabela de domínio carrega `tenant_id uuid not null` com FK para `tenants(id)`.
- Toda tabela tem **Row Level Security ativado** e policies que filtram por `tenant_id = (select tenant_id from users where id = auth.uid())`.
- Nenhuma query no backend pode esquecer o filtro — confiar no RLS como defesa em profundidade, mas filtrar explícito quando possível.
- Em testes, sempre rodar pelo menos um caso "tenant A não vê dados de tenant B".

### 2. O mockup é o contrato visual

[fgcoop-coe-v2.html](fgcoop-coe-v2.html) é a especificação visual + modelo de dados. Antes de evoluir/melhorar UI, replique a estrutura exibida ali. Mudanças de layout só após paridade.

### 3. Score é calculado, nunca persistido

A fórmula está em [fgcoop-coe-v2.html:410-413](fgcoop-coe-v2.html#L410-L413):

```
em = {baixo:25, medio:15, alto:5}
cm = {baixo:25, medio:15, alto:5}
tm = {pequeno:25, medio:15, grande:5}
score = em[esforco] + cm[complexidade] + tm[tempo] + (min(5,objetivo)/5)*25
```

Persistir o score gera bug quando a fórmula mudar. Calcular no SELECT (view ou função SQL) ou no client.

### 4. Admin / cross-tenant fica para depois

Não criar rotas, páginas ou queries que cruzem tenants no MVP. Se for inevitável, marque com `// TODO: admin-only — milestone pós-MVP` e abra issue.

## Stack & convenções de código

- **Next.js 16** (App Router). Server Components por padrão; `"use client"` só onde for necessário (forms, modais, kanban interativo).
- **Tailwind + shadcn/ui** para a UI. Para componentes idiossincráticos do mockup (kanban, modal multi-aba) compor a partir de primitivos shadcn em vez de reescrever do zero.
- **Supabase JS client** para queries de leitura no cliente; Server Actions / Route Handlers para mutações.
- **TypeScript** estrito (`strict: true`). Tipos gerados via `supabase gen types typescript`.
- **Estrutura de pastas** (proposta inicial):
  - `app/` rotas — `(auth)/login`, `(app)/opportunities`, etc.
  - `components/` componentes compartilhados
  - `lib/` clientes Supabase, helpers, types
  - `supabase/` migrations + seed

## Modelo de dados (esboço, refinar na Fase 2)

```
tenants(id, name, slug, created_at)
users(id, tenant_id, email, role, created_at)  -- role: 'member' (futuro 'admin')
opportunities(
  id, tenant_id, seq_id, tipo,            -- 'persona' | 'formulario'
  solicitante, email, area, subarea, processo,
  frequencia, volume_medio, tempo_execucao, num_pessoas,
  ferramenta,                              -- 'RPA' | 'n8n' | 'ambos'
  status, prioridade (jsonb),              -- {esforco,complexidade,tempo,objetivo}
  persona_extras (jsonb nullable),         -- campos só de persona
  formulario_extras (jsonb nullable),      -- campos só de formulário
  escopo_automacao (text[]), beneficios_esperados (text[]),
  created_at, updated_at, created_by
)
opportunity_phases(
  id, opportunity_id, phase_key,           -- 'em_analise' | 'planejamento' | ...
  started_at, finished_at
)
```

RLS policy padrão em toda tabela com `tenant_id`:
```sql
create policy tenant_isolation on <table>
  for all using (tenant_id = (select tenant_id from users where id = auth.uid()));
```

## Comandos GSD úteis neste projeto

- `/gsd-progress` — onde estamos
- `/gsd-plan-phase` — planejar próxima fase (a partir do roadmap em STATE.md)
- `/gsd-execute-phase` — executar fase planejada
- `/gsd-verify-work` — UAT conversacional
- `/gsd-ship` — PR + review pré-merge

## O que NÃO fazer

- Não criar painel admin / rotas super-admin no MVP.
- Não persistir score calculado.
- Não usar schema-per-tenant — RLS está decidido.
- Não desviar do esqueleto do mockup sem discussão explícita.
- Não adicionar IA generativa ao produto (as personas pedem IA para o trabalho delas — isso é demanda do cliente, não feature da plataforma).
- Não criar tabelas sem `tenant_id` (exceto `tenants` e tabelas globais como `feature_flags`, se existirem).

## Referências externas (auto-injetadas nesta sessão)

- **Next.js App Router**: https://nextjs.org/docs/app
- **Supabase + Next.js**: https://supabase.com/docs/guides/auth/server-side/nextjs
- **Supabase RLS**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **shadcn/ui**: https://ui.shadcn.com
- **Vercel deploy**: https://vercel.com/docs

---
*Última atualização: 2026-05-20 — bootstrap inicial do projeto a partir do mockup.*
