import { notFound, redirect } from 'next/navigation';
import { fetchOpportunityById } from '@/lib/opportunities/queries';
import { fetchAssignableProfiles } from '@/lib/opportunities/assignees';
import { TaskFormPage } from '@/components/opportunities/tasks/TaskFormPage';
import { isReadOnlyViewer } from '@/lib/security/role';

/**
 * Rota fullscreen de criação de tarefa RAIZ (D-11 — bloqueia `viewer` mesmo por
 * URL direta). Espelha `riscos/new/page.tsx`. Os candidatos a responsável saem
 * SEMPRE do tenant da OPORTUNIDADE (D-08/TASK-03), reusando
 * `fetchAssignableProfiles` — nenhuma query nova de pessoas do tenant.
 */
export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (await isReadOnlyViewer()) redirect(`/opportunities/${id}/tarefas`);
  const opportunity = await fetchOpportunityById(id);
  if (!opportunity) notFound();

  const assignableProfiles = await fetchAssignableProfiles(opportunity.tenant_id);

  return (
    <TaskFormPage opportunityId={id} assignableProfiles={assignableProfiles} />
  );
}
