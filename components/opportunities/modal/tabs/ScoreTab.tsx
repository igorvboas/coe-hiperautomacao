import type { Opportunity } from '@/lib/opportunities/types';
import { scoreColor } from '@/lib/opportunities/utils';
import { calcScore, priorityLevel } from '@/lib/opportunities/score';
import { PriorityPill } from '@/components/opportunities/cells';

type Props = { opportunity: Opportunity };

// D-11 / Pitfall 3: breakdown REAL de 5 fatores via a fórmula única
// (`lib/opportunities/score.ts` — SCORE-04 parity-tested). Os pesos abaixo
// espelham LITERALMENTE calcScore / `_giba:483-490` (mesmos mapas/fallbacks),
// usados só para detalhar a contribuição de cada fator. O TOTAL exibido prefere
// `o.score`/`o.priority_level` da view (DB-authoritative) — sem terceira cópia
// da fórmula (T-13-04b).
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

export function ScoreTab({ opportunity: o }: Props) {
  const esforcoPts = o.esforco ? (EFFORT_VALUES[o.esforco] ?? EFFORT_FALLBACK) : 0;
  const complexPts = o.complexidade ? (COMPLEX_VALUES[o.complexidade] ?? COMPLEX_FALLBACK) : 0;
  const tempoPts = o.tempo ? (TIME_VALUES[o.tempo] ?? TIME_FALLBACK) : 0;
  const objetivoPts = o.objetivo ? (OBJ_VALUES[o.objetivo] ?? OBJ_FALLBACK) : 0;
  const ftePts = o.fte ? (FTE_VALUES[o.fte] ?? FTE_FALLBACK) : 0;

  // Total DB-authoritative; calcScore como verificação de paridade da fórmula.
  const computed = calcScore({
    esforco: o.esforco ?? undefined,
    complexidade: o.complexidade ?? undefined,
    tempo: o.tempo ?? undefined,
    objetivo: o.objetivo ?? undefined,
    fte: o.fte ?? undefined,
  });
  const score = o.score ?? computed;
  const level = o.priority_level ?? priorityLevel(score);

  const color = scoreColor(score);
  const pctScore = Math.min(100, Math.max(0, score));

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ComponentCard label="Esforço" value={labelEsforco(o.esforco)} points={esforcoPts} max={20} />
        <ComponentCard label="Complexidade" value={labelEsforco(o.complexidade)} points={complexPts} max={20} />
        <ComponentCard label="Tempo (frequência)" value={labelTempo(o.tempo)} points={tempoPts} max={20} />
        <ComponentCard label="Objetivo" value={o.objetivo ? `${o.objetivo}/5` : '—'} points={objetivoPts} max={20} />
        <ComponentCard label="FTE (impacto)" value={labelFte(o.fte)} points={ftePts} max={20} />
      </div>

      <div
        className="rounded-xl p-4 text-white flex items-center gap-4"
        style={{
          background: `linear-gradient(90deg, var(--color-pri), var(--color-pril))`,
        }}
      >
        <div className="text-3xl font-extrabold leading-none" style={{ color: '#fff' }}>
          {score}
        </div>
        <div className="flex-1">
          <div className="text-[10px] opacity-80 mb-1">Score Final</div>
          <div className="bg-white/25 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pctScore}%`, background: '#fff' }}
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <PriorityPill level={level} />
        </div>
      </div>

      <div className="mt-3 text-[11px] text-mut bg-slate-50 rounded-lg px-3 py-2">
        💡 Score = soma dos 5 fatores (esforço, complexidade, tempo, objetivo e FTE), máximo 100.
      </div>

      {/* color é referência pro design system — usado se quiser tematizar acima */}
      <div className="hidden" data-score-color={color} />
    </div>
  );
}

type ComponentCardProps = {
  label: string;
  value: string;
  points: number;
  max: number;
};

function ComponentCard({ label, value, points, max }: ComponentCardProps) {
  const pct = max > 0 ? (points / max) * 100 : 0;
  return (
    <div className="bg-white border border-bdr rounded-lg p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1">
        {label}
      </div>
      <div className="text-sm font-extrabold text-txt mb-2">{value}</div>
      <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-pri rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-mut mt-1 text-right">
        +{points} / {max}
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
