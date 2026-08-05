'use server';

// =============================================================================
// task-actions.ts — server actions de `opportunity_tasks` (Phase 16, TASK-04/
// TASK-05/TASK-06)
// -----------------------------------------------------------------------------
// Modela `risk-actions.ts`. Camadas de defesa mass-assignment (T-16-02):
//   1. `taskInputSchema.strict()` rejeita id/tenant_id/opportunity_id/created_by
//      no input (parse falha com `unrecognized_keys`).
//   2. insert/update enumeram colunas explicitamente — sem spread cego de
//      `data`. `tenant_id` vem do profile (server-derived); `opportunity_id`
//      vem do argumento de rota (não do payload).
//   3. `requireEditorRole()` barra role='viewer' antes de qualquer escrita
//      (D-11 — mesmo gate de `opportunity_risks`, NÃO o gate admin-only de
//      `assignee-actions.ts`). A RLS (0037) já bloqueia; falhar aqui devolve
//      mensagem pt-BR em vez do 42501 cru do Postgres.
//   4. `blocked_reason` é SEMPRE escrito explicitamente (Pitfall 4) — valor
//      validado quando `status === 'bloqueio'`, `null` em qualquer outro
//      status. `normalizeTaskStatusUpdate` (abaixo) é a fonte ÚNICA dessa
//      regra — `createTask`, `updateTask` e `updateTaskStatus` consomem a
//      mesma função em vez de reimplementar a lógica de limpeza cada uma à
//      sua maneira (16-05).
//   5. `updateTask`/`deleteTask` NUNCA atualizam `parent_task_id` — a UI não
//      re-parenta (D-01); o trigger de profundidade (0037) recusaria de
//      qualquer forma.
//   6. Mensagens de erro devolvidas ao cliente são SEMPRE pt-BR genéricas —
//      nunca interpolam `error.message` do driver do banco (T-16-13,
//      Information Disclosure). Deviation em relação ao analog
//      `risk-actions.ts` (que interpola `error.message`), aplicada aqui e
//      retroativamente a `createTask` para fechar o mesmo threat nas quatro
//      mutações deste módulo.
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { taskInputSchema } from './task-schema';
import { requireEditorRole } from '@/lib/security/role';
import type { TaskStatus } from './types';

export type TaskActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type MutationResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// =============================================================================
// normalizeTaskStatusUpdate — fonte ÚNICA da regra de limpeza do motivo de
// bloqueio (D-03, Pitfall 4). Pura, sem I/O: recebe o status alvo e o motivo
// (possivelmente ausente/em branco) e devolve o par normalizado a gravar, ou
// a recusa quando o motivo é obrigatório e está faltando.
//
// - status === 'bloqueio' e motivo preenchido (não só espaços) → devolve o
//   motivo TRIMADO.
// - status === 'bloqueio' e motivo ausente/só espaços → recusa (ok: false)
//   ANTES de qualquer mutação chegar ao banco.
// - qualquer outro status → motivo SEMPRE nulo no payload, mesmo que um
//   texto tenha sido passado (a coluna nunca é omitida do objeto de update).
// =============================================================================
export function normalizeTaskStatusUpdate(
  status: TaskStatus,
  blockedReason: string | null | undefined
):
  | { ok: true; status: TaskStatus; blocked_reason: string | null }
  | { ok: false; error: string } {
  if (status !== 'bloqueio') {
    return { ok: true, status, blocked_reason: null };
  }

  const trimmed = (blockedReason ?? '').trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Motivo do bloqueio obrigatório quando o status é Bloqueio.',
    };
  }

  return { ok: true, status, blocked_reason: trimmed };
}

