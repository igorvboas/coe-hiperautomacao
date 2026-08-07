// =============================================================================
// admin-actions-tenant-scope.test.ts — Server Actions de ADMIN escopadas pelo
// tenant-alvo resolvido no servidor (Phase 18, Plan 06, GRANT-05)
// =============================================================================
// Cobre os specs de <behavior> de `app/(app)/team/actions.ts` (Task 2) e, a
// partir da Task 3 deste plano, de `app/(app)/configuracoes/actions.ts`:
// convite/revogação de equipe e as três escritas de branding, todas escopadas
// pelo tenant-ALVO (seletor de empresa da Sidebar) — nunca por
// `profile.tenantId` para `psw_staff` (D-K, o caso canônico da fase).
//
// REGRA INEGOCIÁVEL herdada de `psw-staff-isolation.test.ts:26-29`: nenhuma
// afirmação de sucesso de escrita conclui por `error === null`. Toda
// persistência é confirmada por RELEITURA via `serviceRoleClient()` — é
// exatamente essa releitura que prova que D-K foi fechado: antes desta fase,
// `error === null` na revogação era um FALSO POSITIVO (zero linhas afetadas,
// nenhum erro, convite ainda lá).
//
// Skip behavior: `describe.skipIf(!HAS_DB)` — `.env.test` NÃO existe neste
// ambiente (modo `prova-por-sql-no-handoff`, decisão vinculante da fase,
// Plan 18-01). Nenhum resultado aqui é lido como "verde" até um ambiente de
// teste dedicado existir.
//
// NUANCE TÉCNICA: as Server Actions chamam `createClient()` (cookies via
// `next/headers`, indisponível fora de uma requisição Next real) e
// `resolveAdminTenantIdFromSelector` chama `resolveEmpresaSlug()` (também
// `next/headers`, para o cookie `coe_empresa`). Os dois são mockados aqui:
// `createClient()` delega para um client REAL autenticado (`authedClient`,
// sign-in direto com anon key — mesma identidade que a RLS enxerga, só muda a
// via de obtenção da sessão) e `cookies()` devolve um jar controlável por
// teste (`selectEmpresa(slug)`), simulando a empresa selecionada no seletor
// da Sidebar sem precisar de um Server Component real.
// =============================================================================
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { serviceRoleClient } from '../setup/supabase-test-client';
import {
  FGCOOP_TEST_ID,
  ACME_TEST_ID,
  FGCOOP_TEST_EMAIL,
  PSW_STAFF_TEST_EMAIL,
  TEST_PASSWORD,
  seedTestTenants,
} from '../setup/seed-test-tenants';

const HAS_DB = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Estado mutável de "quem está logado" e "empresa selecionada no cookie" —
// controlado por cada teste via loginAs()/selectEmpresa() abaixo. Os mocks
// leem essas variáveis no momento da chamada (nunca capturadas antes).
let currentEmail = '';
let currentPassword = '';
let empresaCookie: string | undefined;

function loginAs(email: string, password: string = TEST_PASSWORD) {
  currentEmail = email;
  currentPassword = password;
}

function selectEmpresa(slug: string | undefined) {
  empresaCookie = slug;
}

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'coe_empresa' && empresaCookie ? { value: empresaCookie } : undefined,
    getAll: () => [],
    set: () => undefined,
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    const { authedClient } = await import('../setup/supabase-test-client');
    return (await authedClient(currentEmail, currentPassword)).client;
  },
}));

const FGCOOP_SLUG = 'fgcoop-test';
const ACME_SLUG = 'acme-test';

