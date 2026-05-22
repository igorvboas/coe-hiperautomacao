import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
  const tenantName = tenant?.name ?? '(sem tenant)';

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="bg-gradient-to-br from-pri to-pril text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center font-black text-sm">
            FG
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">CoE Hiperautomação</h1>
            <p className="text-xs opacity-75 truncate hidden sm:block">
              {tenantName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="opacity-90 hidden sm:inline truncate max-w-[200px]">
            {profile.full_name ?? profile.email}
          </span>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg font-semibold transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {modal}
    </div>
  );
}
