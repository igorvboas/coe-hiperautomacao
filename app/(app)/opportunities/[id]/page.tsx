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
  isTenantAdminOf,
  isPswStaff,
} from '@/lib/security/role';
import {
  fetchAssigneesForOpportunity,
  fetchAssignableProfiles,
  fetchAssignableProfilesForPlatformAdmin,
} from '@/lib/opportunities/assignees';
import { fetchTenantsByIds } from '@/lib/tenants/queries';
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
  // empresa — e é o ÚNICO papel que recebe a lista ampliada com o staff PSW
  // do tenant da PSW como candidato (ACCESS-09/D-05, Phase 17): o tenant_admin
  // de cliente continua vendo só as pessoas da própria empresa, exatamente
  // como hoje. Quem de fato autoriza o vínculo cross-tenant continua sendo a
  // trigger/policy de `opportunity_assignees` — esta lista só monta candidatos.
  //
  // Gate alinhado com a RLS (Phase 18, Plan 08, GRANT-04/GRANT-09): o par
  // pessoa × empresa contra o tenant DESTA oportunidade, mesmo critério do
  // gate de escrita em `assignee-actions.ts` — as policies de atribuição
  // (0047) já permitem que um staff-admin de A atribua dentro de A; manter o
  // gate visual mais restrito que o banco seria dívida silenciosa.
  const canAssign =
    isPlatformAdmin(profile) || (await isTenantAdminOf(profile, opportunity.tenant_id));
  const assignableProfiles = !canAssign
    ? []
    : isPlatformAdmin(profile)
      ? await fetchAssignableProfilesForPlatformAdmin(
          opportunity.tenant_id,
          profile!.tenantId
        )
      : await fetchAssignableProfiles(opportunity.tenant_id);

  // Sinalização de contexto (Phase 17): o staff PSW, ao abrir uma oportunidade
  // de outra empresa, precisa enxergar de qual empresa ela é — "por que estou
  // vendo isto". Só para este papel: para os demais, a empresa deles é sempre
  // a mesma e o rótulo seria ruído. Nenhuma query extra fora deste papel.
  const companyTenant = isPswStaff(profile)
    ? (await fetchTenantsByIds([opportunity.tenant_id]))[0] ?? null
    : null;

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
          companyName={companyTenant?.name ?? null}
        />
      </div>
    </div>
  );
}