describe.skipIf(!HAS_DB)('team/actions.ts — convite e revogação escopados pelo tenant-alvo', () => {
  let sb: ReturnType<typeof serviceRoleClient>;
  let pswStaffUserId: string;
  // Import dinâmico (mesmo padrão de tests/opportunities/actions.test.ts) —
  // os `vi.mock(...)` acima já estão em vigor quando este `beforeAll` roda,
  // então o módulo importado enxerga `next/headers`/`next/cache`/
  // `@/lib/supabase/server` mockados.
  let inviteTeamMember: typeof import('@/app/(app)/team/actions').inviteTeamMember;
  let revokeTeamInvite: typeof import('@/app/(app)/team/actions').revokeTeamInvite;

  beforeAll(async () => {
    sb = serviceRoleClient();
    const seed = await seedTestTenants();
    pswStaffUserId = seed.pswStaffUserId;
    await sb.from('psw_tenant_admins').delete().eq('profile_id', pswStaffUserId);

    const actions = await import('@/app/(app)/team/actions');
    inviteTeamMember = actions.inviteTeamMember;
    revokeTeamInvite = actions.revokeTeamInvite;
  });

  afterEach(async () => {
    // Limpa qualquer convite de teste criado por este arquivo, para não
    // colidir com o índice parcial global (email pendente único).
    await sb.from('invited_emails').delete().like('email', 'admin-scope-test-%@test.local');
  });

  afterAll(async () => {
    await sb.from('psw_tenant_admins').delete().eq('profile_id', pswStaffUserId);
  });

  beforeEach(() => {
    empresaCookie = undefined;
  });

  it('tenant_admin de cliente convida e revoga no próprio tenant, sem mudança observável', async () => {
    loginAs(FGCOOP_TEST_EMAIL);
    const email = `admin-scope-test-1@test.local`;
    const form = new FormData();
    form.set('email', email);
    form.set('role', 'member');

    const result = await inviteTeamMember(form);
    expect(result).toEqual({ ok: true });

    const { data: inserted } = await sb
      .from('invited_emails')
      .select('id, tenant_id')
      .eq('email', email)
      .maybeSingle();
    expect(inserted?.tenant_id).toBe(FGCOOP_TEST_ID);

    const revokeForm = new FormData();
    revokeForm.set('id', inserted!.id);
    await revokeTeamInvite(revokeForm);

    const { data: afterRevoke } = await sb
      .from('invited_emails')
      .select('id')
      .eq('id', inserted!.id)
      .maybeSingle();
    expect(afterRevoke).toBeNull();
  });

  it('staff-admin com empresa A selecionada convida em A: o convite é gravado com o tenant de A', async () => {
    loginAs(PSW_STAFF_TEST_EMAIL);
    await sb.from('psw_tenant_admins').insert({
      profile_id: pswStaffUserId,
      tenant_id: FGCOOP_TEST_ID,
      granted_by: pswStaffUserId,
    });
    selectEmpresa(FGCOOP_SLUG);

    const email = `admin-scope-test-2@test.local`;
    const form = new FormData();
    form.set('email', email);
    form.set('role', 'member');

    const result = await inviteTeamMember(form);
    expect(result).toEqual({ ok: true });

    const { data: inserted } = await sb
      .from('invited_emails')
      .select('tenant_id')
      .eq('email', email)
      .maybeSingle();
    expect(inserted?.tenant_id).toBe(FGCOOP_TEST_ID);

    await sb.from('psw_tenant_admins').delete().eq('profile_id', pswStaffUserId);
  });

  it('staff-admin com empresa A selecionada revoga um convite pendente de A: o convite some (releitura, nunca error===null)', async () => {
    const email = `admin-scope-test-3@test.local`;
    const { data: seeded } = await sb
      .from('invited_emails')
      .insert({ email, tenant_id: FGCOOP_TEST_ID, role: 'member', invited_by: pswStaffUserId })
      .select('id')
      .single();

    await sb.from('psw_tenant_admins').insert({
      profile_id: pswStaffUserId,
      tenant_id: FGCOOP_TEST_ID,
      granted_by: pswStaffUserId,
    });
    loginAs(PSW_STAFF_TEST_EMAIL);
    selectEmpresa(FGCOOP_SLUG);

    const revokeForm = new FormData();
    revokeForm.set('id', seeded!.id);
    await revokeTeamInvite(revokeForm);

    // A prova é a RELEITURA — nunca a ausência de erro (revokeTeamInvite
    // devolve void, não há canal de erro pra checar).
    const { data: afterRevoke } = await sb
      .from('invited_emails')
      .select('id')
      .eq('id', seeded!.id)
      .maybeSingle();
    expect(afterRevoke).toBeNull();

    await sb.from('psw_tenant_admins').delete().eq('profile_id', pswStaffUserId);
  });

  it('staff-admin SEM empresa selecionada recebe ADMIN_SCOPE_DENIED_MESSAGE — nenhuma escrita é tentada', async () => {
    loginAs(PSW_STAFF_TEST_EMAIL);
    selectEmpresa(undefined);

    const email = `admin-scope-test-4@test.local`;
    const form = new FormData();
    form.set('email', email);
    form.set('role', 'member');

    const result = await inviteTeamMember(form);
    expect(result).toEqual({
      error: 'Empresa não encontrada ou fora do seu escopo de administração.',
    });

    const { data: notInserted } = await sb
      .from('invited_emails')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    expect(notInserted).toBeNull();
  });

  it('staff-admin com empresa selecionada onde NÃO tem concessão recebe a mesma mensagem — nenhuma escrita é tentada', async () => {
    loginAs(PSW_STAFF_TEST_EMAIL);
    selectEmpresa(ACME_SLUG); // sem concessão em Acme

    const email = `admin-scope-test-5@test.local`;
    const form = new FormData();
    form.set('email', email);
    form.set('role', 'member');

    const result = await inviteTeamMember(form);
    expect(result).toEqual({
      error: 'Empresa não encontrada ou fora do seu escopo de administração.',
    });

    const { data: notInserted } = await sb
      .from('invited_emails')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    expect(notInserted).toBeNull();
  });
});
