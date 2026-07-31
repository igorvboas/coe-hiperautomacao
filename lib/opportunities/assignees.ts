import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { TenantRole } from './types';
import type { Assignee, AssignableProfile } from './assignee-types';
import type { Cargo } from '@/lib/security/cargo';

export type { Assignee, AssignableProfile };

// =============================================================================
// assignees.ts — quem está atribuído a uma oportunidade (0032)
// -----------------------------------------------------------------------------
// Substitui, na UI, o texto livre `opportunities.responsavel`: agora é vínculo
// real com `profiles` (N:N). A tabela tem `tenant_id` + RLS (0032), então estas
// queries não precisam passar tenant — mas, seguindo o CLAUDE.md, quem tem o
// tenant em mãos filtra explicitamente mesmo assim.
//
// Leitura: qualquer pessoa do tenant. Escrita: só admin — ver assignee-actions.ts.
// =============================================================================

type JoinedProfile = {
  email: string;
  full_name: string | null;
  /** Ausente quando a 0031 ainda não foi aplicada — ver fallback abaixo. */
  cargo?: string | null;
  role: TenantRole;
};

type JoinedRow = {
  opportunity_id: string;
  profile_id: string;
  profiles: JoinedProfile | JoinedProfile[] | null;
};

/** Supabase aninha o FK como objeto (single) ou array — normaliza. */
function flatten(row: JoinedRow): Assignee | null {
  const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  if (!p) return null;
  return {
    profileId: row.profile_id,
    email: p.email,
    fullName: p.full_name,
    cargo: p.cargo ?? null,
    role: p.role,
  };
}

/** Ordem estável de exibição: nome (ou e-mail, se sem nome). */
function byName(a: Assignee, b: Assignee): number {
  return (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email, 'pt-BR');
}

// `cargo` só existe a partir da 0031. Se a 0032 (esta tabela) estiver aplicada
// mas a 0031 não, o join abaixo falha inteiro com 42703 e a UI mostraria
// "Ninguém atribuído" logo depois de um salvamento bem-sucedido — o pior tipo
// de bug, porque parece perda de dado. Estas duas constantes permitem repetir a
// query sem a coluna nesse caso.
// O embed precisa nomear a CONSTRAINT: a tabela tem dois FKs para `profiles`
// (`profile_id` e `created_by`), e sem isso o PostgREST recusa com
// "more than one relationship was found".
const PROFILE_FK = 'profiles!opportunity_assignees_profile_id_fkey';
const JOIN_WITH_CARGO = `opportunity_id, profile_id, ${PROFILE_FK}(email, full_name, cargo, role)`;
const JOIN_WITHOUT_CARGO = `opportunity_id, profile_id, ${PROFILE_FK}(email, full_name, role)`;

function warnMissingCargo() {
  console.warn(
    '[assignees] coluna `cargo` ausente — aplique a migration 0031 para ver o cargo das pessoas.'
  );
}

/** Assignees de UMA oportunidade. */
export async function fetchAssigneesForOpportunity(
  opportunityId: string
): Promise<Assignee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('opportunity_assignees')
    .select(JOIN_WITH_CARGO)
    .eq('opportunity_id', opportunityId);

  let rows = (data ?? []) as JoinedRow[];

  if (error) {
    if (error.code !== '42703') {
      console.error('[assignees] falha ao ler atribuições:', error.message);
      return [];
    }
    warnMissingCargo();
    const { data: fallback, error: fallbackError } = await supabase
      .from('opportunity_assignees')
      .select(JOIN_WITHOUT_CARGO)
      .eq('opportunity_id', opportunityId);
    if (fallbackError) {
      console.error('[assignees] falha ao ler atribuições:', fallbackError.message);
      return [];
    }
    rows = (fallback ?? []) as JoinedRow[];
  }

  return rows
    .map(flatten)
    .filter((a): a is Assignee => a !== null)
    .sort(byName);
}

/**
 * Assignees de VÁRIAS oportunidades, agrupados por id — uma query só, para a
 * listagem não cair em N+1.
 */
