import type { Opportunity } from '@/lib/opportunities/types';
import { calcScore, priorityLevel } from '@/lib/opportunities/score';
import { PriorityPill } from '@/components/opportunities/cells';

// Layout espelha `renderScoreTab` do mockup (_giba:1125-1141): `.score-grid` com
// a linha total (gradiente) NO TOPO + os 5 fatores como cards, FTE em largura
// total. Os pesos abaixo replicam LITERALMENTE calcScore (SCORE-04, parity-tested)
// só para detalhar a contribuição de cada fator. O TOTAL prefere `o.score` da view
// (DB-authoritative); calcScore serve de verificação de paridade da fórmula.
const EFFORT_VALUES: Record<string, number> = { baixo: 8, medio: 14, alto: 20 };
const COMPLEX_VALUES: Record<string, number> = { baixo: 20, medio: 13, alto: 6 }; // INVERTIDO
const TIME_VALUES: Record<string, number> = { diario: 20, semanal: 16, quinzenal: 12, mensal: 8, anual: 2 };
const OBJ_VALUES: Record<number, number> = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 };
const FTE_VALUES: Record<string, number> = { muito_baixo: 4, baixo: 8, medio: 12, alto: 16, muito_alto: 20 };

const EFFORT_FALLBACK = 14;
const COMPLEX_FALLBACK = 13;
const TIME_FALLBACK = 16;
const OBJ_FALLBACK = 12;
const FTE_FALLBACK = 12;

type Props = { opportunity: Opportunity };

export function ScoreTab({ opportunity: o }: Props) {
  const esforcoPts = o.esforco ? (EFFORT_VALUES[o.esforco] ?? EFFORT_FALLBACK) : 0;
  const complexPts = o.complexidade ? (COMPLEX_VALUES[o.complexidade] ?? COMPLEX_FALLBACK) : 0;
  const tempoPts = o.tempo ? (TIME_VALUES[o.tempo] ?? TIME_FALLBACK) : 0;
  const objetivoPts = o.objetivo ? (OBJ_VALUES[o.objetivo] ?? OBJ_FALLBACK) : 0;
  const ftePts = o.fte ? (FTE_VALUES[o.fte] ?? FTE_FALLBACK) : 0;

  const computed = calcScore({
    esforco: o.esforco ?? undefined,
    complexidade: o.complexidade ?? undefined,
    tempo: o.tempo ?? undefined,
    objetivo: o.objetivo ?? undefined,
    fte: o.fte ?? undefined,
  });
  const score = o.score ?? computed;
  const level = o.priority_level ?? priorityLevel(score);

  return (
    <div className="px-5 py-[18px]">
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total — linha completa em gradiente, no topo (`.sc-row.full`) */}
        <div className="col-span-2 rounded-lg bg-gradient-to-br from-pril to-pri text-white text-center px-4 py-3.5">
          <div className="text-[11px] text-white/70 mb-1">Score Total (máx 100)</div>
          <div className="text-[36px] font-extrabold leading-none">{score}</div>
          <div className="mt-2 flex justify-center">
            <PriorityPill level={level} />
          </div>
        </div>

        <FactorRow label="Esforço / Viabilidade (20 pts)" value={labelEsforco(o.esforco)} points={esforcoPts} />
        <FactorRow label="Complexidade (20 pts)" value={labelEsforco(o.complexidade)} points={complexPts} />
        <FactorRow label="Frequência / Retorno (20 pts)" value={labelTempo(o.tempo)} points={tempoPts} />
        <FactorRow label="Alinhamento Estratégico (20 pts)" value={o.objetivo ? `${o.objetivo}/5` : '—'} points={objetivoPts} />
        <FactorRow full label="FTE — Impacto em Horas (20 pts)" value={labelFte(o.fte)} points={ftePts} />
      </div>

      <div className="mt-3 text-[11px] text-mut bg-slate-50 rounded-lg px-3 py-2">
        💡 Score = soma dos 5 fatores (esforço, complexidade, frequência, objetivo
        e FTE), máximo 100.
      </div>
    </div>
  );
}

function FactorRow({
  label,
  value,
  points,
  full,
}: {
  label: string;
  value: string;
  points: number;
  full?: boolean;
}) {
  const pct = (points / 20) * 100;
  return (
    <div className={`bg-bg rounded-lg px-3.5 py-2.5 ${full ? 'col-span-2' : ''}`}>
      <div className="text-[11px] text-mut mb-1">{label}</div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[14px] font-extrabold text-txt">{value}</span>
        <span className="text-[11px] text-mut tabular-nums">+{points} / 20</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-pri rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function labelEsforco(v: 'baixo' | 'medio' | 'alto' | null): string {
  if (!v) return '—';
  return { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }[v];
}

function labelTempo(
  v: 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'anual' | null,
): string {
  if (!v) return '—';
  return {
    diario: 'Diário',
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal',
    anual: 'Anual',
  }[v];
}

function labelFte(
  v: 'muito_baixo' | 'baixo' | 'medio' | 'alto' | 'muito_alto' | null,
): string {
  if (!v) return '—';
  return {
    muito_baixo: 'Muito Baixo',
    baixo: 'Baixo',
    medio: 'Médio',
    alto: 'Alto',
    muito_alto: 'Muito Alto',
  }[v];
}
