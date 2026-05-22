import { fetchOpportunityById } from '@/lib/opportunities/queries';
import { WizardShell } from '@/components/opportunities/wizard/WizardShell';
import { opportunityToFormData } from '@/components/opportunities/wizard/state';

/**
 * Intercepting route do modo edit: quando o usuário clica em "✏️ Editar"
 * dentro do modal, monta o wizard sobre tudo (próprio overlay).
 *
 * Se a oportunidade não existe (foi deletada), renderiza null — slot some
 * silenciosamente em vez de derrubar a página com 404.
 */
export default async function EditOpportunityModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opp = await fetchOpportunityById(id);
  if (!opp) return null;

  return (
    <WizardShell
      mode="edit"
      opportunityId={id}
      initialData={opportunityToFormData(opp)}
    />
  );
}
