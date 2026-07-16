'use server';

// =============================================================================
// note-actions.ts — server actions de `opportunity_notes` (v0.3/0018)
// -----------------------------------------------------------------------------
// Modela lib/opportunities/risk-actions.ts. Anotações são append+delete —
// SEM update (editar apaga e recria, preserva autor/data honestos — mesma
// decisão da migration 0018).
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireEditorRole } from '@/lib/security/role';
import { noteInputSchema } from './note-schema';

export type NoteActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type MutationResult = { ok: true } | { ok: false; error: string };

export async function createNote(
  opportunityId: string,
  input: unknown
): Promise<NoteActionResult> {
  const roleCheck = await requireEditorRole();
  if (!roleCheck.ok) return { ok: false, error: roleCheck.error };

  const parsed = noteInputSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: 'Dados inválidos.',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
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
    .from('opportunity_notes')
    .insert({
      opportunity_id: opportunityId, // server-derived
      tenant_id: profile.tenant_id, // server-derived
      texto: parsed.data.texto,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return { ok: false, error: `Erro ao adicionar anotação: ${error?.message ?? 'desconhecido'}` };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, id: inserted.id };
}

export async function deleteNote(
  noteId: string,
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
    .from('opportunity_notes')
    .delete()
    .eq('id', noteId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { ok: false, error: `Erro ao excluir anotação: ${error.message}` };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}
