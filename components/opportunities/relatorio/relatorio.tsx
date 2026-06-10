// components/opportunities/relatorio/relatorio.tsx
// =============================================================================
// Server Component da view "Relatório" (Phase 14) — porta as 3 seções de
// renderRelatorio (_giba_wsi-dashboard.html:898-928): (1) Resumo do Portfólio
// (7 cards), (2) Distribuição por Área (barras azul/verde + rodapé), (3) dois
// donuts SVG. Server Component puro (D-03). Read-only: agrega o que recebe por
// prop.
// =============================================================================

import type { Opportunity } from '@/lib/opportunities/types';
import { buildReport } from '@/lib/opportunities/report';
import { PieCard, type PieSlice } from '@/components/opportunities/relatorio/pie';

type Props = {
  opportunities: Opportunity[];
  /** Rótulo real de origem (nome do tenant) — NÃO hardcodar. */
  sourceLabel: string | null;
};

export function Relatorio({ opportunities, sourceLabel }: Props) {
  const report = buildReport(opportunities);

  // Empty state global (D-04a): sem oportunidades → bloco amigável, sem
  // cards/seções zeradas.
  if (report.totalCount === 0) {
    return (
      <div className="rounded-xl bg-wh border border-bdr p-12 text-center text-mut shadow-sm">
        <div className="text-base font-bold text-txt mb-2">
          📈 Nenhuma oportunidade ainda
        </div>
        <p>
          Cadastre oportunidades para ver o relatório do portfólio
          (distribuição por área, FTE e prioridades).
        </p>
      </div>
    );
  }

  const pieCount: PieSlice[] = report.areas.map((a) => ({
    label: a.area,
    value: a.count,
    color: a.color,
  }));
  const pieFte: PieSlice[] = report.areas.map((a) => ({
    label: a.area,
    value: a.fte,
    color: a.color,
  }));

  // KPIs de cabeçalho (alinhados ao painel 4 da referência). Calculados das
  // próprias oportunidades — sem fabricar deltas que não temos.
  const concluido = opportunities.filter((o) => o.status === 'concluido').length;
  const taxaConclusao = report.totalCount
    ? Math.round((concluido / report.totalCount) * 100)
    : 0;
  const scored = opportunities.filter((o) => typeof o.score === 'number');
  const scoreMedio = scored.length
    ? Math.round(scored.reduce((a, o) => a + (o.score ?? 0), 0) / scored.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Seção 1 — KPIs do Portfólio ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard value={`${report.totalCount}`} label="Total de Oportunidades" sub={`${report.areas.length} áreas`} />
        <SummaryCard value={`${taxaConclusao}%`} label="Taxa de Conclusão" sub={`${concluido} concluídas`} />
        <SummaryCard value={`${scoreMedio}`} label="Score Médio" sub={`${report.prioAlta} de prioridade alta`} />
        <SummaryCard value={`${report.totalFte}h`} label="FTE Total / mês" sub={`${report.rpaIdeal} RPA ideal`} />
      </div>

      {/* ── Seção 2 — Distribuição por Área (REPORT-03) ── */}
      <section className="bg-wh rounded-xl border border-bdr shadow-sm p-5">
        <h3 className="text-[14px] font-bold text-txt mb-4 pb-2 border-b border-bdr">
          Distribuição por Área de Negócio
          {sourceLabel ? ` — ${sourceLabel}` : ''}
        </h3>

        {/* Header */}
        <div
          className="grid gap-2 border-b-2 border-bdr pb-1.5 mb-0.5"
          style={{ gridTemplateColumns: '160px 1fr 55px 90px' }}
        >
          <div className="text-[10px] font-bold text-mut text-right pr-2">ÁREA</div>
          <div className="text-[10px] font-bold text-mut">
            DISTRIBUIÇÃO{' '}
            <span style={{ color: '#3b82f6' }}>■ Oportunidades</span>{' '}
            <span style={{ color: '#10b981' }}>■ FTE</span>
          </div>
          <div className="text-[10px] font-bold text-mut text-center">QTD</div>
          <div className="text-[10px] font-bold text-mut text-center">FTE/MÊS</div>
        </div>

        {/* Linhas por área */}
        {report.areas.map((a) => (
          <div
            key={a.area}
            className="grid gap-2 items-center border-b border-bdr py-1.5"
            style={{ gridTemplateColumns: '160px 1fr 55px 90px' }}
          >
            <div
              className="text-[11px] font-semibold text-right pr-2 truncate"
              title={a.area}
            >
              {a.area}
            </div>
            <div className="flex flex-col gap-[3px]">
              {/* Barra azul — oportunidades */}
              <div className="flex items-center gap-1">
                <div
                  style={{
                    height: 12,
                    width: `${(a.count / report.maxCount) * 100}%`,
                    background: a.color,
                    borderRadius: 3,
                    minWidth: 4,
                  }}
                />
                <span className="text-[10px] font-bold" style={{ color: a.color }}>
                  {a.count} op.
                </span>
              </div>
              {/* Barra verde — FTE */}
              <div className="flex items-center gap-1">
                <div
                  style={{
                    height: 8,
                    width: `${report.maxFte ? (a.fte / report.maxFte) * 100 : 0}%`,
                    background: '#10b981',
                    borderRadius: 3,
                    minWidth: 4,
                  }}
                />
                <span className="text-[10px]" style={{ color: '#10b981' }}>
                  ⏱️ {a.fte}h
                </span>
              </div>
            </div>
            <div className="text-center">
              <span className="bg-[#dbeafe] text-[#1e40af] px-[7px] py-0.5 rounded-[10px] text-[11px] font-bold">
                {a.count}
              </span>
            </div>
            <div className="text-center">
              <span className="bg-[#d1fae5] text-[#065f46] px-[7px] py-0.5 rounded-[10px] text-[10px] font-bold">
                {a.fte}h
              </span>
            </div>
          </div>
        ))}

        {/* Rodapé de totais */}
        <div className="mt-2.5 text-[11px] text-mut flex gap-4">
          <span>
            Total: <strong>{report.totalCount}</strong> oportunidades em{' '}
            <strong>{report.areas.length}</strong> áreas
          </span>
          <span>
            FTE Total: <strong>{report.totalFte}h/mês</strong>
          </span>
        </div>
      </section>

      {/* ── Seção 3 — Dois donuts (REPORT-04) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PieCard slices={pieCount} title="Oportunidades por Área" valueSuffix="op." />
        <PieCard
          slices={pieFte}
          title="FTE Estimado por Área (h/mês)"
          valueSuffix="h"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="bg-wh rounded-xl border border-bdr p-5 shadow-sm">
      <div className="text-[12px] font-medium text-mut">{label}</div>
      <div className="mt-3 text-[28px] font-bold text-txt leading-none tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[12px] text-mut">{sub}</div>}
    </div>
  );
}
