'use client';

import { useState, useTransition } from 'react';
import { updateOpportunityStatus } from '@/lib/opportunities/actions';
import type { OpportunityStatus } from '@/lib/opportunities/types';
import { STATUS_OPTIONS } from '@/lib/opportunities/status';

type Props = {
  opportunityId: string;
  currentStatus: OpportunityStatus;
  readOnly?: boolean;
};

export function StatusSelector({ opportunityId, currentStatus, readOnly = false }: Props) {
  const [optimisticStatus, setOptimisticStatus] =
    useState<OpportunityStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OpportunityStatus;
    const prev = optimisticStatus;
    setOptimisticStatus(next);
    setError(null);

    startTransition(async () => {
      const result = await updateOpportunityStatus(opportunityId, next);
      if (!result.ok) {
        setOptimisticStatus(prev);
        setError(result.error);
      }
    });
  }

  if (readOnly) {
    const s = STATUS_OPTIONS.find((o) => o.value === optimisticStatus);
    return (
      <span className="px-2.5 py-1 rounded-full bg-white/20 border-2 border-white/40 text-white text-[11px] font-bold">
        {s ? `${s.icon} ${s.label}` : optimisticStatus}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <select
        value={optimisticStatus}
        onChange={onChange}
        disabled={pending}
        className="px-2.5 py-1 rounded-full bg-white/20 border-2 border-white/40 text-white text-[11px] font-bold disabled:opacity-60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60"
        aria-label="Alterar status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value} className="text-pri">
            {s.icon} {s.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="text-[10px] text-red-200 bg-red-900/40 rounded px-1.5 py-0.5">
          {error}
        </div>
      )}
    </div>
  );
}
