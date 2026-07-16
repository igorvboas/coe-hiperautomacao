import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/shell/Sidebar';

export default async function AppLayout({
  children,
  modal,
}: LayoutProps<'/'>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Carrega profile + tenant via RLS — só vê o próprio profile + seu tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, tenant_id, tenants(name, slug)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Sessão válida mas sem profile = inconsistência (trigger handle_new_user falhou)
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Supabase aninha relacionamentos como objeto (single FK) ou array — extrai com segurança
  const tenantsField = profile.tenants as
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  const tenant = Array.isArray(tenantsField) ? tenantsField[0] : tenantsField;

  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar
        profile={{
          fullName: profile.full_name,
          email: profile.email,
          role: profile.role,
          tenantName: tenant?.name ?? null,
        }}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      {modal}
    </div>
  );
}
