'use server';

// =============================================================================
// configuracoes/actions.ts — cor principal + logo da empresa (v0.4)
// -----------------------------------------------------------------------------
// Mesmo padrão de defesa de team/actions.ts:
//   1. Guard de role aqui (falha cedo, mensagem pt-BR).
//   2. `tenant_id` SEMPRE derivado do profile logado — nunca campo de form.
//   3. RLS (0033) é o bloqueio real: `tenants_update_own_admin` +
//      trigger `tenants_branding_only_guard` (gate de coluna) + policies do
//      bucket 'tenant-branding' escopadas pela pasta = tenant_id.
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isPlatformAdmin, isTenantAdmin } from '@/lib/security/role';
import { normalizeHexColor } from '@/lib/branding/theme';
import { BRANDING_BUCKET } from '@/lib/branding/queries';

export type BrandingResult = { error: string } | { ok: true };

const MAX_LOGO_BYTES = 512 * 1024; // 512 KB — é uma logo, não um banner
const LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/** Admin da empresa OU super-admin da PSW (que também tem um tenant próprio). */
async function requireBrandingAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || (!isTenantAdmin(profile) && !isPlatformAdmin(profile))) return null;
  return profile;
}

export async function updateBrandColor(formData: FormData): Promise<BrandingResult> {
  const profile = await requireBrandingAdmin();
  if (!profile) return { error: 'Acesso negado.' };

  const raw = String(formData.get('brand_color') ?? '').trim();
  // Campo vazio = voltar ao padrão PSW (null no banco).
  const color = raw === '' ? null : normalizeHexColor(raw);
  if (raw !== '' && !color) {
    return { error: 'Cor inválida — use o formato #RRGGBB.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tenants')
    .update({ brand_color: color })
    .eq('id', profile.tenantId); // server-derived

  if (error) return { error: `Erro ao salvar a cor: ${error.message}` };

  revalidatePath('/', 'layout'); // o <style> do tema vive no layout do app
  return { ok: true };
}

export async function updateTenantLogo(formData: FormData): Promise<BrandingResult> {
  const profile = await requireBrandingAdmin();
  if (!profile) return { error: 'Acesso negado.' };

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecione um arquivo de imagem.' };
  }
  const ext = LOGO_TYPES[file.type];
  if (!ext) return { error: 'Formato não suportado — use PNG, JPG, WEBP ou SVG.' };
  if (file.size > MAX_LOGO_BYTES) return { error: 'Arquivo muito grande (máx. 512 KB).' };

  const supabase = await createClient();

  // Path escopado por tenant_id — a policy do bucket (0033) exige que o 1º
  // segmento seja o tenant. Timestamp no nome porque o bucket é público e com
  // cache de CDN: sobrescrever o mesmo path serviria a logo antiga.
  const path = `${profile.tenantId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BRANDING_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: `Erro ao enviar a logo: ${uploadError.message}` };

  // Guarda o path anterior pra apagar depois de a troca dar certo.
  const { data: before } = await supabase
    .from('tenants')
    .select('logo_path')
    .eq('id', profile.tenantId)
    .maybeSingle();

  const { error } = await supabase
    .from('tenants')
    .update({ logo_path: path })
    .eq('id', profile.tenantId);

  if (error) {
    await supabase.storage.from(BRANDING_BUCKET).remove([path]); // não deixa órfão
    return { error: `Erro ao salvar a logo: ${error.message}` };
  }

  if (before?.logo_path && before.logo_path !== path) {
    await supabase.storage.from(BRANDING_BUCKET).remove([before.logo_path]);
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function removeTenantLogo(): Promise<BrandingResult> {
  const profile = await requireBrandingAdmin();
  if (!profile) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from('tenants')
    .select('logo_path')
    .eq('id', profile.tenantId)
    .maybeSingle();

  const { error } = await supabase
    .from('tenants')
    .update({ logo_path: null })
    .eq('id', profile.tenantId);
  if (error) return { error: `Erro ao remover a logo: ${error.message}` };

  if (before?.logo_path) {
    await supabase.storage.from(BRANDING_BUCKET).remove([before.logo_path]);
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}