// =============================================================================
// createTask — insere nova tarefa (raiz ou subtarefa) após validação Zod
// =============================================================================
export async function createTask(
  opportunityId: string,
  input: unknown
): Promise<TaskActionResult> {
  const roleCheck = await requireEditorRole();
  if (!roleCheck.ok) return { ok: false, error: roleCheck.error };

  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: 'Dados inválidos.',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const normalized = normalizeTaskStatusUpdate(data.status, data.blocked_reason);
  if (!normalized.ok) {
    return {
      ok: false,
      error: normalized.error,
      fieldErrors: { blocked_reason: [normalized.error] },
    };
  }

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
    .from('opportunity_tasks')
    .insert({
      opportunity_id: opportunityId, // server-derived (do arg da rota, não do payload)
      tenant_id: profile.tenant_id, // server-derived
      parent_task_id: data.parent_task_id || null,
      title: data.title,
      description: data.description || null,
      status: normalized.status,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      assignee_id: data.assignee_id || null,
      blocked_reason: normalized.blocked_reason, // sempre explícito (Pitfall 4)
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return { ok: false, error: 'Erro ao criar tarefa.' };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/opportunities/${opportunityId}/tarefas`);
  return { ok: true, id: inserted.id };
}

// =============================================================================
// updateTask — atualiza os campos de uma tarefa/subtarefa existente
// -----------------------------------------------------------------------------
// NUNCA envia `parent_task_id` — a UI não re-parenta (D-01); o trigger de
// profundidade (0037) recusaria de qualquer forma. Escopo por identificador
// E por `tenant_id` do profile lido no servidor, defesa em profundidade sobre
// a RLS (USING + WITH CHECK).
// =============================================================================
export async function updateTask(
  taskId: string,
  opportunityId: string,
  input: unknown
): Promise<MutationResult> {
  const roleCheck = await requireEditorRole();
  if (!roleCheck.ok) return { ok: false, error: roleCheck.error };

  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: 'Dados inválidos.',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const normalized = normalizeTaskStatusUpdate(data.status, data.blocked_reason);
  if (!normalized.ok) {
    return {
      ok: false,
      error: normalized.error,
      fieldErrors: { blocked_reason: [normalized.error] },
    };
  }

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
    .from('opportunity_tasks')
    .update({
      title: data.title,
      description: data.description || null,
      status: normalized.status,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      assignee_id: data.assignee_id || null,
      blocked_reason: normalized.blocked_reason, // sempre explícito (Pitfall 4)
      // parent_task_id NÃO enviado — D-01, a UI nunca re-parenta.
    })
    .eq('id', taskId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { ok: false, error: 'Erro ao atualizar tarefa.' };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/opportunities/${opportunityId}/tarefas`);
  return { ok: true };
}

// =============================================================================
// deleteTask — remove uma tarefa/subtarefa
// -----------------------------------------------------------------------------
// Sem lógica de cascata: `parent_task_id` tem `on delete cascade` na 0037 —
// apagar a pai apaga as filhas no banco. A confirmação explícita exigida por
// TASK-06 é responsabilidade da UI (DeleteTaskButton).
// =============================================================================
export async function deleteTask(
  taskId: string,
  opportunityId: string
): Promise<MutationResult> {
  const roleCheck = await requireEditorRole();
  if (!roleCheck.ok) return { ok: false, error: roleCheck.error };

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
    .from('opportunity_tasks')
    .delete()
    .eq('id', taskId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { ok: false, error: 'Erro ao excluir tarefa.' };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/opportunities/${opportunityId}/tarefas`);
  return { ok: true };
}

// =============================================================================
// updateTaskStatus — mutação de campo único que o Kanban (16-06) chama no
// drop de um card. `opportunityId` não é parâmetro (contrato exato que o
// Kanban consome) — é lido de volta do próprio UPDATE via `.select()` para
// revalidar as rotas certas sem uma query extra.
// =============================================================================
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  blockedReason: string | null
): Promise<MutationResult> {
  const roleCheck = await requireEditorRole();
  if (!roleCheck.ok) return { ok: false, error: roleCheck.error };

  const normalized = normalizeTaskStatusUpdate(status, blockedReason);
  if (!normalized.ok) {
    return { ok: false, error: normalized.error };
  }

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

  const { data: updated, error } = await supabase
    .from('opportunity_tasks')
    .update({
      status: normalized.status,
      blocked_reason: normalized.blocked_reason, // sempre explícito (Pitfall 4)
    })
    .eq('id', taskId)
    .eq('tenant_id', profile.tenant_id)
    .select('opportunity_id')
    .single();

  if (error || !updated) {
    return { ok: false, error: 'Erro ao atualizar status da tarefa.' };
  }

  revalidatePath(`/opportunities/${updated.opportunity_id}`);
  revalidatePath(`/opportunities/${updated.opportunity_id}/tarefas`);
  return { ok: true };
}
