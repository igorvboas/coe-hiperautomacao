import type { Opportunity } from '@/lib/opportunities/types';
import { getInitials, scoreColor } from '@/lib/opportunities/utils';
import { StatusSelector } from './StatusSelector';
import { DeleteButton } from './DeleteButton';
import { EditButton } from './EditButton';

type Props = {
  opportunity: Opportunity;
};

/**
 * Header do detail (modal e fullscreen): gradient azul + avatar + nome + status dropdown + score circle.
 */
export function ModalHeader({ opportunity: o }: Props) {
  const role =
    o.source === 'persona'
      ? `${o.subarea ?? ''} · ${o.area}`.replace(/^ · /, '').replace(/ · $/, '')
      : o.processo;

  const color = scoreColor(o.score);

  return (
    <div className="bg-gradient-to-br from-pri to-pril text-white px-5 py-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-black text-[15px] flex-shrink-0">
          {getInitials(o.solicitante)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-base truncate">
            #{String(o.seq_id).padStart(4, '0')} · {o.solicitante}
          </div>
          <div className="text-xs opacity-85 truncate mt-0.5">{role}</div>
          <div className="text-[11px] opacity-70 truncate mt-0.5">
            🏢 {o.area}
            {o.subarea && o.subarea !== o.area ? ` · ${o.subarea}` : ''}
          </div>
          <div className="mt-1.5">
            <StatusSelector opportunityId={o.id} currentStatus={o.status} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <EditButton opportunityId={o.id} />
        <DeleteButton
          opportunityId={o.id}
          label={`#${String(o.seq_id).padStart(4, '0')} · ${o.solicitante}`}
        />
        <div
          className="w-14 h-14 rounded-full border-[3px] flex flex-col items-center justify-center bg-white/10"
          style={{ borderColor: `${color}99` }}
        >
          <div className="text-lg font-black leading-none" style={{ color }}>
            {o.score}
          </div>
          <div className="text-[8px] opacity-75 uppercase tracking-wide">
            score
          </div>
        </div>
      </div>
    </div>
  );
}
