-- =============================================================================
-- 0014_backfill_enrichment_status_seeded.sql — Backfill ai_enrichment_status
-- =============================================================================
-- Corrige linhas de SEED / legadas presas em 'pending'.
--
-- CONTEXTO: a migration 0010 adicionou `ai_enrichment_status` com
-- `not null default 'pending'` e NÃO fez backfill. Toda linha já existente
-- (FGCoop via 0003, Unidasul via 0013) herdou 'pending'. Mas o enrichment por
-- IA só roda no `after()` de `createOpportunity` — linhas de seed nunca são
-- enriquecidas. Resultado: o overlay "Enriquecendo…" do modal fica girando
-- infinitamente para dados que JÁ estão completos e corretos.
--
-- FIX: marcar como 'enriched' as linhas 'pending' que claramente NÃO estão
-- num enrichment em andamento. Guard por `created_at` antigo (> 10 min) para
-- nunca clobberar uma oportunidade recém-criada cujo after() ainda está
-- processando. `ai_enriched_at` recebe now() para coerência de exibição.
--
-- Idempotente — re-aplicar não tem efeito (nada mais 'pending' antigo).
-- Pré-requisitos: 0001..0013 aplicadas.
-- =============================================================================

set session characteristics as transaction read write;
set default_transaction_read_only = off;
set check_function_bodies = off;

update opportunities
set
  ai_enrichment_status = 'enriched',
  ai_enriched_at = coalesce(ai_enriched_at, now())
where
  ai_enrichment_status = 'pending'
  and created_at < now() - interval '10 minutes';

-- =============================================================================
-- FIM 0014 — linhas de seed/legadas 'pending' antigas → 'enriched'.
-- Oportunidades novas (criadas pelo app) continuam 'pending' até o enrichment
-- por IA concluir, sem serem afetadas por este backfill.
-- =============================================================================
