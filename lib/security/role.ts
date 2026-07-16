import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { TenantRole } from '@/lib/opportunities/types';

// =============================================================================
// role.ts — RBAC simples (v0.3): 'viewer' é somente-leitura de verdade
// -----------------------------------------------------------------------------
// O bloqueio REAL é a RLS (migration 0015 — current_user_role() nas policies
// de insert/update/delete). Este helper é defesa em profundidade nas server
// actions (mesmo padrão de `.eq('tenant_id', profile.tenant_id)` em
// actions.ts) + fonte única pra UI decidir o que esconder (readOnly prop).
// =============================================================================

/**
 * Role do usuário autenticado corrente. `null` se não houver sessão/profile
 * (o caller decide o que fazer — normalmente as actions já checam `user`/
 * `profile` antes por outros motivos).
 */
export async function getCurrentUserRole(): Promise<TenantRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role ?? null;
}

/** Açúcar pra Server Components decidirem o que esconder na UI. */
export async function isReadOnlyViewer(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'viewer';
}

/**
 * Guard de escrita para Server Actions — mesma mensagem pt-BR genérica usada
 * pelos outros erros de auth em actions.ts. Chamar ANTES de qualquer
 * insert/update/delete. A RLS (0015) bloqueia de qualquer forma, mas falhar
 * cedo aqui evita um round-trip ao banco só pra descobrir 42501.
 */
export async function requireEditorRole(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const role = await getCurrentUserRole();
  if (role === 'viewer') {
    return { ok: false, error: 'Seu perfil é somente leitura.' };
  }
  return { ok: true };
}

// =============================================================================
// getCurrentProfile / isPlatformAdmin — super-admin de plataforma (v0.3-admin,
// ported de origin/feat/v0.3-produtizacao). O bloqueio REAL de dados
// cross-tenant é a RLS aditiva (migration 0021, is_platform_admin()); estas
// funções são a contraparte server-side para decisões de UI/routing (guard de
// /admin, seletor de empresa na Sidebar).
// =============================================================================

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
 * Profile do usuário autenticado corrente, com role e tenant. Fonte única
 * para decisões de autorização no servidor (Server Components, Server
 * Actions, Route Handlers).
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
 * (migration 0021) — mantenha os dois em sincronia.
 */
export function isPlatformAdmin(profile: Pick<CurrentProfile, 'role'> | null): boolean {
  return profile?.role === 'platform_admin';
}
