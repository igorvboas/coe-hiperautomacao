import type { Opportunity } from '@/lib/opportunities/types';
import { scoreColor } from '@/lib/opportunities/utils';
import { PriorityPill } from '@/components/opportunities/cells';

type Props = { opportunity: Opportunity };

// NOTA: breakdown por-fator aproximado. O número FINAL (`o.score`) vem da view
// (backend, fórmula de 5 fatores). O detalhamento completo de 5 fatores (incl. FTE)
// fica para a P13 (telas/Relatório). Pesos do `tempo` alinhados ao domínio de
// frequência (0011) para corrigir o type-error pós-evolução do schema.
const EFFORT_VALUES = { baixo: 25, medio: 15, alto: 5 } as const;
const COMPLEX_VALUES = { baixo: 25, medio: 15, alto: 5 } as const;
const TIME_VALUES = { diario: 20, semanal: 16, quinzenal: 12, mensal: 8, anual: 2 } as const;

function objetivoPoints(obj: number | null): number {
  if (!obj) return 0;
  return Math.round((Math.min(5, obj) / 5) * 25);
}

export function ScoreTab({ opportunity: o }: Props) {
  const esforcoPts = o.esforco ? EFFORT_VALUES[o.esforco] : 0;
  const complexPts = o.complexidade ? COMPLEX_VALUES[o.complexidade] : 0;
  const tempoPts = o.tempo ? TIME_VALUES[o.tempo] : 0;
  const objetivoPts = objetivoPoints(o.objetivo);

  const color = scoreColor(o.score);
  const pctScore = Math.min(100, Math.max(0, o.score));

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ComponentCard
          label="Esforço"
          value={labelOrDash(o.esforco)}
          points={esforcoPts}
          max={25}
        />
        <ComponentCard
          label="Complexidade"
          value={labelOrDash(o.complexidade)}
          points={complexPts}
          max={25}
        />
        <ComponentCard
          label="Tempo"
          value={labelOrDashTempo(o.tempo)}
          points={tempoPts}
          max={25}
        />
        <ComponentCard
          label="Objetivo"
          value={o.objetivo ? `${o.objetivo}/5` : '—'}
          points={objetivoPts}
          max={25}
        />
      </div>

      <div
        className="rounded-xl p-4 text-white flex items-center gap-4"
        style={{
          background: `linear-gradient(90deg, var(--color-pri), var(--color-pril))`,
        }}
      >
        <div className="text-3xl font-extrabold leading-none" style={{ color: '#fff' }}>
          {o.score}
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
          <PriorityPill level={o.priority_level} />
        </div>
      </div>

      <div className="mt-3 text-[11px] text-mut bg-slate-50 rounded-lg px-3 py-2">
        💡 Score = soma dos 4 componentes (máximo 100). Edição dos pesos virá na Phase 6.
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
        <div
          className="h-full bg-pri rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-mut mt-1 text-right">
        +{points} / {max}
      </div>
    </div>
  );
}

function labelOrDash(v: 'baixo' | 'medio' | 'alto' | null): string {
  if (!v) return '—';
  return { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }[v];
}

function labelOrDashTempo(
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
