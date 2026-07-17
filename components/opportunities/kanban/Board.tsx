'use client';

import { useState, useTransition } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Opportunity, OpportunityStatus } from '@/lib/opportunities/types';
import { updateOpportunityStatus } from '@/lib/opportunities/actions';
import { STATUS_ORDER, STATUS_META } from '@/lib/opportunities/status';
import { KanbanColumn } from './Column';

type Props = {
  opportunities: Opportunity[];
  /** RBAC (v0.3) — viewer não arrasta cards nem edita nada. */
  readOnly?: boolean;
};

// 11 colunas (fonte única: lib/opportunities/status.ts) — mesma ordem exibida
// no seletor de status do header do modal.
const COLUMNS = STATUS_ORDER.map((status) => ({
  status,
  label: STATUS_META[status].label,
  icon: STATUS_META[status].icon,
  color: STATUS_META[status].color,
}));

export function KanbanBoard({ opportunities, readOnly = false }: Props) {
  const [opps, setOpps] = useState(opportunities);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Movimento só inicia após 5px de drag — preserva click pra navegação
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function onDragEnd(event: DragEndEvent) {
    if (readOnly) return;
    const { active, over } = event;
    if (!over) return;

    const oppId = String(active.id);
    const targetStatus = over.data.current?.status as
      | OpportunityStatus
      | undefined;
    if (!targetStatus) return;

    const opp = opps.find((o) => o.id === oppId);
    if (!opp || opp.status === targetStatus) return;

    // Optimistic update
    const prev = opps;
    const next = opps.map((o) =>
      o.id === oppId ? { ...o, status: targetStatus } : o
    );
    setOpps(next);
    setError(null);

    startTransition(async () => {
      const result = await updateOpportunityStatus(oppId, targetStatus);
      if (!result.ok) {
        setOpps(prev); // rollback
        setError(result.error);
      }
    });
  }

  return (
    <>
      {error && (
        <div className="mb-3 text-[11px] text-red-700 bg-red-50 border border-red-200 dark:text-red-300 dark:bg-red-950/40 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max items-start">
            {COLUMNS.map((col) => {
              const items = opps.filter((o) => o.status === col.status);
              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  icon={col.icon}
                  color={col.color}
                  opportunities={items}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
        </div>
      </DndContext>
    </>
  );
}
