import type { Opportunity } from './types';
import type { OpportunityInput } from './schema';

/** Colunas que `diffOpportunity` de fato lê — actions.ts seleciona exatamente
 * este subconjunto pra montar o "antes" (evita o custo/risco de puxar a
 * whitelist inteira só pra comparar 20 campos). */
export type OpportunityDiffSnapshot = Pick<
  Opportunity,
  | 'solicitante'
  | 'email'
  | 'area'
  | 'subarea'
  | 'processo'
  | 'frequencia'
  | 'volume_medio'
  | 'tempo_execucao'
  | 'num_pessoas'
  | 'ferramenta'
  | 'responsavel'
  | 'criticidade'
  | 'azure_boards_codigo'
  | 'linguagem'
  | 'execucao'
  | 'usuarios_servico'
  | 'execucoes_mes'
  | 'data_conclusao'
  | 'beneficio_qualitativo'
  | 'fte_horas'
  | 'criterios'
  | 'beneficios'
  | 'escopo_automacao'
  | 'beneficios_esperados'
  | 'status'
>;

// =============================================================================
// history.ts — diff pra auditoria automática (opportunity_history, v0.3/0018)
// -----------------------------------------------------------------------------
// Espelha `diffResumo`/`AUDIT_FIELDS` da referência COPA ENERGIA. Compara a row
// ANTES do update (`before`, buscada em actions.ts logo antes do `.update()`)
// com o payload validado (`after`, já em Zod-parsed shape — mesmos nomes de
// coluna snake_case que a DB) e produz um resumo pt-BR de UMA linha.
//
// Só campos ESCALARES entram no diff campo-a-campo; jsonb/array só avisam
// "alterado(s)" (comparar deep e formatar cada valor não vale o ruído).
// =============================================================================

const SCALAR_FIELDS: { key: keyof OpportunityDiffSnapshot & keyof OpportunityInput; label: string }[] = [
  { key: 'solicitante', label: 'Solicitante' },
  { key: 'email', label: 'E-mail' },
  { key: 'area', label: 'Área' },
  { key: 'subarea', label: 'Subárea' },
  { key: 'processo', label: 'Processo' },
  { key: 'frequencia', label: 'Frequência' },
  { key: 'volume_medio', label: 'Volume Médio' },
  { key: 'tempo_execucao', label: 'Tempo de Execução' },
  { key: 'num_pessoas', label: 'Pessoas Envolvidas' },
  { key: 'ferramenta', label: 'Ferramenta' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'criticidade', label: 'Criticidade' },
  { key: 'azure_boards_codigo', label: 'Código Azure Boards' },
  { key: 'linguagem', label: 'Linguagem' },
  { key: 'execucao', label: 'Execução' },
  { key: 'usuarios_servico', label: 'Usuários de Serviço' },
  { key: 'execucoes_mes', label: 'Execuções/mês' },
  { key: 'data_conclusao', label: 'Data de Conclusão' },
  { key: 'beneficio_qualitativo', label: 'Benefício Qualitativo' },
  { key: 'fte_horas', label: 'FTE (h/mês)' },
];

const OBJECT_FIELDS: { key: keyof OpportunityDiffSnapshot & keyof OpportunityInput; label: string }[] = [
  { key: 'criterios', label: 'Critérios' },
  { key: 'beneficios', label: 'Benefícios' },
  { key: 'escopo_automacao', label: 'Escopo' },
  { key: 'beneficios_esperados', label: 'Benefícios esperados' },
];

function scalarToString(v: unknown): string {
  if (v == null || v === '') return '—';
  return String(v);
}

/**
 * Resumo de UMA linha das mudanças entre `before` (row do banco pré-update) e
 * `after` (payload Zod-parsed que vai pro `.update()`). String vazia = nada
 * relevante mudou (o caller decide não gravar linha de histórico nesse caso).
 */
export function diffOpportunity(
  before: OpportunityDiffSnapshot,
  after: OpportunityInput
): string {
  const parts: string[] = [];

  for (const f of SCALAR_FIELDS) {
    const a = scalarToString(before[f.key]);
    const b = scalarToString(after[f.key] as unknown);
    if (a !== b) parts.push(`${f.label}: ${a} → ${b}`);
  }

  for (const f of OBJECT_FIELDS) {
    const a = JSON.stringify(before[f.key] ?? null);
    const b = JSON.stringify(after[f.key] ?? null);
    if (a !== b) parts.push(`${f.label} alterado(s)`);
  }

  if (before.status !== after.status) {
    parts.push(`Status: ${before.status} → ${after.status}`);
  }

  return parts.join('; ');
}
