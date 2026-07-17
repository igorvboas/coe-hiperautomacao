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
 * Timeline de fases. Phases pré-buscadas pelo Server Component pai
 * (não busca aqui pra ficar safe pra render em Client Component wrapper).
 */
export function FasesTab({ opportunity: _opp, phases }: Props) {
  const byKey = new Map(phases.map((p) => [p.phase_key, p]));

  return (
    <div className="px-5 py-4">
      <div className="space-y-0 divide-y divide-bdr mb-4">
        {PHASES.map((p) => {
          const row = byKey.get(p.key as never);
          const isActive = !!row?.started_at && !row?.finished_at;

          return (
            <div
              key={p.key}
              className={
                'flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg ' +
                (isActive ? 'bg-emerald-50 dark:bg-emerald-950/40' : '')
              }
            >
              <div className="w-7 text-base flex-shrink-0 text-center">{p.icon}</div>
              <div className="min-w-[130px] text-[12px] font-semibold flex items-center gap-2">
                {p.label}
                {isActive && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                    em andamento
                  </span>
                )}
              </div>
              <div className="flex gap-4 flex-1 items-center text-[11px] text-mut">
                <div className="flex items-center gap-1.5">
                  <span>Início:</span>
                  <span
                    className={
                      'font-mono ' + (row?.started_at ? 'text-txt' : 'text-slate-400 dark:text-slate-500')
                    }
                  >
                    {fmt(row?.started_at ?? null)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Fim:</span>
                  <span
                    className={
                      'font-mono ' + (row?.finished_at ? 'text-txt' : 'text-slate-400 dark:text-slate-500')
                    }
                  >
                    {fmt(row?.finished_at ?? null)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[11px] text-mut bg-bg rounded-lg px-3 py-2">
        💡 Datas mantidas automaticamente quando o status muda. Fase ativa em verde.
      </div>
    </div>
  );
}
