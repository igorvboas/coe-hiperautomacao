// lib/opportunities/report.ts
// =============================================================================
// Agregação PURA do portfólio por área para a view "Relatório" (Phase 14).
// Porta a lógica de `renderRelatorio` (_giba_wsi-dashboard.html:853-896) para
// uma função testável sobre Opportunity[]. Módulo puro (sem JSX/React, sem
// import de servidor) — importável em vitest. Read-only: nunca persiste nada
// (CLAUDE.md §3).
//
// D-05  agrupa por área (count desc, fallback "Sem Área")
// D-06  prioridade lida da coluna computada `priority_level` (NÃO recomputa score)
// D-07  RPA: Ideal >= 5, RPA+n8n >= 3 && < 5 (consistente com rpaTier)
// D-08  FTE null → 0; totais arredondados
// D-02a mesma cor por área nos 3 blocos (cards/barras/donuts) via PALETTE+índice
// =============================================================================

import type { Opportunity } from '@/lib/opportunities/types';

/**
 * Paleta de 18 cores — porta LITERAL de _giba_wsi-dashboard.html:817.
 * Ciclada por índice de área (ordem ordenada por count desc), garantindo a
 * mesma cor por área nos cards, barras e donuts (D-02a). Exportada para reuso
 * por pie.tsx e relatorio.tsx.
 */
export const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48',
  '#0891b2', '#65a30d', '#d97706', '#7c3aed', '#0284c7', '#dc2626',
];

export type AreaStat = {
  area: string;
  count: number;
  fte: number;
  color: string;
};

export type PortfolioReport = {
  areas: AreaStat[]; // ordenado por count desc (D-05)
  totalCount: number;
  totalFte: number; // soma global arredondada (D-08)
  maxCount: number; // maior count entre áreas (largura relativa das barras)
  maxFte: number; // maior fte entre áreas
  prioAlta: number; // priority_level === 'alta'
  prioMedia: number; // priority_level === 'media'
  rpaIdeal: number; // rpa_score >= 5 (D-07)
  rpaHybrid: number; // rpa_score >= 3 && < 5 (D-07)
};

/**
 * Agrega Opportunity[] em PortfolioReport — réplica exata de renderRelatorio
 * (_giba:853-896). Função pura: não busca dados, não escreve no banco, não
 * recomputa score (usa a coluna `priority_level` da view — D-06).
 */
export function buildReport(opps: Opportunity[]): PortfolioReport {
  const areaMap: Record<string, { count: number; fte: number }> = {};

  for (const o of opps) {
    const a = (o.area || 'Sem Área').trim();
    if (!areaMap[a]) areaMap[a] = { count: 0, fte: 0 };
    areaMap[a].count++;
    areaMap[a].fte += o.fte_horas ?? 0;
  }

  const sortedKeys = Object.keys(areaMap).sort(
    (a, b) => areaMap[b].count - areaMap[a].count
  );

  const areas: AreaStat[] = sortedKeys.map((area, i) => ({
    area,
    count: areaMap[area].count,
    fte: Math.round(areaMap[area].fte),
    color: PALETTE[i % PALETTE.length],
  }));

  // Guard contra Math.max() sem args (retorna -Infinity).
  const maxCount = areas.length ? Math.max(...areas.map((a) => a.count)) : 0;
  const maxFte = areas.length ? Math.max(...areas.map((a) => a.fte)) : 0;

  const totalCount = opps.length;
  const totalFte = Math.round(
    opps.reduce((sum, o) => sum + (o.fte_horas ?? 0), 0)
  );

  let prioAlta = 0;
  let prioMedia = 0;
  let rpaIdeal = 0;
  let rpaHybrid = 0;

  for (const o of opps) {
    // D-06: usar a coluna computada da view, idêntica a calcScore via parity
    // test — NÃO recomputar com score.ts, NÃO persistir.
    if (o.priority_level === 'alta') prioAlta++;
    else if (o.priority_level === 'media') prioMedia++;

    // D-07: consistente com rpaTier (cells.ts).
    const rpa = o.rpa_score ?? 0;
    if (rpa >= 5) rpaIdeal++;
    else if (rpa >= 3) rpaHybrid++;
  }

  return {
    areas,
    totalCount,
    totalFte,
    maxCount,
    maxFte,
    prioAlta,
    prioMedia,
    rpaIdeal,
    rpaHybrid,
  };
}
