import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { TenantRole } from '@/lib/database.types';

/**
 * Profile do usuário autenticado corrente, com role e tenant.
 * Fonte única para decisões de autorização no servidor (Server Components,
 * Server Actions, Route Handlers).
 */
export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: TenantRole;
  tenantId: string;
  tenantName: string | null;
  tenantSlug: string | null;
};

/**
 * Carrega o profile do usuário autenticado via RLS (só lê a própria linha).
 * Retorna null se não houver sessão ou profile (inconsistência).
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, tenant_id, tenants(name, slug)')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  // Supabase aninha o FK como objeto (single) ou array — normaliza.
  const tenantsField = data.tenants as
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  const tenant = Array.isArray(tenantsField) ? tenantsField[0] : tenantsField;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    tenantId: data.tenant_id,
    tenantName: tenant?.name ?? null,
    tenantSlug: tenant?.slug ?? null,
  };
}

/**
 * Super-admin de plataforma (PSW): enxerga TODOS os tenants. Espelha o
 * predicado SQL `is_platform_admin()` usado nas policies de RLS cross-tenant
 * (migration 0016) — mantenha os dois em sincronia.
 */
export function isPlatformAdmin(
  profile: Pick<CurrentProfile, 'role'> | null
): boolean {
  return profile?.role === 'platform_admin';
}
