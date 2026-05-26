import type { Database } from '@/lib/database.types';

/**
 * Row vinda da view `opportunities_with_score`.
 * Inclui todos os campos da tabela + `score` e `priority_level` calculados.
 */
export type Opportunity =
  Database['public']['Views']['opportunities_with_score']['Row'];

export type OpportunityStatus = Opportunity['status'];
export type OpportunitySource = Opportunity['source'];
export type AutomationTool = Opportunity['ferramenta'];
export type PriorityLevel = Opportunity['priority_level'];

// ─── Phase 7.6: AI Enrichment fields ────────────────────────────────────
// Os campos `ai_enrichment_status`, `ai_enrichment_error`, `ai_enriched_at`
// são propagados automaticamente do schema do DB via
// Database['public']['Views']['opportunities_with_score']['Row'] (que
// extende Tables.opportunities.Row & { score, priority_level }). Foram
// adicionados em `lib/database.types.ts` após apply da migration 0010 +
// `npm run gen:types`. NÃO precisa redeclarar manualmente aqui.
//
// Status semantics:
//   - 'pending'  : oportunidade criada, IA ainda não processou
//   - 'enriched' : IA preencheu os 9 campos com sucesso
//   - 'failed'   : IA falhou (refusal, network, length finish, etc.) —
//                  ai_enrichment_error contém a causa truncada (max 1000 chars)
//
// Tipo Status alias (re-export do enum derivado da Row) — facilita uso em
// props de componentes UI como o AiEnrichmentBadge sem precisar importar
// Opportunity quando o consumer só quer o status.
export type AiEnrichmentStatus = Opportunity['ai_enrichment_status'];

export type OpportunityPhase =
  Database['public']['Tables']['opportunity_phases']['Row'];

/**
 * Buckets de KPI usados pela KPI bar.
 * Calculado a partir do array de Opportunity no Server Component.
 */
export type OpportunityKpis = {
  total: number;
  personas: number;
  formularios: number;
  scoreMedio: number;
  byPriority: {
    alta: number;
    media: number;
    baixa: number;
  };
  byStatus: Record<OpportunityStatus, number>;
  byTool: {
    rpa: number;
    n8n: number;
    ambos: number;
  };
};
