'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import type { OpportunityTask } from '@/lib/opportunities/types';
import { TASK_STATUS_META } from '@/lib/opportunities/task-labels';
import { assigneeName, type AssignableProfile } from '@/lib/opportunities/assignee-types';
import { computeTaskRollup, groupTasksByParent } from '@/lib/opportunities/task-rollup';

type Props = {
  opportunityId: string;
  tasks: OpportunityTask[];
  /** Candidatos a responsável do tenant — reusado de D-08, sem query nova de nomes. */
  assignableProfiles: AssignableProfile[];
};

// Data de input HTML (YYYY-MM-DD) → dd/mm/aa, sem `new Date()`/locale, para não
// divergir entre SSR e hidratação (mesma técnica de `fmtDataRegistro`).
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y.slice(2)}` : '—';
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

function StatusBadge({ status }: { status: OpportunityTask['status'] }) {
  const meta = TASK_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color }}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

/**
 * View Lista das tarefas de uma oportunidade, hierarquia de 2 níveis (D-01):
 * tarefas raiz + subtarefas indentadas abaixo, expandir/comprimir por tarefa
 * (TASK-07, estado local — D-13, independente do Gantt). A tarefa-pai com
 * subtarefas exibe o span agregado e o badge de conclusão vindos de
 * `computeTaskRollup`, calculados em runtime (TASK-11/D-02, nunca
 * persistidos). `groupTasksByParent` é o mesmo helper que o Gantt (16-07)
 * reusa, para que numeração (T001/T001.1) e ordem das linhas sejam idênticas
 * nas duas views. Analog: RiskTable.tsx (rótulo sequencial por índice) +
 * table.tsx (convenção geral de markup).
 */
export function TaskList({ opportunityId, tasks, assignableProfiles }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { roots, childrenByParent } = groupTasksByParent(tasks);
  const nameById = new Map(assignableProfiles.map((p) => [p.id, assigneeName(p)]));

  function toggleExpanded(taskId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  if (roots.length === 0) {
    return (
      <div className="bg-wh border border-bdr rounded-xl p-12 text-center">
        <h2 className="text-[14px] font-bold text-txt mb-2">
          Nenhuma tarefa cadastrada
        </h2>
        <p className="text-[12px] text-mut mb-4">
          Crie a primeira tarefa desta oportunidade para começar a planejar a
          execução.
        </p>
        <Link
          href={`/opportunities/${opportunityId}/tarefas/new`}
          className="inline-block px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-lg"
        >
          + Nova Tarefa
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-wh border border-bdr rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-bdr">
              <th className="px-2 py-2 w-9" aria-hidden="true" />
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
                ID
              </th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
                Título
              </th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
                Responsável
              </th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
                Status
              </th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
                Início → Fim
              </th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
                % Concluído
              </th>
            </tr>
          </thead>
          <tbody>
            {roots.map((root, i) => {
              const rootTid = `T${pad3(i + 1)}`;
              const children = childrenByParent.get(root.id) ?? [];
              const hasChildren = children.length > 0;
              const rollup = hasChildren ? computeTaskRollup(children) : null;
              const expanded = expandedIds.has(root.id);
              const assigneeLabel = root.assignee_id
                ? (nameById.get(root.assignee_id) ?? '—')
                : '—';

              return (
                <Fragment key={root.id}>
                  <tr className="border-b border-bdr/60 align-top">
                    <td className="px-2 py-2">
                      {hasChildren && (
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-label={
                            expanded
                              ? `Comprimir subtarefas de ${root.title}`
                              : `Expandir subtarefas de ${root.title}`
                          }
                          onClick={() => toggleExpanded(root.id)}
                          className="w-7 h-7 rounded-full text-mut hover:text-txt hover:bg-bg flex items-center justify-center text-[11px] focus:outline-none focus:ring-1 focus:ring-pri"
                        >
                          {expanded ? '▾' : '▸'}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2 text-[11px] font-semibold text-pri whitespace-nowrap">
                      {rootTid}
                    </td>
                    <td className="px-2 py-2 text-[12px] text-txt max-w-[220px]">
                      <span className="block truncate font-bold" title={root.title}>
                        {root.title}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-txt whitespace-nowrap">
                      {assigneeLabel}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <StatusBadge status={root.status} />
                    </td>
                    <td className="px-2 py-2 text-[11px] text-txt whitespace-nowrap">
                      {hasChildren ? (
                        <span title="Datas agregadas das subtarefas">
                          <span className="text-mut mr-1">Σ</span>
                          {fmtDate(rollup!.spanStart)} → {fmtDate(rollup!.spanDue)}
                        </span>
                      ) : (
                        <>
                          {fmtDate(root.start_date)} → {fmtDate(root.due_date)}
                        </>
                      )}
                    </td>
                    <td className="px-2 py-2 text-[11px] whitespace-nowrap">
                      {hasChildren ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-txt">
                          {rollup!.completedChildren}/{rollup!.totalChildren} concluídas
                        </span>
                      ) : (
                        <span className="text-mut">—</span>
                      )}
                    </td>
                  </tr>

                  {expanded &&
                    children.map((child, j) => {
                      const childTid = `${rootTid}.${j + 1}`;
                      const childAssigneeLabel = child.assignee_id
                        ? (nameById.get(child.assignee_id) ?? '—')
                        : '—';
                      return (
                        <tr key={child.id} className="border-b border-bdr/60 align-top bg-bg/40">
                          <td className="px-2 py-2" aria-hidden="true" />
                          <td className="px-2 py-2 text-[11px] font-semibold text-pri whitespace-nowrap">
                            {childTid}
                          </td>
                          <td className="px-2 py-2 text-[12px] text-txt max-w-[220px]">
                            <span
                              className="block truncate font-medium pl-8"
                              title={child.title}
                            >
                              {child.title}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-[11px] text-txt whitespace-nowrap">
                            {childAssigneeLabel}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <StatusBadge status={child.status} />
                          </td>
                          <td className="px-2 py-2 text-[11px] text-txt whitespace-nowrap">
                            {fmtDate(child.start_date)} → {fmtDate(child.due_date)}
                          </td>
                          <td className="px-2 py-2 text-[11px] text-mut whitespace-nowrap">
                            —
                          </td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
