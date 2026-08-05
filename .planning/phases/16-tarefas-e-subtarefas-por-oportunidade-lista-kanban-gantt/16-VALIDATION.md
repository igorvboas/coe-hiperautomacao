---
phase: 16
slug: tarefas-e-subtarefas-por-oportunidade-lista-kanban-gantt
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-04
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded by `/gsd-plan-phase`. The planner fills the Per-Task Verification Map
> and the Wave 0 / Manual-Only sections while writing the PLAN.md files.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (`vitest.config.ts` at repo root) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/schema tests/opportunities` |
| **Full suite command** | `npm test` |
| **Typecheck** | `npm run typecheck` (`tsc --noEmit`) — mandatory alongside tests, `lib/database.types.ts` is hand-edited this phase |
| **Estimated runtime** | ~20–40s full suite (baseline: 148 passed / 32 skipped at end of Phase 13) |

**Existing suites relevant to this phase:** `tests/schema/` (pure rule tests +
`skipIf`-guarded live-SQL tests), `tests/security/` (cross-tenant isolation,
mass-assignment defense), `tests/opportunities/`, `tests/helpers/`,
`tests/setup/`.

---

## Sampling Rate

- **After every task commit:** `npm run typecheck` + `npx vitest run tests/schema tests/opportunities`
- **After every plan wave:** `npm test`
- **Before `/gsd-verify-work`:** full suite green + `npm run typecheck` exit 0
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

*To be filled by `gsd-planner` — one row per task across all PLAN.md files.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _(planner fills)_ | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Non-negotiable verifications for this phase

These are required regardless of how the planner slices the work:

1. **TASK-04 — cross-tenant isolation.** A test proving tenant A cannot read,
   update or delete tenant B's `opportunity_tasks` rows. Must follow the
   existing `skipIf` credential-guard pattern in `tests/security/` so it degrades
   to *skipped*, never *failed*, when live Supabase credentials are absent.
2. **TASK-02 — 2-level hierarchy enforced by the database.** A test proving the
   DB itself (not the UI) rejects (a) inserting a child under a row that already
   has a `parent_task_id`, and (b) re-parenting via UPDATE to create a 3rd level.
3. **TASK-03 — assignee tenant coherence enforced by the database.** A test
   proving the DB rejects an `assignee_id` whose profile belongs to another
   tenant, mirroring the trigger already shipped in migration `0032`.
4. **TASK-11 — rollup is derived, never persisted.** A pure unit test of the
   rollup function covering: parent with zero subtasks, parent with subtasks
   missing dates, all-complete, none-complete, and partial. Plus an assertion
   that no persisted column carries span or progress.
5. **D-11 — write authorization.** A test that a `viewer` cannot write to
   `opportunity_tasks` while a `member` can.
6. **`blocked_reason` conditional rule** — a Zod-level test that
   `status = 'bloqueio'` without a reason is rejected, and that the reason is
   not required for the other three statuses.

---

## Wave 0 Requirements

*To be confirmed by `gsd-planner`.* Preliminary read: vitest is already
installed and configured, `tests/schema/` and `tests/security/` already exist
with the `skipIf` helper pattern — so **no framework install is expected**.
Wave 0 is likely limited to new test files + any shared fixture for seeding a
task tree.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Applying migration `0037` to Supabase Cloud | TASK-01…TASK-04 | Project runs **write-only mode** — migrations are committed as files and applied by hand in the Supabase SQL Editor; no CI applies them | Open Supabase SQL Editor, run `supabase/migrations/0037_*.sql`, confirm idempotency by running twice |
| Kanban drag-and-drop, incl. the Bloqueio reason prompt and its cancel/rollback | TASK-08, TASK-09 | Pointer-driven dnd-kit interaction | Drag a card to Bloqueio → prompt appears → cancel → card returns to its original column with no persisted change |
| Gantt visual layout at 2 levels (parent span + fill, expand/collapse) | TASK-10, TASK-11 | Visual/proportional correctness | Open `/opportunities/[id]/tarefas?view=gantt`, expand a parent, confirm the parent bar spans min-start→max-due of its children |
| Narrow-viewport containment of Gantt/Kanban | UI-SPEC | Responsive/visual | Resize below the breakpoint; the wide view scrolls inside its own container and the page body never scrolls horizontally |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (`vitest` bare / `test:watch` must NOT appear in any task verify)
- [ ] Feedback latency < 45s
- [ ] The 6 non-negotiable verifications above each map to at least one task
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
