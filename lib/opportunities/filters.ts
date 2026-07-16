import type {
  AutomationTool,
  OpportunitySource,
  OpportunityStatus,
  PriorityLevel,
} from './types';
import { SEGMENTO_STATUSES, type Segmento } from './status';

export type SortKey =
  | 'score_desc'
  | 'score_asc'
  | 'fte_desc'
  | 'fte_asc'
  | 'seq_asc'
  | 'seq_desc'
  | 'nome_asc'
  | 'nome_desc'
  | 'area_asc'
  | 'processo_asc'
  | 'status_asc';

// AutomationTool é nullable na tabela; pra filtro só faz sentido valores reais
type ToolFilter = NonNullable<AutomationTool>;
// PriorityLevel também pode ser null em alguns edges; restringimos pro filter
type PriorityFilter = NonNullable<PriorityLevel>;

export type OpportunityFilters = {
  q?: string;
  source?: OpportunitySource;
  area?: string;
  ferramenta?: ToolFilter;
  priority?: PriorityFilter;
  status?: OpportunityStatus;
  sort?: SortKey;
  /** Segmentação de portfólio (v0.3) — grupo de status, além do filtro fino de `status`. */
  segmento?: Segmento;
};

const SOURCE_VALUES: OpportunitySource[] = ['persona', 'formulario'];
const TOOL_VALUES: ToolFilter[] = ['rpa', 'n8n', 'ambos'];
const PRIORITY_VALUES: PriorityFilter[] = ['alta', 'media', 'baixa'];
const STATUS_VALUES: OpportunityStatus[] = [
  'novo',
  'em_analise',
  'planejamento',
  'backlog',
  'desenvolvimento',
  'homologacao',
  'producao',
  'concluido',
  'gestao',
  'manutencao',
  'descontinuado',
];
const SEGMENTO_VALUES: Segmento[] = ['todos', 'legado', 'gestao', 'novas', 'manutencao'];
export const SORT_VALUES: SortKey[] = [
  'score_desc',
  'score_asc',
  'fte_desc',
  'fte_asc',
  'seq_asc',
  'seq_desc',
  'nome_asc',
  'nome_desc',
  'area_asc',
  'processo_asc',
  'status_asc',
];

function pickEnum<T extends string>(value: string | null, allowed: T[]): T | undefined {
  if (!value) return undefined;
  return (allowed as string[]).includes(value) ? (value as T) : undefined;
}

/**
 * Lê URL params e retorna objeto tipado de filtros.
 * Valores inválidos viram undefined (não derruba a página).
 */
export function parseFilters(
  sp: URLSearchParams | { get(name: string): string | null }
): OpportunityFilters {
  const get = (k: string) => sp.get(k);

  return {
    q: get('q')?.trim() || undefined,
    source: pickEnum(get('source'), SOURCE_VALUES),
    area: get('area')?.trim() || undefined,
    ferramenta: pickEnum(get('ferramenta'), TOOL_VALUES),
    priority: pickEnum(get('priority'), PRIORITY_VALUES),
    status: pickEnum(get('status'), STATUS_VALUES),
    sort: pickEnum(get('sort'), SORT_VALUES),
    segmento: pickEnum(get('segmento'), SEGMENTO_VALUES),
  };
}

/**
 * Constrói query string canônica a partir dos filtros.
 * Preserva params não-relacionados (ex: ?view=cards) se vier `currentSp`.
 */
export function buildQuery(
  filters: OpportunityFilters,
  currentSp?: URLSearchParams
): string {
  const next = new URLSearchParams();

  // Preserva params não-filtro do estado atual (ex: view)
  if (currentSp) {
    for (const [k, v] of currentSp.entries()) {
      if (!FILTER_KEYS.includes(k as keyof OpportunityFilters)) {
        next.set(k, v);
      }
    }
  }

  if (filters.q) next.set('q', filters.q);
  if (filters.source) next.set('source', filters.source);
  if (filters.area) next.set('area', filters.area);
  if (filters.ferramenta) next.set('ferramenta', filters.ferramenta);
  if (filters.priority) next.set('priority', filters.priority);
  if (filters.status) next.set('status', filters.status);
  if (filters.sort && filters.sort !== 'score_desc') next.set('sort', filters.sort);
  if (filters.segmento && filters.segmento !== 'todos') next.set('segmento', filters.segmento);

  return next.toString();
}

export const FILTER_KEYS: (keyof OpportunityFilters)[] = [
  'q',
  'source',
  'area',
  'ferramenta',
  'priority',
  'status',
  'sort',
  'segmento',
];

export const SORT_LABELS: Record<SortKey, string> = {
  score_desc: '🏆 Score: Maior primeiro',
  score_asc: 'Score: Menor primeiro',
  fte_desc: 'FTE: Maior primeiro',
  fte_asc: 'FTE: Menor primeiro',
  seq_asc: 'ID: Menor → Maior',
  seq_desc: 'ID: Maior → Menor',
  nome_asc: 'Nome A → Z',
  nome_desc: 'Nome Z → A',
  area_asc: 'Área A → Z',
  processo_asc: 'Processo A → Z',
  status_asc: 'Status',
};
