# Plan 09-01 — Summary

**Plan:** Migration 0011 — schema evolution v0.2
**Status:** ⏸ Tasks 1+2 done; **Task 3 = [BLOCKING] checkpoint:human-action PENDENTE** (apply manual no Supabase Cloud)
**Requirements:** MODEL-01..10, SCORE-01/02/03, RISK-04

## What was built

- **`supabase/migrations/0011_schema_evolution_v02.sql`** (idempotente, write-only) cobrindo:
  - Enums `frequency_bucket`, `fte_bucket` + 5 enums de risco.
  - `opportunities` +7 colunas (`fte_horas`, `fonte`, `tipo_processo[]`, `beneficio_qualitativo`, `criterios` jsonb, `beneficios` jsonb, `fte`) + `rpa_score` **GENERATED** (regra dos 6 indicadores, reproduz `_giba` 64/64; null p/ personas).
  - `tempo` migrado `time_bucket → frequency_bucket` (derivado de `frequencia`; ALTER guardado contra re-aplicação; view dropada antes).
  - `opportunity_score()` reescrita p/ 5 fatores (`_giba:483-490`); **old overload de 4 args dropado** (evita ambiguidade — deviation documentada abaixo).
  - Backfill FGCoop: `criterios` (coalesce resiliente p/ 'nao' — aguenta seq_id 18 sem `padronizacao_docs`), `beneficios` (6 chaves legadas), `fonte='FGCoop'`.
  - 2 CHECKs jsonb (`criterios` exato-8-chaves; `beneficios` subconjunto).
  - `opportunity_risks` (tenant_id + RLS + 4 policies + `priority` GENERATED da matriz + índices + trigger updated_at).
  - View `opportunities_with_score` recriada (5 args, `security_invoker=true`).
- **`09-MIGRATION-HANDOFF.md`** — passo a passo de apply (ênfase em atomicidade/paste único), 9 queries de verificação pós-apply, `gen:types`, rollback best-effort, opção de validar em branch.

## Key files
- Created: `supabase/migrations/0011_schema_evolution_v02.sql`, `.planning/phases/09-schema-evolution-foundation/09-MIGRATION-HANDOFF.md`

## Verification (file-level, pré-apply)
- 7 `create type`, 2 `generated always as`, 4 policies de `opportunity_risks`, score com 5 args + pesos `diario...20`, backfill resiliente, CHECKs guardados ✓ (todos os greps do plano passam)
- **Apply real ainda não feito** — é o checkpoint bloqueante.

## Deviations
- **Drop do overload antigo `opportunity_score(effort_level,complexity_level,time_bucket,smallint)`** antes do `create or replace` da nova assinatura de 5 args. Motivo: `create or replace` com assinatura diferente cria OVERLOAD, deixando a função antiga órfã e ambígua. A intenção do plano era "reescrever/substituir". Seguro: a view (único dependente) já foi dropada no passo 3. Idempotente (`drop ... if exists`).

## Pending (BLOCKING)
Apply manual de `0011` no Supabase Cloud SQL Editor + queries de verificação + `npm run gen:types`. Resume signal: usuário digita "applied" ou descreve o erro. Ver `09-MIGRATION-HANDOFF.md`.

## Self-Check: PASSED (artefatos), apply pendente
