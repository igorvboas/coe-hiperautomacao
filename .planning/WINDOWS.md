---
schema_version: 1
open_count: 15
waived_count: 0
fixed_count: 1
total_count: 16
last_updated: 2026-08-07T17:01:21.633Z
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
| 10 | 17 | unrun-verify | .planning/phases/17-acesso-multi-tenant-do-staff-psw-por-atribui-o/17-04-MIGRATION-HANDOFF.md |  | As 9 verificacoes pos-apply do handoff (contagem exata de policies _psw_staff com lista nominal, presenca de todas as policies pre-existentes por tabela D-09, storage.objects, CHECK e policy de invited_emails, os 2 triggers de opportunity_tasks, smoke de responsavel de tarefa ACCESS-11 com 3 casos, smoke de Storage D-12 com 403, verificacao condicional da 0042/audit_log) NAO foram executadas. O apply foi confirmado por uma verificacao de vazamento diferente, escrita pelo orquestrador (contagem de linhas visiveis/vazadas por tabela filha), mais 3 diagnosticos sem RLS apos a anomalia. ACCESS-11, ACCESS-09, Storage (D-12) e a 0042 permanecem sem prova empirica em producao. | open |  | 2026-08-07T01:04:46.792Z |  |
| 11 | 17 | todo | supabase/migrations/0041_psw_staff_child_access.sql |  | profiles_select_psw_staff (0041, Bloco 3) expoe TODAS as pessoas dos tenants onde o psw_staff tem oportunidade atribuida, nao so as pessoas de fato ligadas as oportunidades atribuidas (assignee/created_by). Funcional e justificado no arquivo (sem ela o select de responsavel de tarefa ACCESS-11 fica vazio), mas e uma exposicao mais larga que o resto da fase. Considerar estreitamento futuro. | open |  | 2026-08-07T01:04:46.843Z |  |
| 12 | 17 | todo | supabase/migrations/0043_tenant_coherence_notes_risks_documents.sql |  | Defeito PRE-EXISTENTE (0011/0018, nao introduzido pela Phase 17) descoberto na verificacao pos-apply da 0041: opportunity_notes, opportunity_risks e opportunity_documents nao tem guarda de coerencia de tenant (equivalente a check_assignee_tenant/check_task_tenant_coherence) — qualquer usuario nao-viewer pode pendurar nota/risco/documento em oportunidade de OUTRO tenant, carimbando o proprio tenant_id. 7 linhas de producao afetadas (5 notas + 2 riscos, tenant_id=PSW penduradas em oportunidades da Unidasul) — integridade/poluicao de dados, nao vazamento de confidencialidade. PO decidiu: migration 0043 (fora do escopo do Plan 17-04) vai adicionar a guarda e corrigir as 7 linhas. | open |  | 2026-08-07T01:04:46.894Z |  |
| 13 | 17 | unrun-verify | tests/security/psw-staff-isolation.test.ts |  | Todos os specs de propagacao/escrita/triggers do Plan 17-05 (tabelas filhas, profiles, check_assignee_tenant, assignee de tarefa, escrita escopada, gate de viewer D-13, invited_emails) foram escritos mas NAO executados nesta sessao — .env.test continua ausente, mesma pendencia carregada desde 17-01. describe.skipIf pula os 38 specs; nenhuma prova empirica contra banco real. | open |  | 2026-08-07T01:55:27.440Z |  |
| 14 | 17 | todo | lib/database.types.ts |  | invited_emails.Insert/Row/Update.role (hand-maintained) ainda e 'member'\|'tenant_admin'\|'viewer' — nao reflete o CHECK ampliado pela 0041 (aceita 'psw_staff' desde entao). tests/security/psw-staff-isolation.test.ts usa @ts-expect-error nos dois inserts com role:'psw_staff' para compilar. Corrigir o tipo exige tambem atualizar app/(app)/admin/invites/page.tsx (Record<InviteRow['role'], string> exaustivo) — fora do escopo do Plan 17-05 (files_modified so lista o arquivo de teste). | fixed |  | 2026-08-07T01:55:39.816Z | 2026-08-07T10:08:51.113Z |
| 15 | 18 | unrun-verify | supabase/migrations/0045_psw_tenant_admins_grant.sql |  | Handoff V10-V13 (nao-regressao member / smokes D-B / EXPLAIN inlining / smoke UPDATE autorizado) nao executadas nesta wave | open |  | 2026-08-07T17:01:12.370Z |  |
| 16 | 18 | skipped-test | tests/security/psw-staff-admin-grant.test.ts |  | 14 testes em describe.skipIf (sem NEXT_PUBLIC_SUPABASE_URL) — modo de prova revertido para prova-por-sql-no-handoff (colisao de UUID entre fixtures e tenant real de producao impede env-test-populado); prova substituta = handoff 18-02 + observacao direta pelo app | open |  | 2026-08-07T17:01:21.633Z |  |

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
  },
  {
    "id": 10,
    "kind": "unrun-verify",
    "phase": "17",
    "file": ".planning/phases/17-acesso-multi-tenant-do-staff-psw-por-atribui-o/17-04-MIGRATION-HANDOFF.md",
    "line": null,
    "description": "As 9 verificacoes pos-apply do handoff (contagem exata de policies _psw_staff com lista nominal, presenca de todas as policies pre-existentes por tabela D-09, storage.objects, CHECK e policy de invited_emails, os 2 triggers de opportunity_tasks, smoke de responsavel de tarefa ACCESS-11 com 3 casos, smoke de Storage D-12 com 403, verificacao condicional da 0042/audit_log) NAO foram executadas. O apply foi confirmado por uma verificacao de vazamento diferente, escrita pelo orquestrador (contagem de linhas visiveis/vazadas por tabela filha), mais 3 diagnosticos sem RLS apos a anomalia. ACCESS-11, ACCESS-09, Storage (D-12) e a 0042 permanecem sem prova empirica em producao.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-07T01:04:46.792Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "todo",
    "phase": "17",
    "file": "supabase/migrations/0041_psw_staff_child_access.sql",
    "line": null,
    "description": "profiles_select_psw_staff (0041, Bloco 3) expoe TODAS as pessoas dos tenants onde o psw_staff tem oportunidade atribuida, nao so as pessoas de fato ligadas as oportunidades atribuidas (assignee/created_by). Funcional e justificado no arquivo (sem ela o select de responsavel de tarefa ACCESS-11 fica vazio), mas e uma exposicao mais larga que o resto da fase. Considerar estreitamento futuro.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-07T01:04:46.843Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "todo",
    "phase": "17",
    "file": "supabase/migrations/0043_tenant_coherence_notes_risks_documents.sql",
    "line": null,
    "description": "Defeito PRE-EXISTENTE (0011/0018, nao introduzido pela Phase 17) descoberto na verificacao pos-apply da 0041: opportunity_notes, opportunity_risks e opportunity_documents nao tem guarda de coerencia de tenant (equivalente a check_assignee_tenant/check_task_tenant_coherence) — qualquer usuario nao-viewer pode pendurar nota/risco/documento em oportunidade de OUTRO tenant, carimbando o proprio tenant_id. 7 linhas de producao afetadas (5 notas + 2 riscos, tenant_id=PSW penduradas em oportunidades da Unidasul) — integridade/poluicao de dados, nao vazamento de confidencialidade. PO decidiu: migration 0043 (fora do escopo do Plan 17-04) vai adicionar a guarda e corrigir as 7 linhas.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-07T01:04:46.894Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "unrun-verify",
    "phase": "17",
    "file": "tests/security/psw-staff-isolation.test.ts",
    "line": null,
    "description": "Todos os specs de propagacao/escrita/triggers do Plan 17-05 (tabelas filhas, profiles, check_assignee_tenant, assignee de tarefa, escrita escopada, gate de viewer D-13, invited_emails) foram escritos mas NAO executados nesta sessao — .env.test continua ausente, mesma pendencia carregada desde 17-01. describe.skipIf pula os 38 specs; nenhuma prova empirica contra banco real.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-07T01:55:27.440Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "todo",
    "phase": "17",
    "file": "lib/database.types.ts",
    "line": null,
    "description": "invited_emails.Insert/Row/Update.role (hand-maintained) ainda e 'member'|'tenant_admin'|'viewer' — nao reflete o CHECK ampliado pela 0041 (aceita 'psw_staff' desde entao). tests/security/psw-staff-isolation.test.ts usa @ts-expect-error nos dois inserts com role:'psw_staff' para compilar. Corrigir o tipo exige tambem atualizar app/(app)/admin/invites/page.tsx (Record<InviteRow['role'], string> exaustivo) — fora do escopo do Plan 17-05 (files_modified so lista o arquivo de teste).",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-07T01:55:39.816Z",
    "resolved_at": "2026-08-07T10:08:51.113Z"
  },
  {
    "id": 15,
    "kind": "unrun-verify",
    "phase": "18",
    "file": "supabase/migrations/0045_psw_tenant_admins_grant.sql",
    "line": null,
    "description": "Handoff V10-V13 (nao-regressao member / smokes D-B / EXPLAIN inlining / smoke UPDATE autorizado) nao executadas nesta wave",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-07T17:01:12.370Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "skipped-test",
    "phase": "18",
    "file": "tests/security/psw-staff-admin-grant.test.ts",
    "line": null,
    "description": "14 testes em describe.skipIf (sem NEXT_PUBLIC_SUPABASE_URL) — modo de prova revertido para prova-por-sql-no-handoff (colisao de UUID entre fixtures e tenant real de producao impede env-test-populado); prova substituta = handoff 18-02 + observacao direta pelo app",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-07T17:01:21.633Z",
    "resolved_at": null
  }
]
````
