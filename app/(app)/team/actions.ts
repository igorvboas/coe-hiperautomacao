'use server';

// =============================================================================
// team/actions.ts — convites gerenciados pelo ADMIN DA EMPRESA (v0.4)
// -----------------------------------------------------------------------------
// Irmã de app/(app)/admin/invites/actions.ts, com uma diferença essencial de
// escopo: lá o platform_admin escolhe a empresa (e pode até criar uma nova);
// aqui o `tenant_id` NUNCA vem do formulário — é sempre derivado do profile do
// usuário logado. Isso torna impossível convidar alguém para outra empresa,
// mesmo forjando o payload.
//
// Camadas de defesa (mesmo padrão do resto do projeto):
//   1. Guard `isTenantAdmin()` aqui (falha cedo, mensagem pt-BR).
//   2. `tenant_id` server-derived — não é campo do form.
//   3. Allowlist explícita de `role` — 'platform_admin' inconvidável.
//   4. RLS (0029) é o bloqueio real: WITH CHECK exige
//      tenant_id = current_tenant_id() and current_user_role() = 'tenant_admin'.
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isTenantAdmin } from '@/lib/security/role';
import { parseRoleAndCargo } from '@/lib/security/cargo';

export type InviteResult = { error: string } | { ok: true };

export async function inviteTeamMember(formData: FormData): Promise<InviteResult> {
  const profile = await getCurrentProfile();
  if (!isTenantAdmin(profile)) return { error: 'Acesso negado.' };

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  // Dropdown único: o mesmo campo carrega nível de acesso OU cargo. `cargo` é
  // rótulo organizacional; quem manda na permissão continua sendo só `role`, e
  // todo cargo resolve para 'member' — 'platform_admin' segue inconvidável.
  const { role, cargo } = parseRoleAndCargo(formData.get('role'));

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: 'E-mail inválido.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('invited_emails').insert({
    email,
    tenant_id: profile!.tenantId, // server-derived — NUNCA do formulário
    role,
    cargo,
    invited_by: profile!.id,
  });

  if (error) {
    // O índice parcial `invited_emails_pending_email_uniq` (0022) é global, não
    // por tenant: um e-mail com convite pendente em OUTRA empresa também colide
    // aqui. A mensagem é deliberadamente vaga — confirmar "essa pessoa foi
    // convidada pela empresa X" vazaria informação de outro tenant.
    if (error.code === '23505') {
      return { error: 'Já existe um convite pendente para esse e-mail.' };
    }
    return { error: `Erro ao criar convite: ${error.message}` };
  }

  revalidatePath('/team');
  return { ok: true };
}

/**
 * Revoga um convite pendente da própria empresa. Retorna void: usado direto
 * como `action` de <form> num Server Component. A RLS (0029) recusa qualquer
 * id de outro tenant ou já usado — o delete simplesmente não afeta linhas.
 */
export async function revokeTeamInvite(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!isTenantAdmin(profile)) return;

  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from('invited_emails')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile!.tenantId); // defesa em profundidade sobre a RLS

  revalidatePath('/team');
}
