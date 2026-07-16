import Link from 'next/link';
import type { Opportunity } from '@/lib/opportunities/types';
import {
  SourceBadge,
  StatusBadge,
  ToolBadge,
  SeqIdDisplay,
} from './cells';
import { getInitials, scoreColor } from '@/lib/opportunities/utils';

type Props = { opportunities: Opportunity[] };

export function OpportunityCards({ opportunities }: Props) {
  if (opportunities.length === 0) {
    return (
      <div className="bg-white border border-bdr rounded-xl p-12 text-center text-mut">
        Nenhuma oportunidade encontrada.
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
      {opportunities.map((o) => (
        <Link
          key={o.id}
          href={`/opportunities/${o.id}`}
          className="bg-white border border-bdr rounded-xl p-3.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col gap-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-pri text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {getInitials(o.solicitante)}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold leading-tight truncate">
                  {o.solicitante}
                </div>
                <div className="text-[10px] text-mut truncate">
                  {o.subarea ?? o.area}
                </div>
              </div>
            </div>
            <SourceBadge source={o.source} />
          </div>

          <div className="text-[10px] text-pri font-semibold truncate">
            🏢 {o.area}
          </div>

          <div className="text-[11px] leading-snug line-clamp-3 text-txt flex-1">
            {o.processo}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-bdr mt-1">
            <div className="flex items-center gap-1.5">
              <SeqIdDisplay seqId={o.seq_id} />
              {o.criticidade === 'critica' && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"
                  title="Criticidade: Crítica"
                />
              )}
              <ToolBadge tool={o.ferramenta} />
            </div>
            <div
              className="w-9 h-9 rounded-full border-[3px] flex flex-col items-center justify-center flex-shrink-0"
              style={{ borderColor: `${scoreColor(o.score)}99` }}
            >
              <div
                className="text-[12px] font-black leading-none"
                style={{ color: scoreColor(o.score) }}
              >
                {o.score}
              </div>
            </div>
          </div>

          <div>
            <StatusBadge status={o.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
