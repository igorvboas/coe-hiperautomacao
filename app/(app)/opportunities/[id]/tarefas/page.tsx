import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  fetchOpportunityById,
  fetchTasksForOpportunity,
} from '@/lib/opportunities/queries';
import { fetchAssignableProfiles } from '@/lib/opportunities/assignees';
import { isReadOnlyViewer } from '@/lib/security/role';
import { TaskList } from '@/components/opportunities/tasks/TaskList';

/**
 * Sub-rota fullscreen do Plano de Atividades (RESEARCH §Pattern 6 — o Kanban de
 * 4 colunas e o Gantt não cabem na largura do modal). A view Lista (16-04) já
 * mostra a hierarquia de 2 níveis com rollup; Kanban/Gantt são os planos
 * 16-06/16-07. Mesmo wrapper de padding/largura máxima de
 * `app/(app)/opportunities/[id]/page.tsx`. Uma única busca do array PLANO de
 * tarefas (raízes + subtarefas juntas) — o agrupamento por `parent_task_id` e
 * o rollup acontecem na renderização da `TaskList`, nunca em outra query.
 */
export default async function TarefasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await fetchOpportunityById(id);
  if (!opportunity) notFound();

  const [tasks, readOnly] = await Promise.all([
    fetchTasksForOpportunity(id),
    isReadOnlyViewer(),
  ]);

  // Reusa fetchAssignableProfiles (D-08) só para resolver o nome do
  // responsável na Lista — nenhuma query nova de pessoas do tenant.
  const assignableProfiles = await fetchAssignableProfiles(opportunity.tenant_id);

  return (
    <div className="px-6 lg:px-8 py-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-4">
          <Link
            href={`/opportunities/${id}`}
            className="text-[12px] font-semibold text-pri hover:text-pril inline-flex items-center gap-1"
          >
            ← Voltar à oportunidade
          </Link>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[14px] font-bold text-txt">🗂️ Plano de Atividades</h1>
          {!readOnly && (
            <Link
              href={`/opportunities/${id}/tarefas/new`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-lg"
            >
              + Nova Tarefa
            </Link>
          )}
        </div>

        <TaskList
          opportunityId={id}
          tasks={tasks}
          assignableProfiles={assignableProfiles}
        />
      </div>
    </div>
  );
}
