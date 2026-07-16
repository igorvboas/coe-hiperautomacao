'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isPlatformAdmin } from '@/lib/security/role';

export type InviteResult = { error: string } | { ok: true };

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Cria um convite (allowlist). Opcionalmente cria uma nova empresa (tenant)
 * antes. Toda escrita passa pelo RLS — só platform_admin chega aqui (guard
 * server-side + WITH CHECK is_platform_admin()).
 */
export async function createInvite(formData: FormData): Promise<InviteResult> {
  const profile = await getCurrentProfile();
  if (!isPlatformAdmin(profile)) return { error: 'Acesso negado.' };

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const roleRaw = String(formData.get('role') ?? 'member');
  const role = roleRaw === 'tenant_admin' ? 'tenant_admin' : 'member';
  const tenantMode = String(formData.get('tenant_mode') ?? 'existing');
  const existingTenantId = String(formData.get('tenant_id') ?? '').trim();
  const newCompanyName = String(formData.get('new_company') ?? '').trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: 'E-mail inválido.' };
  }

  const supabase = await createClient();
  let tenantId = existingTenantId;

  // Criar nova empresa, se for o caso ---------------------------------------
  if (tenantMode === 'new') {
    if (!newCompanyName) return { error: 'Informe o nome da empresa.' };
    const base = slugify(newCompanyName) || 'empresa';

    // tenta inserir; em colisão de slug, sufixa e tenta de novo (poucas vezes)
    let inserted: { id: string } | null = null;
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const { data, error } = await supabase
        .from('tenants')
        .insert({ name: newCompanyName, slug })
        .select('id')
        .single();
      if (!error && data) {
        inserted = data;
        break;
      }
      if (error && error.code !== '23505') {
        return { error: `Erro ao criar empresa: ${error.message}` };
      }
    }
    if (!inserted) return { error: 'Não foi possível gerar um slug único para a empresa.' };
    tenantId = inserted.id;
  } else if (!tenantId) {
    return { error: 'Selecione uma empresa.' };
  }

  // Criar o convite ----------------------------------------------------------
  const { error } = await supabase.from('invited_emails').insert({
    email,
    tenant_id: tenantId,
    role,
    invited_by: profile!.id,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe um convite pendente para esse e-mail.' };
    }
    return { error: `Erro ao criar convite: ${error.message}` };
  }

  revalidatePath('/admin/invites');
  return { ok: true };
}

/**
 * Revoga (apaga) um convite pendente. Só platform_admin (guard + RLS).
 * Retorna void: usado direto como `action` de <form> num Server Component.
 */
export async function revokeInvite(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!isPlatformAdmin(profile)) return;

  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from('invited_emails').delete().eq('id', id);

  revalidatePath('/admin/invites');
}
