'use server';

// =============================================================================
// risk-actions.ts — server actions de `opportunity_risks` (Phase 12, RISK-01/03)
// -----------------------------------------------------------------------------
// Modela lib/opportunities/actions.ts (createOpportunity/updateOpportunity/
// deleteOpportunity). Camadas de defesa mass-assignment (T-12-01/02):
//   1. `riskInputSchema.strict()` rejeita priority/id/tenant_id/opportunity_id
//      no input (parse falha com `unrecognized_keys`).
//   2. insert/update enumeram colunas explicitamente — sem spread cego de
//      `data`/`input`. `tenant_id` vem do profile (server-derived);
//      `opportunity_id` vem do arg da rota (não do payload).
//   3. `priority` NUNCA é enviado — o trigger `set_risk_priority()` (matriz
//      impacto×probabilidade, _giba:1180-1185) é a única autoridade. É
//      `before insert OR update` (0011:294) → editar impacto/probabilidade
//      recalcula `priority` automaticamente no UPDATE (RISK-02 / D-04).
//   4. update/delete escopam por `.eq('tenant_id', profile.tenant_id)` — defesa
//      em profundidade sobre o RLS (USING + WITH CHECK).
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { riskInputSchema } from './risk-schema';

export type RiskActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type MutationResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// =============================================================================
// createRisk — insere novo risco após validação Zod (priority via trigger)
// =============================================================================
export async function createRisk(
  opportunityId: string,
  input: unknown
): Promise<RiskActionResult> {
  const parsed = riskInputSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: 'Dados inválidos.',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirada.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Profile não encontrado.' };

  const { data: inserted, error } = await supabase
    .from('opportunity_risks')
    .insert({
      opportunity_id: opportunityId, // server-derived (do arg da rota, não do payload)
      tenant_id: profile.tenant_id, // server-derived
      descricao: data.descricao,
      tipo: data.tipo,
      responsavel: data.responsavel || null,
      impacto: data.impacto,
      probabilidade: data.probabilidade,
      status: data.status,
      resposta: data.resposta || null,
      descricao_impacto: data.descricao_impacto || null,
      created_by: user.id,
      // priority NÃO enviado — trigger set_risk_priority() calcula (RISK-02 / D-04)
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      error: `Erro ao criar risco: ${error?.message ?? 'desconhecido'}`,
    };
  }

  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, id: inserted.id };
}

// =============================================================================
// updateRisk — atualiza campos do risco (priority recalculada pelo trigger)
// -----------------------------------------------------------------------------
// `opportunityId` é recebido apenas para o revalidatePath da rota do modal.
// =============================================================================
export async function updateRisk(
  riskId: string,
  opportunityId: string,
  input: unknown
): Promise<MutationResult> {
  const parsed = riskInputSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: 'Dados inválidos.',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirada.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Profile não encontrado.' };

  const { error } = await supabase
    .from('opportunity_risks')
    .update({
      descricao: data.descricao,
      tipo: data.tipo,
      responsavel: data.responsavel || null,
      impacto: data.impacto,
      probabilidade: data.probabilidade,
      status: data.status,
      resposta: data.resposta || null,
      descricao_impacto: data.descricao_impacto || null,
      // priority/tenant_id/opportunity_id NÃO enviados — trigger recalcula
      // priority no UPDATE (0011:294); tenant/opportunity são imutáveis.
    })
    .eq('id', riskId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { ok: false, error: `Erro ao atualizar risco: ${error.message}` };
  }

  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}

// =============================================================================
// deleteRisk — remove um risco (RLS + .eq('tenant_id') defesa em profundidade)
// =============================================================================
export async function deleteRisk(
  riskId: string,
  opportunityId: string
): Promise<MutationResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirada.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Profile não encontrado.' };

  const { error } = await supabase
    .from('opportunity_risks')
    .delete()
    .eq('id', riskId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { ok: false, error: `Erro ao excluir risco: ${error.message}` };
  }

  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}
