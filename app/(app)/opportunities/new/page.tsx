import { redirect } from 'next/navigation';
import { WizardShell } from '@/components/opportunities/wizard/WizardShell';
import { isReadOnlyViewer } from '@/lib/security/role';

export default async function NewOpportunityPage() {
  // RBAC (v0.3): viewer nunca chega ao formulário, nem por URL direta —
  // createOpportunity já rejeita no servidor (requireEditorRole), isto é UX.
  if (await isReadOnlyViewer()) redirect('/opportunities');
  return <WizardShell mode="create" />;
}
