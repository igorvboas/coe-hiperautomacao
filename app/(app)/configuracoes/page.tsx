import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile, isPlatformAdmin, isTenantAdmin } from '@/lib/security/role';
import { fetchTenantBranding } from '@/lib/branding/queries';
import { BrandingForm } from './BrandingForm';

// =============================================================================
// /configuracoes — identidade visual da PRÓPRIA empresa (v0.4)
// -----------------------------------------------------------------------------
// Só admin entra: `tenant_admin` (dono da empresa) e `platform_admin` (que
// também tem um tenant próprio). member/viewer são redirecionados — eles VEEM o
// tema, não o configuram.
// =============================================================================

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  if (!isTenantAdmin(profile) && !isPlatformAdmin(profile)) redirect('/opportunities');

  const branding = await fetchTenantBranding(profile!.tenantId);

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-txt">Configurações</h1>
          <p className="text-xs text-mut">
            Identidade visual{profile!.tenantName ? ` de ${profile!.tenantName}` : ''} — cor
            principal e logo. Vale para todas as pessoas da empresa.
          </p>
        </div>
        <Link href="/opportunities" className="text-xs font-semibold text-pri hover:underline">
          ← Voltar
        </Link>
      </div>

      <BrandingForm
        brandColor={branding.brandColor}
        logoUrl={branding.logoUrl}
        tenantName={profile!.tenantName}
      />
    </div>
  );
}
