---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-05T13:32:43.937Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 16 | deviation | tests/opportunities/report-strategic.test.ts | 107 | typecheck pre-existente TS2322 (null not assignable), nao relacionado a 16-01, confirmado no main antes das alteracoes | open |  | 2026-08-05T13:32:43.937Z |  |

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
  }
]
````
