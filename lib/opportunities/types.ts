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