export async function fetchAssigneesForOpportunities(
  opportunityIds: string[]
): Promise<Record<string, Assignee[]>> {
  if (opportunityIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('opportunity_assignees')
    .select(JOIN_WITH_CARGO)
    .in('opportunity_id', opportunityIds);

  let rows = (data ?? []) as JoinedRow[];

  if (error) {
    if (error.code !== '42703') {
      console.error('[assignees] falha ao ler atribuições:', error.message);
      return {};
    }
    warnMissingCargo();
    const { data: fallback, error: fallbackError } = await supabase
      .from('opportunity_assignees')
      .select(JOIN_WITHOUT_CARGO)
      .in('opportunity_id', opportunityIds);
    if (fallbackError) {
      console.error('[assignees] falha ao ler atribuições:', fallbackError.message);
      return {};
    }
    rows = (fallback ?? []) as JoinedRow[];
  }

  const grouped: Record<string, Assignee[]> = {};
  for (const row of rows) {
    const assignee = flatten(row);
    if (!assignee) continue;
    (grouped[row.opportunity_id] ??= []).push(assignee);
  }
  for (const list of Object.values(grouped)) list.sort(byName);
  return grouped;
}

/**
 * Pessoas que PODEM ser atribuídas. `tenantId` é obrigatório: mesmo o
 * platform_admin atribui dentro de um tenant por vez (a trigger de 0032 recusa
 * vínculo cruzado). Viewers entram na lista — acompanhar não é editar.
 */
export async function fetchAssignableProfiles(
  tenantId: string
): Promise<AssignableProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, cargo, role')
    .eq('tenant_id', tenantId)
    .order('email');

  if (!error) {
    return (data ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      cargo: p.cargo,
      role: p.role,
    }));
  }

  // `cargo` só existe a partir da migration 0031. Enquanto ela não for aplicada
  // no ambiente, a query acima falha inteira (42703) e o filtro "Membro"
  // sumiria da toolbar sem explicação — degradamos para a versão sem cargo em
  // vez de devolver lista vazia. Qualquer outro erro é logado e propagado como
  // lista vazia (a page não deve quebrar por causa do filtro).
  if (error.code !== '42703') {
    console.error('[assignees] falha ao listar profiles do tenant:', error.message);
    return [];
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('tenant_id', tenantId)
    .order('email');

  if (fallbackError) {
    console.error('[assignees] falha ao listar profiles do tenant:', fallbackError.message);
    return [];
  }

  console.warn(
    '[assignees] coluna `cargo` ausente — aplique a migration 0031 para ver o cargo das pessoas.'
  );
  return (fallback ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    cargo: null,
    role: p.role,
  }));
}

/**
 * Todas as pessoas visíveis para o usuário corrente, sem recorte de tenant —
 * usado só pelo platform_admin em "Todas as empresas", para que o filtro
 * "Membro" não desapareça. Para os demais roles a RLS (profiles_select_same_
 * tenant, 0001) já limita ao próprio tenant, então o resultado é o mesmo de
 * fetchAssignableProfiles.
 */
export async function fetchAllAssignableProfiles(): Promise<AssignableProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, cargo, role')
    .order('email');

  if (error) {
    // Mesma degradação da versão por tenant: sem a 0031 não existe `cargo`.
    const { data: fallback } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('email');
    return (fallback ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      cargo: null,
      role: p.role,
    }));
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    cargo: p.cargo,
    role: p.role,
  }));
}

/**
 * Ids das oportunidades que têm PELO MENOS UMA pessoa daquele cargo atribuída
 * — alimenta o filtro "Cargo" da listagem. `!inner` no join faz o Postgrest
 * descartar as linhas cujo profile não bate, em vez de trazer com null.
 */
export async function fetchOpportunityIdsForCargo(cargo: Cargo): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('opportunity_assignees')
    .select(`opportunity_id, ${PROFILE_FK}!inner(cargo)`)
    .eq('profiles.cargo', cargo);

  if (error) {
    console.error('[assignees] falha ao filtrar por cargo:', error.message);
    return [];
  }

  // Uma oportunidade pode ter dois Devs — deduplica.
  return Array.from(new Set((data ?? []).map((r) => r.opportunity_id)));
}

/**
 * Ids das oportunidades atribuídas a um profile — alimenta o filtro "Membro"
 * da listagem. Retorna `[]` quando não há nenhuma (o caller trata isso como
 * "nenhum resultado", não como "sem filtro").
 */
export async function fetchOpportunityIdsForAssignee(
  profileId: string
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('opportunity_assignees')
    .select('opportunity_id')
    .eq('profile_id', profileId);

  return (data ?? []).map((r) => r.opportunity_id);
}
