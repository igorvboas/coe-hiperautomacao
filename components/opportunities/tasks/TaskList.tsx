'use client';

import Link from 'next/link';
import type { OpportunityTask } from '@/lib/opportunities/types';
import { TASK_STATUS_META } from '@/lib/opportunities/task-labels';
import { assigneeName, type AssignableProfile } from '@/lib/opportunities/assignee-types';

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

/**
 * View Lista das tarefas RAIZ de uma oportunidade (parent_task_id nulo). A
 * hierarquia visual (chevron, subtarefas indentadas, rollup agregado) é a
 * expansão do plano 16-04 — este tracer (16-02) só prova o caminho de leitura
 * ponta a ponta. Analog: RiskTable.tsx (rótulo sequencial por índice, tabela
 * estreita) + table.tsx (convenção geral de markup).
 */
export function TaskList({ opportunityId, tasks, assignableProfiles }: Props) {
  const roots = tasks.filter((t) => !t.parent_task_id);
  const nameById = new Map(assignableProfiles.map((p) => [p.id, assigneeName(p)]));

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
            {roots.map((t, i) => {
              const tid = `T${String(i + 1).padStart(3, '0')}`;
              const meta = TASK_STATUS_META[t.status];
              const assigneeLabel = t.assignee_id
                ? (nameById.get(t.assignee_id) ?? '—')
                : '—';
              return (
                <tr key={t.id} className="border-b border-bdr/60 align-top">
                  <td className="px-2 py-2 text-[11px] font-semibold text-pri whitespace-nowrap">
                    {tid}
                  </td>
                  <td className="px-2 py-2 text-[12px] text-txt max-w-[220px]">
                    <span className="block truncate" title={t.title}>
                      {t.title}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[11px] text-txt whitespace-nowrap">
                    {assigneeLabel}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[11px] text-txt whitespace-nowrap">
                    {fmtDate(t.start_date)} → {fmtDate(t.due_date)}
                  </td>
                  <td className="px-2 py-2 text-[11px] text-mut whitespace-nowrap">
                    —
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
