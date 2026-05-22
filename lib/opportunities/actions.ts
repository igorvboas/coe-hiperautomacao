'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { OpportunityStatus } from './types';
import { opportunityInputSchema } from './schema';

export type UpdateStatusResult = { ok: true } | { ok: false; error: string };

/**
 * Atualiza status de uma oportunidade. RLS protege por tenant.
 * O trigger SQL sync_opportunity_phase (0004) mantém opportunity_phases em dia.
 */
export async function updateOpportunityStatus(
  id: string,
  newStatus: OpportunityStatus
): Promise<UpdateStatusResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('opportunities')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    return { ok: false, error: `Falha ao atualizar status: ${error.message}` };
  }

  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${id}`);
  return { ok: true };
}

// =============================================================================
// createPublicOpportunity — submit do formulário público (sem auth)
// =============================================================================
// Usa RPC SECURITY DEFINER (`create_public_opportunity`) — bypassa RLS dentro
// da função, mas faz validações próprias e respeita o slug do tenant.
//
// Não revalida rotas autenticadas — o gestor do tenant verá no próximo refresh.
// =============================================================================
export type PublicSubmitInput = {
  solicitante: string;
  email: string;
  area: string;
  subarea?: string;
  processo: string;
  frequencia?: string;
  volume_medio?: string;
  tempo_execucao?: string;
  num_pessoas?: string;
  ferramenta?: 'rpa' | 'n8n' | 'ambos' | null;
  escopo_automacao?: string[];
  beneficios_esperados?: string[];
  esforco?: 'baixo' | 'medio' | 'alto';
  complexidade?: 'baixo' | 'medio' | 'alto';
  tempo?: 'pequeno' | 'medio' | 'grande';
  objetivo: number;
  formulario_extras?: Record<string, unknown>;
};

export type CreatePublicResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPublicOpportunity(
  tenantSlug: string,
  input: PublicSubmitInput
): Promise<CreatePublicResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_public_opportunity', {
    p_tenant_slug: tenantSlug,
    p_solicitante: input.solicitante,
    p_email: input.email,
    p_area: input.area,
    p_subarea: input.subarea ?? '',
    p_processo: input.processo,
    p_frequencia: input.frequencia ?? '',
    p_volume_medio: input.volume_medio ?? '',
    p_tempo_execucao: input.tempo_execucao ?? '',
    p_num_pessoas: input.num_pessoas ?? '',
    p_ferramenta: input.ferramenta ?? '',
    p_escopo_automacao: (input.escopo_automacao ?? []).filter(
      (s) => s.trim().length > 0
    ),
    p_beneficios_esperados: (input.beneficios_esperados ?? []).filter(
      (s) => s.trim().length > 0
    ),
    p_esforco: input.esforco ?? 'medio',
    p_complexidade: input.complexidade ?? 'medio',
    p_tempo: input.tempo ?? 'medio',
    p_objetivo: input.objetivo,
    p_formulario_extras: (input.formulario_extras ?? {}) as never,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data as unknown as string };
}

// =============================================================================
// deleteOpportunity — remove uma oportunidade (RLS protege tenant)
// =============================================================================
export type DeleteOpportunityResult = { ok: true } | { ok: false; error: string };

export async function deleteOpportunity(
  id: string
): Promise<DeleteOpportunityResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('opportunities').delete().eq('id', id);

  if (error) {
    return { ok: false, error: `Erro ao excluir: ${error.message}` };
  }

  revalidatePath('/opportunities');
  return { ok: true };
}

// =============================================================================
// createOpportunity — insere nova oportunidade após validação Zod
// -----------------------------------------------------------------------------
// Mass Assignment defense layers (Phase 7.5, HARDEN-B-01):
//   1. `opportunityInputSchema.strict()` rejeita tenant_id, created_by,
//      seq_id, id, created_at, updated_at no input (parse falha com
//      `unrecognized_keys`).
//   2. `.insert({...})` abaixo enumera campos explicitamente — sem
//      spread cego de `data`/`input`. tenant_id e created_by vêm do
//      `auth.uid()` lookup (server-derived).
//   3. RLS `WITH CHECK (tenant_id = current_tenant_id())` em opportunities
//      bloqueia em DB caso algo escape.
//   4. Trigger `trg_opportunities_seq_id` sobrescreve `seq_id` sempre,
//      ignorando qualquer valor que viesse do cliente.
// =============================================================================
export type CreateOpportunityResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createOpportunity(
  input: unknown
): Promise<CreateOpportunityResult> {
  const parsed = opportunityInputSchema.safeParse(input);
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
    .from('opportunities')
    .insert({
      tenant_id: profile.tenant_id,
      source: data.source,
      solicitante: data.solicitante,
      email: data.email || null,
      area: data.area,
      subarea: data.subarea || null,
      processo: data.processo,
      frequencia: data.frequencia || null,
      volume_medio: data.volume_medio || null,
      tempo_execucao: data.tempo_execucao || null,
      num_pessoas: data.num_pessoas || null,
      ferramenta: data.ferramenta ?? null,
      escopo_automacao: data.escopo_automacao,
      beneficios_esperados: data.beneficios_esperados,
      esforco: data.esforco,
      complexidade: data.complexidade,
      tempo: data.tempo,
      objetivo: data.objetivo,
      status: data.status,
      responsavel: data.responsavel || null,
      notas: data.notas || null,
      persona_extras:
        data.source === 'persona' ? data.persona_extras ?? null : null,
      formulario_extras:
        data.source === 'formulario' ? data.formulario_extras ?? null : null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      error: `Erro ao criar: ${error?.message ?? 'desconhecido'}`,
    };
  }

  revalidatePath('/opportunities');
  return { ok: true, id: inserted.id };
}

// =============================================================================
// updateOpportunity — atualiza campos da oportunidade (NÃO inclui status)
// -----------------------------------------------------------------------------
// Mass Assignment defense layers (Phase 7.5, HARDEN-B-01):
//   1. `opportunityInputSchema.strict()` rejeita tenant_id, created_by,
//      seq_id, id, created_at, updated_at no input (parse falha com
//      `unrecognized_keys`).
//   2. `.update({...})` abaixo NÃO inclui tenant_id, created_by, seq_id,
//      id — campos imutáveis pelo cliente. Enumeração explícita
//      (sem spread cego).
//   3. `.eq('id', id).eq('tenant_id', profile.tenant_id)` escopa o
//      update ao tenant do usuário autenticado — defesa em profundidade
//      sobre o RLS (USING + WITH CHECK).
//   4. RLS bloqueia em DB caso o eq escape (defesa final).
// =============================================================================
export type UpdateOpportunityResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateOpportunity(
  id: string,
  input: unknown
): Promise<UpdateOpportunityResult> {
  const parsed = opportunityInputSchema.safeParse(input);
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

  // Server-derived tenant scope — defesa em profundidade sobre o RLS.
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
    .from('opportunities')
    .update({
      source: data.source,
      solicitante: data.solicitante,
      email: data.email || null,
      area: data.area,
      subarea: data.subarea || null,
      processo: data.processo,
      frequencia: data.frequencia || null,
      volume_medio: data.volume_medio || null,
      tempo_execucao: data.tempo_execucao || null,
      num_pessoas: data.num_pessoas || null,
      ferramenta: data.ferramenta ?? null,
      escopo_automacao: data.escopo_automacao,
      beneficios_esperados: data.beneficios_esperados,
      esforco: data.esforco,
      complexidade: data.complexidade,
      tempo: data.tempo,
      objetivo: data.objetivo,
      responsavel: data.responsavel || null,
      notas: data.notas || null,
      persona_extras:
        data.source === 'persona' ? data.persona_extras ?? null : null,
      formulario_extras:
        data.source === 'formulario' ? data.formulario_extras ?? null : null,
    })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { ok: false, error: `Erro ao atualizar: ${error.message}` };
  }

  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${id}`);
  return { ok: true };
}
