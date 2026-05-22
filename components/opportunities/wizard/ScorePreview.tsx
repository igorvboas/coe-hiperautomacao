'use client';

import { scoreColor } from '@/lib/opportunities/utils';

type Props = {
  esforco?: 'baixo' | 'medio' | 'alto';
  complexidade?: 'baixo' | 'medio' | 'alto';
  tempo?: 'pequeno' | 'medio' | 'grande';
  objetivo?: number;
};

function calcScore(p: Props): number {
  const em = { baixo: 25, medio: 15, alto: 5 } as const;
  const cm = { baixo: 25, medio: 15, alto: 5 } as const;
  const tm = { pequeno: 25, medio: 15, grande: 5 } as const;
  const e = p.esforco ? em[p.esforco] : 0;
  const c = p.complexidade ? cm[p.complexidade] : 0;
  const t = p.tempo ? tm[p.tempo] : 0;
  const o = p.objetivo
    ? Math.round((Math.min(5, p.objetivo) / 5) * 25)
    : 0;
  return e + c + t + o;
}

function priorityLevel(s: number): 'alta' | 'media' | 'baixa' {
  if (s >= 70) return 'alta';
  if (s >= 40) return 'media';
  return 'baixa';
}

export function ScorePreview(props: Props) {
  const score = calcScore(props);
  const color = scoreColor(score);
  const level = priorityLevel(score);
  const pct = Math.min(100, score);
  const levelLabel = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[level];

  return (
    <div
      className="rounded-xl p-4 text-white flex items-center gap-4"
      style={{
        background:
          'linear-gradient(90deg, var(--color-pri), var(--color-pril))',
      }}
    >
      <div className="text-3xl font-extrabold leading-none" style={{ color: '#fff' }}>
        {score}
      </div>
      <div className="flex-1">
        <div className="text-[10px] opacity-80 mb-1">Score Preview</div>
        <div className="bg-white/25 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: '#fff' }}
          />
        </div>
      </div>
      <div
        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
        style={{ background: color, color: '#fff' }}
      >
        {levelLabel}
      </div>
    </div>
  );
}
