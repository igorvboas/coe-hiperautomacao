'use client';

import { useState, useTransition } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type {
  Opportunity,
  OpportunityStatus,
} from '@/lib/opportunities/types';
import { updateOpportunityStatus } from '@/lib/opportunities/actions';
import { KanbanColumn } from './Column';

type Props = {
  opportunities: Opportunity[];
};

const COLUMNS: {
  status: OpportunityStatus;
  label: string;
  icon: string;
  color: string;
}[] = [
  { status: 'novo', label: 'Novo', icon: '🆕', color: '#64748b' },
  { status: 'em_analise', label: 'Em Análise', icon: '🔍', color: '#8b5cf6' },
  { status: 'planejamento', label: 'Planejamento', icon: '📋', color: '#3b82f6' },
  { status: 'backlog', label: 'Backlog', icon: '⏳', color: '#f59e0b' },
  { status: 'desenvolvimento', label: 'Desenvolvimento', icon: '⚙️', color: '#f97316' },
  { status: 'homologacao', label: 'Homologação', icon: '🧪', color: '#06b6d4' },
  { status: 'producao', label: 'Produção', icon: '🚀', color: '#22c55e' },
  { status: 'concluido', label: 'Concluído', icon: '✅', color: '#10b981' },
];

export function KanbanBoard({ opportunities }: Props) {
  const [opps, setOpps] = useState(opportunities);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Movimento só inicia após 5px de drag — preserva click pra navegação
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function onDragEnd(event: DragEndEvent) {
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
        <div className="mb-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
                />
              );
            })}
          </div>
        </div>
      </DndContext>
    </>
  );
}
