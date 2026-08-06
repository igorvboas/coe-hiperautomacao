import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isTenantAdmin } from '@/lib/security/role';
import type { TenantRole } from '@/lib/opportunities/types';
import { cargoLabel } from '@/lib/security/cargo';
import { TeamInviteForm } from './TeamInviteForm';
import { revokeTeamInvite } from './actions';

// =============================================================================
// /team — gestão de acesso da PRÓPRIA empresa (v0.4)
// -----------------------------------------------------------------------------
// Só `tenant_admin` entra. O platform_admin da PSW não usa esta tela: ele tem
// /admin/invites, com alcance global e criação de empresas.
// =============================================================================

// O dropdown de convite não oferece mais "Membro" genérico: quem tem acesso de
// membro aparece pelo cargo. Perfis antigos (sem cargo) caem no rótulo do role.
function papelLabel(role: TenantRole, cargo: string | null): string {
  if (role === 'member' && cargo) return cargoLabel(cargo);
  return ROLE_LABEL[role] ?? role;
}

const ROLE_LABEL: Record<TenantRole, string> = {
  platform_admin: 'Administrador da plataforma',
  tenant_admin: 'Admin da empresa',
  member: 'Membro',
  viewer: 'Leitor (somente leitura)',
  psw_staff: 'Staff PSW (externo)',
};

type InviteRow = {
  id: string;
  email: string;
  role: TenantRole;
  cargo: string | null;
  used_at: string | null;
  created_at: string;
};

type MemberRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: TenantRole;
  cargo: string | null;
};

export default async function TeamPage() {
  const profile = await getCurrentProfile();
  if (!isTenantAdmin(profile)) redirect('/opportunities');

  const supabase = await createClient();

  // Filtro explícito por tenant_id além do RLS (CLAUDE.md — nunca confiar só
  // na policy, mesmo ela sendo o bloqueio real).
  const [invitesRes, membersRes] = await Promise.all([
    supabase
      .from('invited_emails')
      .select('id, email, role, cargo, used_at, created_at')
      .eq('tenant_id', profile!.tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, email, full_name, role, cargo')
      .eq('tenant_id', profile!.tenantId)
      .order('email'),
  ]);

  const invites = (invitesRes.data ?? []) as InviteRow[];
  const members = (membersRes.data ?? []) as MemberRow[];
  const pending = invites.filter((i) => !i.used_at);

  const thCls = 'px-4 py-2.5 font-bold';

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-txt">Equipe</h1>
          <p className="text-xs text-mut">
            Convide pessoas para acessar as oportunidades
            {profile!.tenantName ? ` de ${profile!.tenantName}` : ''} e defina o
            que cada uma pode fazer.
          </p>
        </div>
        <Link href="/opportunities" className="text-xs font-semibold text-pri hover:underline">
          ← Voltar
        </Link>
      </div>

      <TeamInviteForm tenantName={profile!.tenantName} />

      {/* Convites pendentes -------------------------------------------------- */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-txt">Convites pendentes</h2>
        <div className="bg-wh rounded-xl border border-bdr overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg text-left text-[11px] uppercase tracking-wide text-mut">
                <th className={thCls}>E-mail</th>
                <th className={thCls}>Papel</th>
                <th className={`${thCls} text-right`}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-mut">
                    Nenhum convite pendente.
                  </td>
                </tr>
              ) : (
                pending.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2.5">{inv.email}</td>
                    <td className="px-4 py-2.5">{papelLabel(inv.role, inv.cargo)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={revokeTeamInvite} className="inline">
                        <input type="hidden" name="id" value={inv.id} />
                        <button
                          type="submit"
                          className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline"
                        >
                          Revogar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pessoas com acesso -------------------------------------------------- */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-txt">Pessoas com acesso</h2>
        <div className="bg-wh rounded-xl border border-bdr overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg text-left text-[11px] uppercase tracking-wide text-mut">
                <th className={thCls}>Nome</th>
                <th className={thCls}>E-mail</th>
                <th className={thCls}>Papel</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2.5">{m.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5">{m.email}</td>
                  <td className="px-4 py-2.5">{papelLabel(m.role, m.cargo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-mut">
          Para trocar o papel de quem já tem conta, fale com a PSW — por ora só o
          convite define o papel inicial.
        </p>
      </div>
    </div>
  );
}
