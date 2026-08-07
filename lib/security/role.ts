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

/**
 * Staff PSW multi-tenant por atribuição (Phase 17): espelha o predicado SQL
 * `current_user_role() = 'psw_staff'` usado nas policies aditivas das
 * migrations 0040+ — mantenha os dois em sincronia. **Não** é `platform_admin`
 * (D-06): são papéis distintos, um não é nível do outro. `platform_admin` vê
 * TODOS os tenants; `psw_staff` só enxerga as oportunidades que lhe foram
 * atribuídas via `opportunity_assignees` (0032), mesmo que sejam de tenants
 * diferentes ao mesmo tempo.
 */
export function isPswStaff(profile: Pick<CurrentProfile, 'role'> | null): boolean {
  return profile?.role === 'psw_staff';
}

// =============================================================================
// resolveWriteTenantId — ponto único do escopo de escrita (Phase 17, D-11)
// -----------------------------------------------------------------------------
// POR QUE ESTA FUNÇÃO EXISTE: o padrão histórico de defesa em profundidade nas
// Server Actions de escrita era `.eq('tenant_id', profile.tenant_id)` — que
// pressupõe que o tenant DO PROFILE é o tenant DA LINHA sendo escrita. Isso é
// verdade para todo papel de cliente (`member`/`viewer`/`tenant_admin`/
// `platform_admin`) e **falso por design** para `psw_staff` (Phase 17): o
// tenant do profile dele é o tenant da PSW, nunca o da oportunidade que lhe
// foi atribuída.
//
// O SINTOMA que isso produz, se não corrigido: um `psw_staff` edita uma
// oportunidade legitimamente atribuída a ele; a RLS aditiva (0040/0041)
// libera a escrita; mas o `.eq('tenant_id', profile.tenant_id)` do call site
// casa ZERO LINHAS (o tenant do profile ≠ tenant da linha); o Supabase
// devolve `error: null`; a Server Action responde `{ ok: true }`; o usuário vê
// "salvo com sucesso" e NADA mudou no banco. É um sucesso silencioso
// mentiroso — o bug mais perigoso desta fase, porque não aparece como erro.
//
// A defesa em profundidade CONTINUA EXISTINDO — esta função não é uma forma
// de "remover o `.eq()` e confiar só na RLS". O que muda é a FONTE do valor:
// para papéis de cliente, é `profile.tenantId` (sem ida ao banco, idêntico ao
// que o `.eq()` cru já fazia); para `psw_staff`, é o `tenant_id` lido da
// OPORTUNIDADE-ALVO, através do client autenticado — a RLS já limita essa
// leitura ao que lhe foi atribuído (`current_assigned_opportunity_ids()`),
// então "oportunidade inexistente" e "oportunidade fora do escopo" colapsam
// no mesmo `null`, que é exatamente a semântica desejada (nunca revelar qual
// dos dois casos ocorreu).
// =============================================================================

/**
 * Mensagem pt-BR única para quando `resolveWriteTenantId` devolve `null` —
 * todos os call sites devem usar este texto (em vez de reescrevê-lo cada um a
 * sua maneira) para não divergir em redação nem revelar se a oportunidade não
 * existe ou simplesmente não está no escopo do usuário.
 */
export const WRITE_SCOPE_DENIED_MESSAGE =
  'Oportunidade não encontrada ou fora do seu escopo de acesso.';

/**
 * Resolve o `tenant_id` que uma Server Action de escrita deve usar como
 * filtro defensivo (`.eq('tenant_id', …)` ou como valor de `tenant_id` num
 * insert de tabela filha) — chamar DEPOIS do guard de papel
 * (`requireEditorRole()`) e ANTES de qualquer mutação.
 *
 * - Para `member`/`viewer`/`tenant_admin`/`platform_admin`: retorna
 *   `profile.tenantId` sem nenhuma consulta ao banco — comportamento
 *   idêntico ao `.eq('tenant_id', profile.tenant_id)` de hoje, zero
 *   regressão (SC-6).
 * - Para `psw_staff`: lê `opportunities.tenant_id` pelo id informado, via o
 *   client autenticado (RLS já filtra ao que foi atribuído). Devolve `null`
 *   quando a oportunidade não existe ou não está no escopo — o chamador DEVE
 *   tratar `null` como erro e retornar `{ ok: false, error:
 *   WRITE_SCOPE_DENIED_MESSAGE }` ANTES de tentar a mutação. É este early
 *   return que elimina o sucesso silencioso.
 */
export async function resolveWriteTenantId(
  profile: CurrentProfile,
  opportunityId: string
): Promise<string | null> {
  if (!isPswStaff(profile)) {
    return profile.tenantId;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('opportunities')
    .select('tenant_id')
    .eq('id', opportunityId)
    .maybeSingle();

  return data?.tenant_id ?? null;
}

/**
 * Admin da própria empresa (v0.4): gerencia a allowlist de convites do SEU
 * tenant — e só dele. Espelha o predicado das policies de 0029
 * (`current_user_role() = 'tenant_admin'` + escopo de tenant). NÃO é
 * platform_admin: o super-admin da PSW tem sua própria tela em /admin/invites,
 * com alcance global.
 */
export function isTenantAdmin(profile: Pick<CurrentProfile, 'role'> | null): boolean {
  return profile?.role === 'tenant_admin';
}
