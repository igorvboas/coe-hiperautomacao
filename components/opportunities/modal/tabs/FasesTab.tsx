import type { Opportunity } from '@/lib/opportunities/types';
import type { OpportunityPhase } from '@/lib/opportunities/queries';

type Props = {
  opportunity: Opportunity;
  phases: OpportunityPhase[];
};

const PHASES: { key: string; label: string; icon: string }[] = [
  { key: 'em_analise', label: 'Em Análise', icon: '🔍' },
  { key: 'planejamento', label: 'Planejamento', icon: '📋' },
  { key: 'backlog', label: 'Backlog', icon: '⏳' },
  { key: 'desenvolvimento', label: 'Desenvolvimento', icon: '⚙️' },
  { key: 'homologacao', label: 'Homologação', icon: '🧪' },
  { key: 'producao', label: 'Produção', icon: '🚀' },
  { key: 'concluido', label: 'Concluído', icon: '✅' },
];

const FMT = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function fmt(ts: string | null): string {
  if (!ts) return '—';
  return FMT.format(new Date(ts));
}

/**
 * Timeline de fases. Layout espelha `renderFasesTab` do mockup (_giba:1158-1177)
 * — cabeçalho Fase/Início/Fim + linhas em grid — mas READ-ONLY: as datas são
 * mantidas automaticamente pelos triggers de status (não há edição manual aqui).
 */
export function FasesTab({ opportunity: _opp, phases }: Props) {
  const byKey = new Map(phases.map((p) => [p.phase_key, p]));

  return (
    <div className="px-5 py-[18px]">
      {/* Cabeçalho de colunas */}
      <div className="grid grid-cols-[1fr_130px_130px] gap-2.5 px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-mut">
        <span>Fase</span>
        <span>Início</span>
        <span>Fim</span>
      </div>

      <div className="space-y-2 mb-4">
        {PHASES.map((p) => {
          const row = byKey.get(p.key as never);
          const isActive = !!row?.started_at && !row?.finished_at;
          return (
            <div
              key={p.key}
              className={
                'grid grid-cols-[1fr_130px_130px] gap-2.5 items-center rounded-lg px-3.5 py-2.5 ' +
                (isActive ? 'bg-emerald-50 border border-emerald-200' : 'bg-bg')
              }
            >
              <div className="text-[12px] font-semibold flex items-center gap-2">
                <span>{p.icon}</span>
                <span>{p.label}</span>
                {isActive && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                    em andamento
                  </span>
                )}
              </div>
              <span
                className={
                  'text-[11px] tabular-nums ' +
                  (row?.started_at ? 'text-txt' : 'text-slate-400')
                }
              >
                {fmt(row?.started_at ?? null)}
              </span>
              <span
                className={
                  'text-[11px] tabular-nums ' +
                  (row?.finished_at ? 'text-txt' : 'text-slate-400')
                }
              >
                {fmt(row?.finished_at ?? null)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-mut bg-slate-50 rounded-lg px-3 py-2">
        💡 Datas mantidas automaticamente quando o status muda. Fase ativa em verde.
      </div>
    </div>
  );
}
