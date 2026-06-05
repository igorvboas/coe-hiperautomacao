'use client';

import { useDraggable } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import type { Opportunity } from '@/lib/opportunities/types';
import { SourceBadge, RpaFitBadge } from '@/components/opportunities/cells';
import { scoreColor } from '@/lib/opportunities/utils';

type Props = {
  opportunity: Opportunity;
};

export function KanbanCard({ opportunity: o }: Props) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: o.id,
      data: { status: o.status },
    });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  // Click sem drag → navega; com drag → ignora (@dnd-kit suprime via activation constraint do sensor)
  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!isDragging) {
      router.push(`/opportunities/${o.id}`);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="bg-white border border-bdr rounded-lg p-2.5 hover:border-pril hover:shadow-md transition-shadow"
    >
      <div className="text-[10px] font-extrabold text-pri tracking-wider mb-1">
        #{String(o.seq_id).padStart(4, '0')}
      </div>
      <div className="text-[11px] font-semibold leading-snug line-clamp-2 mb-1.5">
        {o.processo}
      </div>
      <div className="text-[10px] text-mut truncate mb-2">{o.solicitante}</div>
      <div className="flex items-center gap-1 flex-wrap mb-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap bg-slate-100 text-slate-600">
          ⏱️ {Math.round(o.fte_horas ?? 0)}h/mês
        </span>
        <RpaFitBadge score={o.rpa_score} />
      </div>
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
        <SourceBadge source={o.source} />
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: scoreColor(o.score) }}
          />
          <span
            className="text-[11px] font-extrabold tabular-nums"
            style={{ color: scoreColor(o.score) }}
          >
            {o.score}
          </span>
        </div>
      </div>
    </div>
  );
}
