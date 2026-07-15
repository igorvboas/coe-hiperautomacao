-- =============================================================================
-- 0019_backfill_enrichment_status_gsmm.sql — Backfill ai_enrichment_status (2ª rodada)
-- =============================================================================
-- Mesmo bug da 0014, novo seed: a 0018 (seed GSMM) inseriu 10 oportunidades via
-- SQL SEM setar `ai_enrichment_status`, então herdaram o default 'pending' da
-- 0010. Como o enrichment por IA só roda no `after()` de `createOpportunity`,
-- essas linhas nunca são enriquecidas e ficam 'pending' PARA SEMPRE.
--
-- SINTOMA: ao abrir QUALQUER oportunidade da GSMM, o modal liga o overlay
-- "Enriquecendo com IA…" (OpportunityDetail: isPending) e fica em polling até o
-- safety-net de 20s desistir — toda vez que reabre. Não é re-enriquecimento; é a
-- row marcada como pendente indevidamente.
--
-- FIX: marcar como 'enriched' as linhas 'pending' que claramente NÃO estão num
-- enrichment em andamento (guard por `created_at` antigo > 10 min, igual à 0014),
-- para nunca clobberar uma oportunidade recém-criada cujo after() ainda processa.
--
-- IDEMPOTENTE — re-aplicar não tem efeito (nada mais 'pending' antigo).
-- WRITE-ONLY MODE — aplicar MANUALMENTE no Supabase Cloud SQL Editor do projeto
--   do app (vxgthycrjetniejsjmee). NÃO rodar `supabase db push`.
-- Pré-requisitos: 0001..0018 aplicadas.
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
-- FIM 0019 — linhas de seed 'pending' antigas (GSMM e quaisquer outras) → 'enriched'.
-- Oportunidades novas (criadas pelo app) continuam 'pending' até o enrichment por
-- IA concluir, sem serem afetadas por este backfill.
-- =============================================================================
