// lib/opportunities/csv.ts
// =============================================================================
// Serialização PURA de Opportunity[] → CSV. Sem JSX/React, sem import de
// servidor — importável em vitest. Read-only: só formata, nunca persiste.
//
// Formato: separador ';' + BOM UTF-8 (default do Excel pt-BR), campos com aspas
// escapadas ("" para aspas internas) sempre que contêm ; " ou quebra de linha.
// Colunas derivadas (`score`, `priority_level`) vêm da view — não recalcula.
// =============================================================================

import type { Opportunity } from '@/lib/opportunities/types';

type Column = {
  /** Cabeçalho pt-BR exibido na primeira linha do CSV. */
  header: string;
  /** Extrai o valor bruto da oportunidade (será stringificado depois). */
  value: (o: Opportunity) => unknown;
};

/**
 * Ordem e rótulo de TODAS as colunas exportadas. Espelha a whitelist de
 * `OPPORTUNITY_COLUMNS` (queries.ts) — se uma coluna nova entrar lá e fizer
 * sentido no export, adicionar aqui também.
 */
const COLUMNS: Column[] = [
  { header: 'ID', value: (o) => o.seq_id },
  { header: 'Fonte (origem)', value: (o) => o.source },
  { header: 'Tipo de solicitação', value: (o) => o.request_type },
  { header: 'Solicitante', value: (o) => o.solicitante },
  { header: 'E-mail', value: (o) => o.email },
  { header: 'Área', value: (o) => o.area },
  { header: 'Subárea', value: (o) => o.subarea },
  { header: 'Processo', value: (o) => o.processo },
  { header: 'Frequência', value: (o) => o.frequencia },
  { header: 'Volume médio', value: (o) => o.volume_medio },
  { header: 'Tempo de execução', value: (o) => o.tempo_execucao },
  { header: 'Nº de pessoas', value: (o) => o.num_pessoas },
  { header: 'Ferramenta', value: (o) => o.ferramenta },
  { header: 'Escopo da automação', value: (o) => o.escopo_automacao },
  { header: 'Benefícios esperados', value: (o) => o.beneficios_esperados },
  { header: 'Esforço', value: (o) => o.esforco },
  { header: 'Complexidade', value: (o) => o.complexidade },
  { header: 'Tempo (frequência)', value: (o) => o.tempo },
  { header: 'Objetivo (1-5)', value: (o) => o.objetivo },
  { header: 'FTE (bucket)', value: (o) => o.fte },
  { header: 'FTE (h/mês)', value: (o) => o.fte_horas },
  { header: 'Score', value: (o) => o.score },
  { header: 'Prioridade', value: (o) => o.priority_level },
  { header: 'RPA Score (0-6)', value: (o) => o.rpa_score },
  { header: 'Status', value: (o) => o.status },
  { header: 'Responsável', value: (o) => o.responsavel },
  { header: 'Rótulo de origem', value: (o) => o.fonte },
  { header: 'Tipo de processo', value: (o) => o.tipo_processo },
  { header: 'Benefício qualitativo', value: (o) => o.beneficio_qualitativo },
  { header: 'Critérios (RPA Fit)', value: (o) => o.criterios },
  { header: 'Benefícios (escala 1-5)', value: (o) => o.beneficios },
  { header: 'Notas', value: (o) => o.notas },
  { header: 'Observação', value: (o) => o.observacao },
  { header: 'Risco (nota livre)', value: (o) => o.risco },
  { header: 'Enriquecimento IA (status)', value: (o) => o.ai_enrichment_status },
  { header: 'Enriquecido em', value: (o) => o.ai_enriched_at },
  { header: 'Criado em', value: (o) => o.created_at },
  { header: 'Atualizado em', value: (o) => o.updated_at },
];

/**
 * Converte um valor bruto em texto de célula (ainda não escapado).
 * - null/undefined → ''
 * - array → itens juntados por ' | '
 * - objeto (Json) → JSON compacto
 * - resto → String(...)
 */
function toCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((v) => toCell(v)).join(' | ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Escapa uma célula para CSV: envolve em aspas e duplica aspas internas quando
 * o texto contém o separador, aspas ou quebra de linha.
 */
function escape(cell: string): string {
  if (/[;"\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

const SEP = ';';
const EOL = '\r\n';
/** BOM UTF-8 — faz o Excel (pt-BR) abrir acentuação corretamente. */
const BOM = '﻿';

/**
 * Serializa Opportunity[] → string CSV completa (com cabeçalho + BOM).
 * Função pura: nunca busca dados nem persiste.
 */
export function opportunitiesToCsv(opps: Opportunity[]): string {
  const headerRow = COLUMNS.map((c) => escape(c.header)).join(SEP);
  const rows = opps.map((o) =>
    COLUMNS.map((c) => escape(toCell(c.value(o)))).join(SEP)
  );
  return BOM + [headerRow, ...rows].join(EOL) + EOL;
}
