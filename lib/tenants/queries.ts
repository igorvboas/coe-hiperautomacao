import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type PublicTenant = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Resolve tenant por slug. Usa RPC SECURITY DEFINER — qualquer usuário
 * (autenticado ou não) pode chamar. Retorna null se slug não existir.
 */
export async function fetchPublicTenantBySlug(
  slug: string
): Promise<PublicTenant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('fetch_public_tenant', {
    p_slug: slug,
  });
  if (error) throw new Error(`Erro ao buscar tenant: ${error.message}`);
  const row = (data as PublicTenant[] | null)?.[0];
  return row ?? null;
}

/**
 * Resolve um slug de empresa → tenant_id, para o filtro do seletor de empresa
 * (platform_admin). Usa o client autenticado: o RLS de `tenants` garante que só
 * o platform_admin vê slugs de outros tenants (membro comum → null se alheio).
 * Mantém o UUID FORA da URL — a URL carrega só o slug legível.
 */
export async function fetchTenantIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Retorna o tenant + slug do usuário autenticado corrente.
 * Usado em páginas autenticadas que precisam do slug pra montar URLs públicas.
 */
export async function getCurrentTenant(): Promise<PublicTenant | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('tenant_id, tenants(id, name, slug)')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  const tenants = data.tenants as
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
  const t = Array.isArray(tenants) ? tenants[0] : tenants;
  return t ?? null;
}
