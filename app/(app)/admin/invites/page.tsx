import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cargoLabel } from '@/lib/security/cargo';
import { InviteForm } from './InviteForm';
import { ResendButton } from './ResendButton';
import { revokeInvite } from './actions';

type InviteRow = {
  id: string;
  email: string;
  role: 'member' | 'tenant_admin' | 'viewer' | 'psw_staff';
  cargo: string | null;
  used_at: string | null;
  created_at: string;
  tenants: { name: string } | { name: string }[] | null;
};

const ROLE_LABEL: Record<InviteRow['role'], string> = {
  member: 'Membro',
  tenant_admin: 'Admin da empresa',
  viewer: 'Leitor (somente leitura)',
  psw_staff: 'Staff PSW',
};

function tenantName(t: InviteRow['tenants']): string {
  const obj = Array.isArray(t) ? t[0] : t;
  return obj?.name ?? '—';
}

export default async function InvitesPage() {
  const supabase = await createClient();

  const [invitesRes, tenantsRes] = await Promise.all([
    supabase
      .from('invited_emails')
      .select('id, email, role, cargo, used_at, created_at, tenants(name)')
      .order('created_at', { ascending: false }),
    supabase.from('tenants').select('id, name').order('name'),
  ]);

  const invites = (invitesRes.data ?? []) as InviteRow[];
  const tenants = (tenantsRes.data ?? []) as { id: string; name: string }[];

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-txt">Convites de acesso</h1>
          <p className="text-xs text-mut">
            Libere e-mails para que empresas criem suas contas.
          </p>
        </div>
        <Link
          href="/opportunities"
          className="text-xs font-semibold text-pri hover:underline"
        >
          ← Voltar
        </Link>
      </div>

      <InviteForm tenants={tenants} />

      <div className="bg-wh rounded-xl border border-bdr overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg text-left text-[11px] uppercase tracking-wide text-mut">
              <th className="px-4 py-2.5 font-bold">E-mail</th>
              <th className="px-4 py-2.5 font-bold">Empresa</th>
              <th className="px-4 py-2.5 font-bold">Papel</th>
              <th className="px-4 py-2.5 font-bold">Cargo</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5 font-bold text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-mut">
                  Nenhum convite ainda.
                </td>
              </tr>
            ) : (
              invites.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2.5">{inv.email}</td>
                  <td className="px-4 py-2.5">{tenantName(inv.tenants)}</td>
                  <td className="px-4 py-2.5">
                    {ROLE_LABEL[inv.role] ?? inv.role}
                  </td>
                  <td className="px-4 py-2.5">{cargoLabel(inv.cargo)}</td>
                  <td className="px-4 py-2.5">
                    {inv.used_at ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full dark:text-emerald-300 dark:bg-emerald-950/40">
                        ✓ Usado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full dark:text-amber-300 dark:bg-amber-950/40">
                        ⏳ Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!inv.used_at && (
                      <span className="inline-flex items-center gap-3">
                        <ResendButton id={inv.id} />
                        <form action={revokeInvite} className="inline">
                          <input type="hidden" name="id" value={inv.id} />
                          <button
                            type="submit"
                            className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline"
                          >
                            Revogar
                          </button>
                        </form>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
