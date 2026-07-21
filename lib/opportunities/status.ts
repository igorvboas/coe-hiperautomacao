import type { OpportunityStatus } from './types';

// =============================================================================
// status.ts — fonte única de metadados dos 11 status do pipeline (v0.3)
// -----------------------------------------------------------------------------
// Antes desta migração o label/ícone/cor de cada status estava duplicado em
// components/opportunities/cells.tsx (StatusBadge), kanban/Board.tsx (COLUMNS),
// toolbar.tsx (STATUS_OPTIONS) e modal/StatusSelector.tsx (STATUS_OPTIONS) — 4
// cópias divergindo era só questão de tempo (aconteceu com a fórmula de score
// na v0.1, corrigido na Phase 10 unificando em lib/opportunities/score.ts).
// Os 4 consumidores agora importam STATUS_ORDER/STATUS_META daqui.
//
// Os 3 status novos (gestao/manutencao/descontinuado, migration 0016) NÃO têm
// phase_key correspondente em opportunity_phases — não entram no fluxo linear
// datado (ver sync_opportunity_phase() em 0017).
// =============================================================================

export type StatusMeta = {
  status: OpportunityStatus;
  label: string;
  icon: string;
  /** cor de destaque (texto do badge / borda da coluna kanban) */
  color: string;
  /** fundo do badge (par de cor legível com `color`) */
  bg: string;
};

// Ordem canônica exibida (dropdown de status, filtro, colunas do kanban):
// primeiro o PIPELINE linear (Registrado → … → Concluído), depois as etapas
// fora do fluxo mas com cronologia própria (Backlog, Descontinuado).
// `gestao`/`manutencao` foram removidos da seleção (continuam no STATUS_META
// só para renderizar registros legados que ainda os tenham — ver STATUS_ALL).
export const STATUS_ORDER: OpportunityStatus[] = [
  // Pipeline linear
  'novo',
  'em_analise',
  'planejamento',
  'desenvolvimento',
  'homologacao',
  'producao',
  'concluido',
  // Etapas temporais fora do pipeline
  'backlog',
  'descontinuado',
];

export const STATUS_META: Record<OpportunityStatus, StatusMeta> = {
  novo: { status: 'novo', label: 'Registrado', icon: '🆕', bg: '#f1f5f9', color: '#64748b' },
  em_analise: { status: 'em_analise', label: 'Em Análise', icon: '🔍', bg: '#ede9fe', color: '#8b5cf6' },
  planejamento: { status: 'planejamento', label: 'Planejamento', icon: '📋', bg: '#dbeafe', color: '#3b82f6' },
  backlog: { status: 'backlog', label: 'Backlog', icon: '⏳', bg: '#fef3c7', color: '#f59e0b' },
  desenvolvimento: { status: 'desenvolvimento', label: 'Desenvolvimento', icon: '⚙️', bg: '#ffedd5', color: '#f97316' },
  homologacao: { status: 'homologacao', label: 'Homologação', icon: '🧪', bg: '#cffafe', color: '#06b6d4' },
  producao: { status: 'producao', label: 'Produção', icon: '🚀', bg: '#dcfce7', color: '#22c55e' },
  concluido: { status: 'concluido', label: 'Concluído', icon: '✅', bg: '#d1fae5', color: '#10b981' },
  // v0.3 (0016) — fora do fluxo linear datado
  gestao: { status: 'gestao', label: 'Gestão', icon: '🛠️', bg: '#f3e8ff', color: '#a855f7' },
  manutencao: { status: 'manutencao', label: 'Manutenção', icon: '🔧', bg: '#e0f2fe', color: '#0891b2' },
  descontinuado: { status: 'descontinuado', label: 'Descontinuado', icon: '⛔', bg: '#fee2e2', color: '#ef4444' },
};

export const STATUS_OPTIONS: { value: OpportunityStatus; label: string; icon: string }[] =
  STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label, icon: STATUS_META[s].icon }));

/** TODOS os status do enum (inclui `gestao`/`manutencao`, fora do STATUS_ORDER
 *  visível) — para iterações que precisam cobrir qualquer valor persistido,
 *  ex. contagem por status na KPI bar, sem depender da lista selecionável. */
export const STATUS_ALL: OpportunityStatus[] = Object.keys(STATUS_META) as OpportunityStatus[];

/** Status que fecham o "chamado" no COE — espelha COE_STATUS_ENCERRADO / migration 0017. */
export const TERMINAL_STATUSES: OpportunityStatus[] = ['concluido', 'descontinuado'];

/**
 * Segmentação de portfólio (Legado / Gestão / Novas Oportunidades / Manutenção)
 * — filtro macro por grupo de status, acima de tabela/cards/kanban/relatório.
 * Puramente client-side (agrupa `status`, sem campo novo no schema).
 */
export type Segmento = 'todos' | 'legado' | 'gestao' | 'novas' | 'manutencao';

export const SEGMENTO_STATUSES: Record<Exclude<Segmento, 'todos'>, OpportunityStatus[]> = {
  legado: ['producao', 'concluido', 'descontinuado'],
  gestao: ['gestao', 'desenvolvimento', 'homologacao'],
  novas: ['novo', 'em_analise', 'planejamento', 'backlog'],
  manutencao: ['manutencao'],
};

export const SEGMENTO_OPTIONS: { value: Segmento; label: string; icon: string }[] = [
  { value: 'todos', label: 'Todos', icon: '' },
  { value: 'gestao', label: 'Gestão', icon: '🛠️' },
  { value: 'legado', label: 'Legado', icon: '📦' },
  { value: 'novas', label: 'Novas Oportunidades', icon: '🆕' },
  { value: 'manutencao', label: 'Manutenção', icon: '🔧' },
];

export function matchesSegmento(status: OpportunityStatus, segmento: Segmento): boolean {
  if (segmento === 'todos') return true;
  return SEGMENTO_STATUSES[segmento].includes(status);
}
