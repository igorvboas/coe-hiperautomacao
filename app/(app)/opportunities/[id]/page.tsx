import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  fetchOpportunityById,
  fetchPhasesForOpportunity,
  fetchRisksForOpportunity,
  fetchDocumentsForOpportunity,
  fetchNotesForOpportunity,
  fetchTasksForOpportunity,
} from '@/lib/opportunities/queries';
// Histórico: timeline unificada (audit_log 0038 + linhas legadas de
// opportunity_history), não mais só a tabela antiga.
import { fetchOpportunityTimeline } from '@/lib/audit/timeline';
import {
  isReadOnlyViewer,
  getCurrentProfile,
  isPlatformAdmin,
  isTenantAdmin,
} from '@/lib/security/role';
import {
  fetchAssigneesForOpportunity,
  fetchAssignableProfiles,
} from '@/lib/opportunities/assignees';
import { AssigneesPanel } from '@/components/opportunities/AssigneesPanel';
import { TasksEntryCard } from '@/components/opportunities/tasks/TasksEntryCard';
import { OpportunityDetail } from '@/components/opportunities/modal/OpportunityDetail';

/**
 * Fullscreen fallback: aberto via URL direta ou refresh em /opportunities/[id].
 * O modal sobre a lista é servido pelo intercepting route em @modal/.
 */
export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await fetchOpportunityById(id);
  if (!opportunity) notFound();
  const [phases, risks, documents, notes, history, readOnly, assignees, profile, tasks] =
    await Promise.all([
      fetchPhasesForOpportunity(id),
      fetchRisksForOpportunity(id),
      fetchDocumentsForOpportunity(id),
      fetchNotesForOpportunity(id),
      fetchOpportunityTimeline(id),
      isReadOnlyViewer(),
      fetchAssigneesForOpportunity(id),
      getCurrentProfile(),
      fetchTasksForOpportunity(id),
    ]);

  // Atribuir é privilégio de admin (0032). O platform_admin atribui em qualquer
  // empresa; o tenant_admin, só na sua — e os candidatos saem sempre do tenant
  // da OPORTUNIDADE, não do usuário (a trigger de 0032 recusa vínculo cruzado).
  const canAssign = isTenantAdmin(profile) || isPlatformAdmin(profile);
  const assignableProfiles = canAssign
    ? await fetchAssignableProfiles(opportunity.tenant_id)
    : [];

  return (
    <div className="px-6 lg:px-8 py-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-4">
          <Link
            href="/opportunities"
            className="text-[12px] font-semibold text-pri hover:text-pril inline-flex items-center gap-1"
          >
            ← Voltar para a lista
          </Link>
        </div>
        <div className="mb-4">
          <AssigneesPanel
            opportunityId={opportunity.id}
            assignees={assignees}
            options={assignableProfiles}
            canAssign={canAssign}
          />
        </div>

        <div className="mb-4">
          <TasksEntryCard opportunityId={opportunity.id} taskCount={tasks.length} />
        </div>

        <OpportunityDetail
          opportunity={opportunity}
          phases={phases}
          risks={risks}
          documents={documents}
          notes={notes}
          history={history}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
