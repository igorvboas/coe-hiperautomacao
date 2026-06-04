'use client';

import { calcScore, priorityLevel, type Prioridade } from '@/lib/opportunities/score';
import { scoreColor } from '@/lib/opportunities/utils';

// SCORE-04: consome a fórmula ÚNICA de lib/opportunities/score.ts (5 fatores,
// incl. o bucket de FTE como 5º fator) — sem fórmula própria. Props segue
// Prioridade: domínio de frequência para `tempo` ('diario'..'anual') e `fte`
// ('muito_baixo'..'muito_alto'). Call-sites legados que ainda passam o domínio
// antigo de `tempo` caem no fallback do calcScore (16) até a Phase 11 colar os
// novos campos no wizard — comportamento aditivo aceito (P10 não reescreve o wizard).
type Props = Prioridade;

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
