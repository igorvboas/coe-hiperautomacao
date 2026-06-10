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

// ─── Phase 12: Registro de Riscos ───────────────────────────────────────
// Linha estruturada de `opportunity_risks` (0011). `priority` é trigger-set
// (set_risk_priority(), matriz impacto×probabilidade) — nunca input manual.
// Reexportado para o front da aba Risco e do formulário de risco.
export type OpportunityRisk =
  Database['public']['Tables']['opportunity_risks']['Row'];

export type RiskType = Database['public']['Enums']['risk_type'];
export type RiskImpact = Database['public']['Enums']['risk_impact'];
export type RiskProbability = Database['public']['Enums']['risk_probability'];
export type RiskStatus = Database['public']['Enums']['risk_status'];
export type RiskPriority = Database['public']['Enums']['risk_priority'];

/**
 * Buckets de KPI usados pela KPI bar.
 * Calculado a partir do array de Opportunity no Server Component.
 */
export type OpportunityKpis = {
  total: number;
  /** Contagem de status 'em_analise' — card "Em Análise" da lista (v0.3).
   *  Top-level (fora de byStatus) para não quebrar o contrato D-03/VIEW-01. */
  emAnalise: number;
  scoreMedio: number;
  /**
   * Soma arredondada de `fte_horas` de todas as oportunidades (D-03 / VIEW-01).
   * KPI da Phase 13. `null` por linha conta como 0. Contrato:
   * tests/opportunities/kpis.test.ts (Wave 0).
   */
  fteTotal: number;
  byPriority: {
    alta: number;
    media: number;
    baixa: number;
  };
  /**
   * Contagem só dos 3 status exibidos na KPI bar do mockup (D-02 / _giba:296-305).
   * Status intermediários (em_analise/planejamento/...) NÃO entram na barra.
   */
  byStatus: {
    novo: number;
    producao: number;
    concluido: number;
  };
};
