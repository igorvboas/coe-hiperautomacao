'use server';

import { revalidatePath } from 'next/cache';
import { headers as nextHeaders } from 'next/headers';
import { after } from 'next/server';
import { createClient, serviceRoleClient } from '@/lib/supabase/server';
import type { OpportunityStatus } from './types';
import { opportunityInputSchema } from './schema';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { getClientIp } from '@/lib/security/client-ip';
import { hashIp } from '@/lib/security/hash-ip';
import { isBotRequest } from '@/lib/security/botid-guard';
import {
  logPublicFormAttempt,
  updatePublicFormAttempt,
} from '@/lib/public-form/log';
import { enrichOpportunity } from '@/lib/ai/enrichment';

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
  request_type?:
    | 'nova_oportunidade'
    | 'melhoria_automacao'
    | 'duvidas_terceiros'
    | 'incidente'
    | 'treinamento';
  observacao?: string;
  risco?: string;
};

export type CreatePublicResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Submit do formulário público anônimo. Defesa em camadas (Phase 7.5 Bloco D):
 *
 *   1. Hash IP (defesa privacy) — throws sem IP_HASH_SALT → pt-BR genérico
 *   2. Log pending em public_form_submissions (best-effort, não bloqueia)
 *   3. BotID edge classifier (no-op em local dev; ativo em Vercel)
 *   4. Turnstile siteverify (token single-use)
 *   5. RPC create_public_opportunity (length/array/jsonb limits enforced no DB)
 *   6. Atualiza log com status final (success | invalid | captcha_failed)
 *
 * NUNCA retorna `error.message` raw — mensagens pt-BR genéricas (T-07.5-D-06).
 * `error.message` real só vai para `public_form_submissions.error_message` (auditoria).
 */
