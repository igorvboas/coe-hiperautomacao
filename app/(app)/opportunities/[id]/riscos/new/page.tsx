import { notFound } from 'next/navigation';
import { fetchOpportunityById } from '@/lib/opportunities/queries';
import { RiskFormPage } from '@/components/opportunities/modal/risk/RiskFormPage';

/**
 * Rota fullscreen REAL (não-interceptada) de criação de risco (D-02 deep-link).
 * Acesso direto via URL ou refresh renderiza o form em página inteira. O soft-path
 * (dialog empilhado) vive na aba Risco do modal — esta rota é só para deep-link.
 */
export default async function NewRiskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await fetchOpportunityById(id);
  if (!opportunity) notFound();

  return <RiskFormPage opportunityId={id} mode="create" />;
}
