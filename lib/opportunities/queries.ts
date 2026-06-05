import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  Opportunity,
  OpportunityKpis,
  OpportunityPhase,
  OpportunityRisk,
} from './types';
import type { OpportunityFilters } from './filters';

export type { OpportunityPhase };

/**
 * Whitelist de colunas — substitui `select('*')` para evitar vazamento
 * de colunas adicionadas em migrations futuras (defesa em profundidade,
 * HARDEN-E-06). Mantém paridade com a view `opportunities_with_score`
 * (todas as colunas da tabela `opportunities` + `score` + `priority_level`).
 *
 * Se uma nova coluna for adicionada à tabela `opportunities`, decidir
 * EXPLICITAMENTE se ela deve aparecer aqui — se for sensível, não incluir.
 */
const OPPORTUNITY_COLUMNS =
  'id, tenant_id, seq_id, source, request_type, ' +
  'solicitante, email, area, subarea, processo, ' +
  'frequencia, volume_medio, tempo_execucao, num_pessoas, ' +
  'ferramenta, escopo_automacao, beneficios_esperados, ' +
  'esforco, complexidade, tempo, objetivo, ' +
  'status, responsavel, notas, observacao, risco, ' +
  // v0.2 (0011) — incluídos por decisão explícita (HARDEN-E-06): consumidos por
  // P11/P12/P13/P14; nenhum sensível. rpa_score é GENERATED (leitura).
  'fte_horas, fonte, tipo_processo, beneficio_qualitativo, ' +
  'criterios, beneficios, fte, rpa_score, ' +
  'persona_extras, formulario_extras, ' +
  'ai_enrichment_status, ai_enrichment_error, ai_enriched_at, ' +
  'created_by, created_at, updated_at, ' +
  'score, priority_level';

/**
 * Whitelist para `opportunity_phases` — mesma motivação de HARDEN-E-06.
 */
const PHASE_COLUMNS =
  'id, opportunity_id, tenant_id, phase_key, ' +
  'started_at, finished_at, created_at, updated_at';

/**
 * Whitelist para `opportunity_risks` (0011) — mesma motivação de HARDEN-E-06
 * (sem `select('*')`). `priority` é trigger-set (set_risk_priority(), matriz
 * impacto×probabilidade) — leitura apenas, nunca input. Nenhuma coluna sensível.
 */
const RISK_COLUMNS =
  'id, opportunity_id, tenant_id, descricao, tipo, responsavel, ' +
  'impacto, probabilidade, status, resposta, descricao_impacto, ' +
  'priority, created_by, created_at, updated_at';

/**
 * Busca todas as oportunidades visíveis pro tenant do usuário logado.
 * RLS filtra automaticamente — backend não precisa passar tenant_id.
 *
 * Aceita `filters` opcional pra busca/dropdown/sort vindos da toolbar.
 */
export async function fetchOpportunities(
  filters: OpportunityFilters = {}
): Promise<Opportunity[]> {
  const supabase = await createClient();
  let q = supabase.from('opportunities_with_score').select(OPPORTUNITY_COLUMNS);

  if (filters.source) q = q.eq('source', filters.source);
  if (filters.area) q = q.eq('area', filters.area);
  if (filters.ferramenta) q = q.eq('ferramenta', filters.ferramenta);
  if (filters.priority) q = q.eq('priority_level', filters.priority);
  if (filters.status) q = q.eq('status', filters.status);

  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim().replace(/[%]/g, '\\%');
    q = q.or(
      `solicitante.ilike.%${term}%,processo.ilike.%${term}%,area.ilike.%${term}%`
    );
  }

  const sort = filters.sort ?? 'score_desc';
  switch (sort) {
    case 'score_asc':
      q = q.order('score', { ascending: true }).order('seq_id', { ascending: true });
      break;
    case 'seq_asc':
      q = q.order('seq_id', { ascending: true });
      break;
    case 'seq_desc':
      q = q.order('seq_id', { ascending: false });
      break;
    case 'nome_asc':
      q = q.order('solicitante', { ascending: true });
      break;
    case 'nome_desc':
      q = q.order('solicitante', { ascending: false });
      break;
    case 'area_asc':
      q = q.order('area', { ascending: true });
      break;
    case 'processo_asc':
      q = q.order('processo', { ascending: true });
      break;
    case 'status_asc':
      q = q.order('status', { ascending: true });
      break;
    case 'score_desc':
    default:
      q = q.order('score', { ascending: false }).order('seq_id', { ascending: true });
  }

  const { data, error } = await q.returns<Opportunity[]>();

  if (error) {
    throw new Error(`Erro ao buscar oportunidades: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Retorna lista DISTINCT de áreas para popular dropdown de filtro.
 */
export async function fetchAreas(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('opportunities')
    .select('area')
    .order('area', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar áreas: ${error.message}`);
  }

  const unique = new Set((data ?? []).map((r) => r.area).filter(Boolean));
  return Array.from(unique);
}