export async function createPublicOpportunity(
  tenantSlug: string,
  input: PublicSubmitInput,
  turnstileToken: string,
): Promise<CreatePublicResult> {
  // 1. IP + user-agent
  const ip = await getClientIp();
  const ua = (await nextHeaders()).get('user-agent') ?? null;

  // 2. Hash IP — defensivo se salt ausente
  let ipHash: string;
  try {
    ipHash = hashIp(ip);
  } catch {
    return {
      ok: false,
      error: 'Erro de configuração do servidor. Tente novamente mais tarde.',
    };
  }

  // 3. Log pending — best-effort, não bloqueia se falhar
  const logId = await logPublicFormAttempt({
    slug: tenantSlug,
    ipHash,
    userAgent: ua,
  });

  // 4. BotID — defesa edge-side (no-op em local dev; ativo em Vercel)
  const isBot = await isBotRequest();
  if (isBot) {
    await updatePublicFormAttempt(logId, 'captcha_failed', 'botid:flagged');
    return { ok: false, error: 'Acesso negado.' };
  }

  // 5. Turnstile — defesa client-challenge
  if (!turnstileToken || turnstileToken.length === 0) {
    await updatePublicFormAttempt(logId, 'captcha_failed', 'no-token');
    return {
      ok: false,
      error: 'Verificação anti-bot ausente. Recarregue a página e tente novamente.',
    };
  }
  const captcha = await verifyTurnstileToken(turnstileToken, ip);
  if (!captcha.ok) {
    await updatePublicFormAttempt(
      logId,
      'captcha_failed',
      captcha.errorCodes.join(','),
    );
    return {
      ok: false,
      error: 'Verificação anti-bot falhou. Recarregue a página e tente novamente.',
    };
  }

  // ── Phase 7.6: resolve tenant_id para enriquecimento via SERVICE ROLE ────
  // POR QUÊ service role e não o anon client deste handler:
  //   RLS policy `tenants_select_own` em 0001_init.sql usa
  //   `id = current_tenant_id()` que requer auth.uid(). Session anônima do
  //   form público faz `current_tenant_id()` retornar NULL → query retorna
  //   ZERO rows → after() NUNCA dispararia silenciosamente. serviceRoleClient
  //   bypassa RLS de forma segura: executado server-only; `tenantSlug` já
  //   passou pelos guardas anteriores (BotID + Turnstile) e a query é
  //   defensiva por `eq('status', 'active')`.
  // Resolução SEPARADA da RPC para capturar tenant_id em closure do after()
  // — a RPC continua a resolver internamente como autoridade.
  let tenantRow: { id: string } | null = null;
  try {
    const adminSb = serviceRoleClient();
    const result = await adminSb
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('status', 'active')
      .maybeSingle();
    tenantRow = result.data;
  } catch (e) {
    // serviceRoleClient throw (env var missing) — log e continua.
    // RPC abaixo dá o error path autoritativo; after() não dispara.
    console.error(
      '[actions/createPublicOpportunity] tenant lookup falhou (serviceRoleClient):',
      e instanceof Error ? e.message : String(e),
    );
  }

  // 6. RPC — length/array/jsonb limits enforced no DB (migration 0007)
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
    p_request_type: input.request_type ?? 'nova_oportunidade',
    p_observacao: input.observacao ?? null,
    p_risco: input.risco ?? null,
  });

  // 7. Erro: log mensagem REAL no DB, mensagem GENÉRICA ao cliente (Falha Segura)
  if (error || !data) {
    await updatePublicFormAttempt(
      logId,
      'invalid',
      error?.message ?? 'unknown',
    );
    return {
      ok: false,
      error: 'Não foi possível registrar sua solicitação. Tente novamente em alguns minutos.',
    };
  }

  // 8. Sucesso
  await updatePublicFormAttempt(logId, 'success');

  // ── Phase 7.6: dispara enrichment se RPC sucedeu E tenant resolveu ───────
  // Mesma defesa em camadas de createOpportunity: try/catch no callback,
  // closure de primitivos, sem cookies/headers dentro. Fallback null-safe
  // — row já está criada (RPC sucedeu); admin pode editar manualmente.
  const oppId = data as unknown as string;
  const tenantId = tenantRow?.id;
  if (tenantId) {
    after(async () => {
      try {
        await enrichOpportunity(oppId, tenantId);
      } catch (e) {
        console.error(
          '[actions/createPublicOpportunity] enrichment after() inesperado:',
          e instanceof Error ? e.message : String(e),
        );
      }
    });
  } else {
    // Log estruturado — NÃO retorna erro ao client; row já foi criada.
    console.error(
      '[actions/createPublicOpportunity] tenant_id ausente após RPC success (slug=%s) — enrichment NÃO disparado',
      tenantSlug,
    );
  }

  return { ok: true, id: oppId };
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
      request_type: data.request_type,
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
      observacao: data.observacao || null,
      risco: data.risco || null,
      persona_extras:
        data.source === 'persona' ? data.persona_extras ?? null : null,
      formulario_extras:
        data.source === 'formulario' ? data.formulario_extras ?? null : null,
      created_by: user.id,
    })
    .select('id, tenant_id')
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      error: `Erro ao criar: ${error?.message ?? 'desconhecido'}`,
    };
  }

  // ── Phase 7.6: enriquecimento por IA assíncrono (fire-and-forget) ────────
  // - Não bloqueia a response (after() roda após HTTP response enviado).
  // - Closure captura primitivos (oppId, tenantId) — NÃO usa cookies/headers
  //   dentro do callback (T-07.6-C-02).
  // - try/catch defensivo garante que erros não propaguem (T-07.6-C-01).
  // - Se cold-restart matar a função antes do callback, row fica em
  //   ai_enrichment_status='pending' (default da migration 0010) — job de
  //   catch-up futuro (backlog 999.x) pode re-enriquecer.
  const oppId = inserted.id;
  const tenantId = inserted.tenant_id as string;
  after(async () => {
    try {
      await enrichOpportunity(oppId, tenantId);
    } catch (e) {
      console.error(
        '[actions/createOpportunity] enrichment after() inesperado:',
        e instanceof Error ? e.message : String(e),
      );
    }
  });

  revalidatePath('/opportunities');
  return { ok: true, id: oppId };
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
      request_type: data.request_type,
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
      observacao: data.observacao || null,
      risco: data.risco || null,
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
