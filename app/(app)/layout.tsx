import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isPlatformAdmin } from '@/lib/security/role';
import { fetchTenantBranding } from '@/lib/branding/queries';
import { brandingCss } from '@/lib/branding/theme';
import { Sidebar } from '@/components/shell/Sidebar';
import { EMPRESA_COOKIE } from '@/lib/tenants/scope';
import { cookies } from 'next/headers';

export default async function AppLayout({
  children,
  modal,
}: LayoutProps<'/'>) {
  const profile = await getCurrentProfile();

  if (!profile) {
    // Sem sessão ou profile inconsistente (trigger handle_new_user falhou) → login
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  const isAdmin = isPlatformAdmin(profile);

  // Identidade visual da empresa (/configuracoes). `brandingCss` devolve '' se
  // a empresa não escolheu cor — aí globals.css fica no comando, sem override.
  const branding = await fetchTenantBranding(profile.tenantId);
  const themeCss = brandingCss(branding.brandColor);

  // Admin precisa da lista de empresas para o seletor (RLS cross-tenant).
  // Usa SLUG (não id) — é o que vai pra URL (?empresa=<slug>), sem expor UUID.
  let tenants: { slug: string; name: string }[] = [];
  if (isAdmin) {
    const supabase = await createClient();
    const { data } = await supabase.from('tenants').select('slug, name').order('name');
    tenants = data ?? [];
  }

  // Empresa lembrada: o `?empresa=` da URL some em qualquer navegação que não
  // carregue a query (redirect após mutação, refresh de rota). O cookie
  // devolve o recorte para o seletor e para os links do menu.
  const selectedEmpresa = (await cookies()).get(EMPRESA_COOKIE)?.value ?? '';

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Override dos tokens de marca (:root + .dark). Inline porque a cor vem
          do banco — não existe em build time. CSP permite style inline
          ('unsafe-inline' em style-src, ver proxy.ts). */}
      {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      <Suspense fallback={<div className="w-16 shrink-0 bg-nav" />}>
        <Sidebar
          profile={{
            fullName: profile.fullName,
            email: profile.email,
            role: profile.role,
            tenantName: profile.tenantName,
          }}
          tenants={tenants}
          selectedEmpresa={selectedEmpresa}
          logoUrl={branding.logoUrl}
        />
      </Suspense>
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      {modal}
    </div>
  );
}
