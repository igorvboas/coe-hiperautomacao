---
schema_version: 1
open_count: 9
waived_count: 0
fixed_count: 0
total_count: 9
last_updated: 2026-08-06T21:03:11.095Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 16 | deviation | tests/opportunities/report-strategic.test.ts | 107 | typecheck pre-existente TS2322 (null not assignable), nao relacionado a 16-01, confirmado no main antes das alteracoes | open |  | 2026-08-05T13:32:43.937Z |  |
| 2 | 16 | unrun-verify | tests/schema/task-depth-guard.test.ts |  | Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real | open |  | 2026-08-05T13:54:59.404Z |  |
| 3 | 16 | unrun-verify | tests/schema/task-tenant-coherence.test.ts |  | Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real | open |  | 2026-08-05T13:54:59.460Z |  |
| 4 | 16 | unrun-verify | tests/security/opportunity-tasks-isolation.test.ts |  | Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real | open |  | 2026-08-05T13:54:59.510Z |  |
| 5 | 16 | unrun-verify | tests/security/opportunity-tasks-viewer-write.test.ts |  | Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real | open |  | 2026-08-05T13:54:59.558Z |  |
| 6 | 17 | lint-warning | tests/opportunities/report-strategic.test.ts | 107 | npm run typecheck falha (TS2322 null vs number\|undefined) — pre-existente ao Plan 17-01, fora de escopo (introduzido em aaf8e5a) | open |  | 2026-08-06T18:26:26.914Z |  |
| 7 | 17 | unrun-verify | tests/security/psw-staff-isolation.test.ts |  | Suite skipada localmente (sem .env.test) — os 5 specs decisivos (inclusive o negativo ACCESS-04) ficam em describe.skipIf ate .env.test ser populado; RED esperado com banco real ate a 0040 ser aplicada (Plan 17-03) | open |  | 2026-08-06T18:54:13.525Z |  |
| 8 | 17 | unrun-verify | tests/security/psw-staff-isolation.test.ts |  | Migration 0040 ja aplicada e os 4 smoke tests do trigger + o negativo decisivo (1 de 43) rodaram via SQL manual na Task 3, mas a suite Vitest continua em describe.skipIf: .env.test ausente. CORRIGIDO pelo orquestrador: as fixtures COLIDEM com UUIDs de producao — FGCOOP_TEST_ID e 11111111-... , o mesmo id do tenant FGCoop real da migration 0002, e aaaaaaaa-... e o admin.fgcoop@pswdigital.com.br. Com upsert onConflict:'id', apontar .env.test para producao RENOMEIA o FGCoop real e cleanupTestTenants() APAGA as oportunidades reais dele. Nao e 'perigoso', e destrutivo na primeira execucao. Exige projeto Supabase separado E, antes disso, trocar os UUIDs das fixtures por faixa que nao colida. Ver .planning/todos/pending/fixtures-colidem-com-producao.md | open |  | 2026-08-06T21:03:11.047Z |  |
| 9 | 17 | unrun-verify | .planning/phases/17-acesso-multi-tenant-do-staff-psw-por-atribui-o/17-03-PLAN.md |  | Task 4 <human-check> (fecho visual do tracer: login como psw_staff em /opportunities mostrando as 2 oportunidades atribuidas de tenants distintos e ocultando a nao atribuida) nao foi executado nesta sessao — sem acesso a browser interativo. A prova comportamental equivalente foi feita via SQL (smoke 7: 1 de 43), mas o fecho visual explicito da UI segue pendente de confirmacao humana. | open |  | 2026-08-06T21:03:11.095Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "16",
    "file": "tests/opportunities/report-strategic.test.ts",
    "line": 107,
    "description": "typecheck pre-existente TS2322 (null not assignable), nao relacionado a 16-01, confirmado no main antes das alteracoes",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T13:32:43.937Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "16",
    "file": "tests/schema/task-depth-guard.test.ts",
    "line": null,
    "description": "Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T13:54:59.404Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "16",
    "file": "tests/schema/task-tenant-coherence.test.ts",
    "line": null,
    "description": "Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T13:54:59.460Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "unrun-verify",
    "phase": "16",
    "file": "tests/security/opportunity-tasks-isolation.test.ts",
    "line": null,
    "description": "Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T13:54:59.510Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "16",
    "file": "tests/security/opportunity-tasks-viewer-write.test.ts",
    "line": null,
    "description": "Suíte skipada localmente (sem .env.test) — precisa rodar contra Supabase Cloud de teste para veredito verde real",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T13:54:59.558Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "lint-warning",
    "phase": "17",
    "file": "tests/opportunities/report-strategic.test.ts",
    "line": 107,
    "description": "npm run typecheck falha (TS2322 null vs number|undefined) — pre-existente ao Plan 17-01, fora de escopo (introduzido em aaf8e5a)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T18:26:26.914Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "17",
    "file": "tests/security/psw-staff-isolation.test.ts",
    "line": null,
    "description": "Suite skipada localmente (sem .env.test) — os 5 specs decisivos (inclusive o negativo ACCESS-04) ficam em describe.skipIf ate .env.test ser populado; RED esperado com banco real ate a 0040 ser aplicada (Plan 17-03)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T18:54:13.525Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "unrun-verify",
    "phase": "17",
    "file": "tests/security/psw-staff-isolation.test.ts",
    "line": null,
    "description": "Migration 0040 ja aplicada e os 4 smoke tests do trigger + o negativo decisivo (1 de 43) rodaram via SQL manual na Task 3, mas a suite Vitest continua em describe.skipIf: .env.test ausente. CORRIGIDO pelo orquestrador: as fixtures COLIDEM com UUIDs de producao — FGCOOP_TEST_ID e 11111111-... , o mesmo id do tenant FGCoop real da migration 0002, e aaaaaaaa-... e o admin.fgcoop@pswdigital.com.br. Com upsert onConflict:'id', apontar .env.test para producao RENOMEIA o FGCoop real e cleanupTestTenants() APAGA as oportunidades reais dele. Nao e 'perigoso', e destrutivo na primeira execucao. Exige projeto Supabase separado E, antes disso, trocar os UUIDs das fixtures por faixa que nao colida. Ver .planning/todos/pending/fixtures-colidem-com-producao.md",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T21:03:11.047Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "17",
    "file": ".planning/phases/17-acesso-multi-tenant-do-staff-psw-por-atribui-o/17-03-PLAN.md",
    "line": null,
    "description": "Task 4 <human-check> (fecho visual do tracer: login como psw_staff em /opportunities mostrando as 2 oportunidades atribuidas de tenants distintos e ocultando a nao atribuida) nao foi executado nesta sessao — sem acesso a browser interativo. A prova comportamental equivalente foi feita via SQL (smoke 7: 1 de 43), mas o fecho visual explicito da UI segue pendente de confirmacao humana.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T21:03:11.095Z",
    "resolved_at": null
  }
]
````
