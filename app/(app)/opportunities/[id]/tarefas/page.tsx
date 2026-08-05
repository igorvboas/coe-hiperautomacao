import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  fetchOpportunityById,
  fetchTasksForOpportunity,
} from '@/lib/opportunities/queries';
import { fetchAssignableProfiles } from '@/lib/opportunities/assignees';
import { isReadOnlyViewer } from '@/lib/security/role';
import { TaskList } from '@/components/opportunities/tasks/TaskList';
import { TaskFormDialog } from '@/components/opportunities/tasks/TaskFormDialog';

/**
 * Sub-rota fullscreen do Plano de Atividades (RESEARCH §Pattern 6 — o Kanban de
 * 4 colunas e o Gantt não cabem na largura do modal). A view Lista (16-04) já
 * mostra a hierarquia de 2 níveis com rollup; Kanban/Gantt são os planos
 * 16-06/16-07. Mesmo wrapper de padding/largura máxima de
 * `app/(app)/opportunities/[id]/page.tsx`. Uma única busca do array PLANO de
 * tarefas (raízes + subtarefas juntas) — o agrupamento por `parent_task_id` e
 * o rollup acontecem na renderização da `TaskList`, nunca em outra query.
 *
 * 16-05: monta `TaskFormDialog` (soft-path `?tarefa=`) sobre o conteúdo da
 * página, reusando o mesmo array de tarefas e a mesma lista de profiles
 * atribuíveis já buscados aqui — nenhuma query nova. O CTA "+ Nova Tarefa" do
 * cabeçalho passa a abrir o diálogo pelo parâmetro de busca; a rota de
 * deep-link `/tarefas/new` continua servindo como fallback para acesso
 * direto/recarregamento (UI-SPEC §Routes).
 */
export default async function TarefasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const opportunity = await fetchOpportunityById(id);
  if (!opportunity) notFound();

  const [tasks, readOnly, rawSearchParams] = await Promise.all([
    fetchTasksForOpportunity(id),
    isReadOnlyViewer(),
    searchParams,
  ]);

  // Reusa fetchAssignableProfiles (D-08) só para resolver o nome do
  // responsável na Lista e popular o form do diálogo — nenhuma query nova de
  // pessoas do tenant.
  const assignableProfiles = await fetchAssignableProfiles(opportunity.tenant_id);

  // Href do CTA de cabeçalho: preserva qualquer parâmetro corrente (em
  // especial `?view=`, quando o view switcher chegar em 16-06) e acrescenta
  // `tarefa=new` — mesma regra de preservação de `TaskFormDialog.close()`.
  const ctaParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (typeof value === 'string') ctaParams.set(key, value);
  }
  ctaParams.set('tarefa', 'new');

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
              href={`/opportunities/${id}/tarefas?${ctaParams.toString()}`}
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
          readOnly={readOnly}
        />

        <TaskFormDialog
          opportunityId={id}
          tasks={tasks}
          assignableProfiles={assignableProfiles}
        />
      </div>
    </div>
  );
}