/**
 * Busca uma oportunidade por id. RLS filtra implicitamente.
 * Retorna null se não existir / não autorizado.
 */
export async function fetchOpportunityById(
  id: string
): Promise<Opportunity | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('opportunities_with_score')
    .select(OPPORTUNITY_COLUMNS)
    .eq('id', id)
    .maybeSingle()
    .returns<Opportunity>();

  if (error) {
    throw new Error(`Erro ao buscar oportunidade: ${error.message}`);
  }

  return data;
}

/**
 * Busca o histórico de fases de uma oportunidade.
 * RLS protege por tenant — não precisa passar tenant_id.
 */
export async function fetchPhasesForOpportunity(
  opportunityId: string
): Promise<OpportunityPhase[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('opportunity_phases')
    .select(PHASE_COLUMNS)
    .eq('opportunity_id', opportunityId)
    .order('started_at', { ascending: true })
    .returns<OpportunityPhase[]>();

  if (error) {
    throw new Error(`Erro ao buscar fases: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Busca os riscos estruturados de uma oportunidade (`opportunity_risks`, 0011).
 * RLS protege por tenant — não precisa passar tenant_id.
 *
 * Ordenação: `created_at asc` no DB. O rank semântico de severidade
 * (`critica > alta > media > baixa`) NÃO é dado por `.order('priority')` —
 * ordenar pelo enum é alfabético (`alta, baixa, critica, media`), não por
 * severidade (Pitfall 6 da RESEARCH). Se a UI precisar ordenar por prioridade,
 * o Plan 12-02 aplica o rank no client.
 *
 * @param opportunityId id da oportunidade dona dos riscos.
 */
export async function fetchRisksForOpportunity(
  opportunityId: string
): Promise<OpportunityRisk[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('opportunity_risks')
    .select(RISK_COLUMNS)
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: true })
    .returns<OpportunityRisk[]>();

  if (error) {
    throw new Error(`Erro ao buscar riscos: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Busca um risco por id (usado pela rota fullscreen de edição no Plan 12-02).
 * RLS filtra implicitamente. Retorna null se não existir / não autorizado.
 */
export async function fetchRiskById(
  riskId: string
): Promise<OpportunityRisk | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('opportunity_risks')
    .select(RISK_COLUMNS)
    .eq('id', riskId)
    .maybeSingle()
    .returns<OpportunityRisk>();

  if (error) {
    throw new Error(`Erro ao buscar risco: ${error.message}`);
  }

  return data;
}

/**
 * Calcula os KPIs a partir do array — opera em memória.
 */
export function computeKpis(opps: Opportunity[]): OpportunityKpis {
  // D-02: só os 3 status exibidos na KPI bar do mockup (_giba:296-305).
  // Status intermediários (em_analise/planejamento/...) são ignorados aqui.
  const byStatus = { novo: 0, producao: 0, concluido: 0 };
  const byPriority = { alta: 0, media: 0, baixa: 0 };

  let totalScore = 0;
  let scoreCount = 0;
  let fteTotal = 0; // soma de fte_horas (null → 0) — KPI D-03/VIEW-01

  for (const o of opps) {
    fteTotal += o.fte_horas ?? 0;

    if (o.status === 'novo') byStatus.novo++;
    else if (o.status === 'producao') byStatus.producao++;
    else if (o.status === 'concluido') byStatus.concluido++;

    if (o.priority_level === 'alta') byPriority.alta++;
    else if (o.priority_level === 'media') byPriority.media++;
    else if (o.priority_level === 'baixa') byPriority.baixa++;

    if (typeof o.score === 'number') {
      totalScore += o.score;
      scoreCount++;
    }
  }

  return {
    total: opps.length,
    scoreMedio: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    fteTotal: Math.round(fteTotal),
    byPriority,
    byStatus,
  };
}
