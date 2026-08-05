'use server';

// =============================================================================
// task-actions.ts — server actions de `opportunity_tasks` (Phase 16, TASK-04)
// -----------------------------------------------------------------------------
// Modela `risk-actions.ts`. Camadas de defesa mass-assignment (T-16-02):
//   1. `taskInputSchema.strict()` rejeita id/tenant_id/opportunity_id/created_by
//      no input (parse falha com `unrecognized_keys`).
//   2. insert enumera colunas explicitamente — sem spread cego de `data`.
//      `tenant_id` vem do profile (server-derived); `opportunity_id` vem do
//      argumento de rota (não do payload).
//   3. `requireEditorRole()` barra role='viewer' antes de qualquer escrita
//      (D-11 — mesmo gate de `opportunity_risks`, NÃO o gate admin-only de
//      `assignee-actions.ts`). A RLS (0037) já bloqueia; falhar aqui devolve
//      mensagem pt-BR em vez do 42501 cru do Postgres.
//   4. `blocked_reason` é SEMPRE escrito explicitamente (Pitfall 4) — valor
//      validado quando `status === 'bloqueio'`, `null` em qualquer outro status.
//
// Nesta task (16-02, tracer) só `createTask` existe — update/delete/mudança de
// status são a expansão do plano 16-05.
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { taskInputSchema } from './task-schema';
import { requireEditorRole } from '@/lib/security/role';

export type TaskActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

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
      status: data.status,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      assignee_id: data.assignee_id || null,
      // sempre escrito explicitamente (Pitfall 4) — null fora de 'bloqueio'.
      blocked_reason: data.status === 'bloqueio' ? data.blocked_reason || null : null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      error: `Erro ao criar tarefa: ${error?.message ?? 'desconhecido'}`,
    };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/opportunities/${opportunityId}/tarefas`);
  return { ok: true, id: inserted.id };
}
