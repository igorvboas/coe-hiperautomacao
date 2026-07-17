import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isPlatformAdmin } from '@/lib/security/role';
import { Sidebar } from '@/components/shell/Sidebar';

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

  // Admin precisa da lista de empresas para o seletor (RLS cross-tenant).
  // Usa SLUG (não id) — é o que vai pra URL (?empresa=<slug>), sem expor UUID.
  let tenants: { slug: string; name: string }[] = [];
  if (isAdmin) {
    const supabase = await createClient();
    const { data } = await supabase.from('tenants').select('slug, name').order('name');
    tenants = data ?? [];
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <Suspense fallback={<div className="w-16 shrink-0 bg-nav" />}>
        <Sidebar
          profile={{
            fullName: profile.fullName,
            email: profile.email,
            role: profile.role,
            tenantName: profile.tenantName,
          }}
          tenants={tenants}
        />
      </Suspense>
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      {modal}
    </div>
  );
}
