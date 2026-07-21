import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  fetchOpportunityById,
  fetchPhasesForOpportunity,
  fetchRisksForOpportunity,
  fetchDocumentsForOpportunity,
  fetchNotesForOpportunity,
  fetchHistoryForOpportunity,
} from '@/lib/opportunities/queries';
import { isReadOnlyViewer } from '@/lib/security/role';
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
  const [phases, risks, documents, notes, history, readOnly] = await Promise.all([
    fetchPhasesForOpportunity(id),
    fetchRisksForOpportunity(id),
    fetchDocumentsForOpportunity(id),
    fetchNotesForOpportunity(id),
    fetchHistoryForOpportunity(id),
    isReadOnlyViewer(),
  ]);

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
