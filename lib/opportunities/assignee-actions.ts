'use server';

// =============================================================================
// assignee-actions.ts — atribuir/desatribuir pessoas (0032; cross-tenant D-05
// na Phase 17)
// -----------------------------------------------------------------------------
// Camadas de defesa (mesmo padrão do resto do projeto):
//   1. Guard de role aqui — só tenant_admin ou platform_admin escrevem.
//   2. `tenant_id` derivado da OPORTUNIDADE no servidor, nunca do formulário.
//   3. Candidatos validados: do MESMO tenant da oportunidade sempre; OU
//      `psw_staff` de QUALQUER tenant quando quem atribui é `platform_admin`
//      (D-05) — o único vínculo cruzado legítimo desta fase.
//   4. RLS (0032) é o bloqueio real. A trigger `check_assignee_tenant()`
//      (reescrita na 0040) repete esta mesma regra no banco: aceita vínculo
//      cruzado SOMENTE quando o profile atribuído é `psw_staff`, e continua
//      rejeitando qualquer outro profile de tenant diferente — inclusive
//      quando quem atribui é `platform_admin`.
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getCurrentProfile,
  isPlatformAdmin,
  isTenantAdmin,
  isPswStaff,
} from '@/lib/security/role';

export type AssignResult = { ok: true } | { ok: false; error: string };

/**
 * Define o conjunto EXATO de pessoas atribuídas a uma oportunidade (o que não
 * vier na lista é desatribuído). Idempotente: reenviar a mesma lista não muda
 * nada.
 */
export async function setOpportunityAssignees(
  opportunityId: string,
  profileIds: string[]
): Promise<AssignResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  const canAssign = isTenantAdmin(profile) || isPlatformAdmin(profile);
  if (!canAssign) {
    return { ok: false, error: 'Só o admin da empresa pode atribuir pessoas.' };
  }

  const supabase = await createClient();

  // tenant_id vem da oportunidade (server-derived). Para o tenant_admin, a RLS
  // já teria escondido oportunidade de outro tenant — o select falha e paramos
  // aqui com uma mensagem clara em vez de um 42501 cru.
  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, tenant_id')
    .eq('id', opportunityId)
    .single();

  if (!opp) return { ok: false, error: 'Oportunidade não encontrada.' };
  if (!isPlatformAdmin(profile) && opp.tenant_id !== profile.tenantId) {
    return { ok: false, error: 'Oportunidade de outra empresa.' };
  }

  // Aceita profiles do MESMO tenant da oportunidade — a regra de sempre — OU,
  // quando quem atribui é `platform_admin`, também profiles `psw_staff` de
  // QUALQUER tenant (D-05: só o platform_admin vincula gente da PSW a
  // oportunidades de outra empresa; um tenant_admin de cliente não pode, e a
  // UI de convite nem oferece essa opção — esta é a segunda camada). A
  // trigger `check_assignee_tenant()` (0040) repete a checagem no banco —
  // esta camada existe para a mensagem legível, não como bloqueio único.
  const unique = Array.from(new Set(profileIds.filter(Boolean)));
  let valid: string[] = [];
  if (unique.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, tenant_id, role')
      .in('id', unique);
    const actingAsPlatformAdmin = isPlatformAdmin(profile);
    valid = (profiles ?? [])
      .filter(
        (p) =>
          p.tenant_id === opp.tenant_id ||
          (actingAsPlatformAdmin && isPswStaff(p))
      )
      .map((p) => p.id);
    if (valid.length !== unique.length) {
      return { ok: false, error: 'Alguma das pessoas não pertence a esta empresa.' };
    }
  }

  // Reconcilia: apaga o que saiu, insere o que entrou. Duas queries pequenas,
  // sem transação — o pior caso de uma falha no meio é a lista ficar como
  // estava em parte, e o admin reenviar.
  const { data: current } = await supabase
    .from('opportunity_assignees')
    .select('profile_id')
    .eq('opportunity_id', opportunityId);

  const currentIds = (current ?? []).map((r) => r.profile_id);
  const toRemove = currentIds.filter((id) => !valid.includes(id));
  const toAdd = valid.filter((id) => !currentIds.includes(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('opportunity_assignees')
      .delete()
      .eq('opportunity_id', opportunityId)
      .in('profile_id', toRemove);
    if (error) return { ok: false, error: `Erro ao desatribuir: ${error.message}` };
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from('opportunity_assignees').insert(
      toAdd.map((profileId) => ({
        opportunity_id: opportunityId,
        profile_id: profileId,
        tenant_id: opp.tenant_id, // server-derived — NUNCA do formulário
        created_by: profile.id,
      }))
    );
    if (error) return { ok: false, error: `Erro ao atribuir: ${error.message}` };
  }

  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}
