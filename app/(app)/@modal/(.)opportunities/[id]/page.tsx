import {
  fetchOpportunityById,
  fetchPhasesForOpportunity,
  fetchRisksForOpportunity,
  fetchDocumentsForOpportunity,
  fetchNotesForOpportunity,
  fetchHistoryForOpportunity,
} from '@/lib/opportunities/queries';
import { isReadOnlyViewer } from '@/lib/security/role';
import { ModalShell } from '@/components/opportunities/modal/ModalShell';
import { OpportunityDetail } from '@/components/opportunities/modal/OpportunityDetail';

/**
 * Intercepting route: quando o usuário clica em <Link href="/opportunities/[id]">
 * dentro de /opportunities, este componente monta o modal SOBRE a lista
 * sem reload. Refresh ou acesso direto vai pra page.tsx fullscreen.
 *
 * Se a oportunidade NÃO existe (caso: foi excluída enquanto o modal estava
 * aberto), renderiza null — o modal slot some sem derrubar a página. A 404
 * "real" continua acontecendo apenas no fullscreen (acesso direto via URL).
 */
export default async function OpportunityModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await fetchOpportunityById(id);
  if (!opportunity) return null;
  const [phases, risks, documents, notes, history, readOnly] = await Promise.all([
    fetchPhasesForOpportunity(id),
    fetchRisksForOpportunity(id),
    fetchDocumentsForOpportunity(id),
    fetchNotesForOpportunity(id),
    fetchHistoryForOpportunity(id),
    isReadOnlyViewer(),
  ]);

  return (
    <ModalShell>
      <OpportunityDetail
        opportunity={opportunity}
        phases={phases}
        risks={risks}
        documents={documents}
        notes={notes}
        history={history}
        readOnly={readOnly}
      />
    </ModalShell>
  );
}
