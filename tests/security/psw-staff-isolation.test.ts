// =============================================================================
// psw_staff — RLS multi-tenant por atribuição (migrations 0039/0040+)
// =============================================================================
// Esta suíte prova a única exceção autorizada à regra nº 1 do CLAUDE.md
// ("toda tabela de domínio filtra por tenant_id do próprio usuário"): o
// `psw_staff` é multi-tenant **por atribuição** — ele lê oportunidades de
// tenants diferentes, desde que atribuído a cada uma via
// `opportunity_assignees`. Não é um `platform_admin` (que lê tudo, sempre).
//
// O spec que mais importa aqui é o NEGATIVO: um `psw_staff` atribuído à
// oportunidade X do tenant A não pode ver a oportunidade Y do MESMO tenant A.
// Se a policy aditiva futura for escrita como "tenant onde ele tem alguma
// atribuição" (em vez de "esta oportunidade específica"), todo spec positivo
// passaria e o vazamento só apareceria em produção — por isso a fixture cria
// as três oportunidades (X atribuída, Y não atribuída no mesmo tenant de X, Z
// atribuída em outro tenant) antes de qualquer policy nova existir.
//
// Estado nesta wave (Plan 17-02): a migration 0040 (que reescreve
// `check_assignee_tenant()` e adiciona a policy SELECT aditiva) AINDA não foi
// aplicada. Os INSERTs de `opportunity_assignees` para X e Z são cross-tenant
// do ponto de vista do profile do staff (tenant PSW ≠ tenant da oportunidade)
// e por isso falham no trigger atual — é o estado RED esperado, documentado
// no SUMMARY deste plano, não um bug da fixture. O Plan 17-03 (TRACER) aplica
// a 0040 e torna estes specs verdes.
//
// REGRA INEGOCIÁVEL (Pitfall 1, vale para todo spec de ESCRITA que os planos
// seguintes acrescentarem a este arquivo): nenhum spec pode concluir sucesso
// de uma escrita apenas por `error === null` — é obrigatório reler a linha
// via `serviceRoleClient()` e comparar o valor observado.
//
// Nenhum cliente Supabase é substituído por implementação de teste — todo
// spec de RLS autentica com JWT real de usuário de teste contra um banco
// Postgres real (padrão do projeto desde a Phase 7.5).
//
// Skip behavior: pulado inteiro sem NEXT_PUBLIC_SUPABASE_URL (modo unit-only).
// Pré-requisito: migrations 0001..0039 aplicadas + seed dos tenants de teste.
// =============================================================================
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { serviceRoleClient, authedClient } from '../setup/supabase-test-client';
import { asFgcoop, asPswStaff } from '../helpers/auth-as';
import {
  FGCOOP_TEST_ID,
  ACME_TEST_ID,
  PSW_TEST_ID,
  PSW_STAFF_TEST_EMAIL,
  TEST_PASSWORD,
  seedTestTenants,
} from '../setup/seed-test-tenants';

const HAS_DB = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// IDs determinísticos, prefixo próprio desta suíte (`aaaa0000-...`) para não
// colidir com os ids de outras suítes sob `singleFork`.
const PSW_OPP_X_ID = 'aaaa0000-0000-0000-0000-000000000001'; // tenant A (FGCoop), ATRIBUÍDA ao staff
const PSW_OPP_Y_ID = 'aaaa0000-0000-0000-0000-000000000002'; // tenant A (FGCoop), SEM atribuição — testemunha do negativo
const PSW_OPP_Z_ID = 'aaaa0000-0000-0000-0000-000000000003'; // tenant B (Acme), ATRIBUÍDA ao staff

// Usuário `platform_admin` de teste, local a esta suíte — mesma forma de
// "cria (idempotente) e promove" de `platform-admin-cross-tenant.test.ts`.
// Usado apenas no grupo `psw_staff != platform_admin`, para provar que o
// acesso do staff PSW não vem de `is_platform_admin()`.
const PLATFORM_ADMIN_TEST_EMAIL = 'platform-admin@test.local';

describe.skipIf(!HAS_DB)('psw_staff — RLS multi-tenant por atribuição (0040+)', () => {
  let sb: ReturnType<typeof serviceRoleClient>;
  let pswStaffUserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    sb = serviceRoleClient();
    const seed = await seedTestTenants();
    pswStaffUserId = seed.pswStaffUserId;

    // Limpeza defensiva (idempotência caso um `afterAll` anterior não tenha
    // rodado — ex.: processo interrompido). Ordem: filhas antes do pai.
    await sb
      .from('opportunity_assignees')
      .delete()
      .in('opportunity_id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);
    await sb.from('opportunities').delete().in('id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);

    const baseFields = {
      source: 'persona' as const,
      solicitante: 'Staff PSW isolation fixture',
      area: 'TI',
      esforco: 'medio' as const,
      complexidade: 'medio' as const,
      tempo: 'mensal' as const,
      objetivo: 3,
      visivel: true,
    };

    // Nunca informar seq_id (trigger), score/priority_level (view) nem
    // rpa_score (GENERATED) — CLAUDE.md §3.
    const { error: insertErr } = await sb.from('opportunities').insert([
      { id: PSW_OPP_X_ID, tenant_id: FGCOOP_TEST_ID, processo: 'X — atribuída ao staff PSW', ...baseFields },
      { id: PSW_OPP_Y_ID, tenant_id: FGCOOP_TEST_ID, processo: 'Y — mesmo tenant de X, sem atribuição', ...baseFields },
      { id: PSW_OPP_Z_ID, tenant_id: ACME_TEST_ID, processo: 'Z — outro tenant, atribuída ao staff PSW', ...baseFields },
    ]);
    if (insertErr) throw new Error(`setup falhou (opportunities da fixture): ${insertErr.message}`);

    // Atribuições X e Z — tenant_id da LINHA é sempre o tenant_id DA
    // OPORTUNIDADE (D-10), nunca o do profile atribuído. Enquanto a 0040 não
    // for aplicada, o trigger `check_assignee_tenant()` (0032) ainda exige
    // que o tenant do profile atribuído coincida com o da oportunidade — e o
    // profile do staff PSW pertence ao tenant PSW, não a FGCoop/Acme. Estes
    // dois INSERTs, portanto, FALHAM aqui (RED esperado desta wave). Não
    // lançamos a partir do erro: é o comportamento correto e documentado até
    // o Plan 17-03 aplicar a 0040.
    const { error: assignXErr } = await sb.from('opportunity_assignees').insert({
      opportunity_id: PSW_OPP_X_ID,
      profile_id: pswStaffUserId,
      tenant_id: FGCOOP_TEST_ID,
    });
    if (assignXErr) {
      // eslint-disable-next-line no-console
      console.info(
        `[psw-staff-isolation] atribuição X falhou como esperado antes da 0040: ${assignXErr.message}`,
      );
    }

    const { error: assignZErr } = await sb.from('opportunity_assignees').insert({
      opportunity_id: PSW_OPP_Z_ID,
      profile_id: pswStaffUserId,
      tenant_id: ACME_TEST_ID,
    });
    if (assignZErr) {
      // eslint-disable-next-line no-console
      console.info(
        `[psw-staff-isolation] atribuição Z falhou como esperado antes da 0040: ${assignZErr.message}`,
      );
    }

    // Cria (idempotente) e promove o usuário de teste a platform_admin —
    // mesma forma de `platform-admin-cross-tenant.test.ts`; tenant "de casa"
    // é irrelevante pra ele (lê tudo via RLS aditiva), mas `handle_new_user`
    // exige um valor não-nulo.
    const { data: list } = await sb.auth.admin.listUsers();
    const existingAdmin = list?.users.find((u) => u.email === PLATFORM_ADMIN_TEST_EMAIL);
    if (existingAdmin) {
      adminUserId = existingAdmin.id;
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email: PLATFORM_ADMIN_TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        app_metadata: { tenant_id: FGCOOP_TEST_ID },
        user_metadata: { full_name: 'Platform Admin Test', tenant_id: FGCOOP_TEST_ID },
      });
      if (error || !data.user) throw new Error(`createUser falhou (platform admin): ${error?.message}`);
      adminUserId = data.user.id;
    }
    const { error: promoteAdminErr } = await sb
      .from('profiles')
      .update({ role: 'platform_admin' })
      .eq('id', adminUserId);
    if (promoteAdminErr) throw new Error(`promote platform_admin falhou: ${promoteAdminErr.message}`);
  });

  afterAll(async () => {
    if (!sb) return;
    await sb
      .from('opportunity_assignees')
      .delete()
      .in('opportunity_id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);
    await sb.from('opportunities').delete().in('id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);
    // NÃO deletar auth.users — idempotência da próxima run.
  });

  describe('loga sem erro', () => {
    it('staff PSW autentica e o profile tem o papel novo, no tenant da PSW', async () => {
      const { client, userId, tenantId } = await asPswStaff();
      expect(userId).toBeTruthy();
      expect(tenantId).toBe(PSW_TEST_ID);

      const { data: profile, error } = await client
        .from('profiles')
        .select('id, role, tenant_id')
        .eq('id', userId)
        .single();
      expect(error).toBeNull();
      expect(profile?.role).toBe('psw_staff');
      expect(profile?.tenant_id).toBe(PSW_TEST_ID);
    });
  });

  describe('cadastro único', () => {
    it('existe exatamente um profiles com o e-mail do staff PSW, atendendo dois tenants', async () => {
      const { data: profiles, error } = await sb
        .from('profiles')
        .select('id, tenant_id')
        .eq('email', PSW_STAFF_TEST_EMAIL);
      expect(error).toBeNull();
      expect(profiles?.length).toBe(1);
      expect(profiles?.[0].tenant_id).toBe(PSW_TEST_ID);

      const { data: assignments, error: assignErr } = await sb
        .from('opportunity_assignees')
        .select('tenant_id')
        .eq('profile_id', pswStaffUserId);
      expect(assignErr).toBeNull();
      const distinctTenants = new Set((assignments ?? []).map((a) => a.tenant_id));
      // RED nesta wave: as atribuições X/Z falham até a 0040 (comentário do
      // beforeAll). Vira verde no Plan 17-03.
      expect(distinctTenants.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('não vê oportunidade não atribuída do mesmo tenant', () => {
    it('psw_staff não vê Y — mesmo tenant de X, mas sem atribuição própria (ACCESS-04, decisivo)', async () => {
      const { client } = await asPswStaff();
      const { data, error } = await client.from('opportunities').select('id').eq('id', PSW_OPP_Y_ID);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe('vê a oportunidade atribuída de outro tenant', () => {
    it('psw_staff vê X e Z, cujos tenant_id são diferentes entre si (ACCESS-04, positivo)', async () => {
      const { client } = await asPswStaff();
      const { data, error } = await client
        .from('opportunities')
        .select('id, tenant_id')
        .in('id', [PSW_OPP_X_ID, PSW_OPP_Z_ID]);
      expect(error).toBeNull();
      const ids = (data ?? []).map((r) => r.id).sort();
      expect(ids).toEqual([PSW_OPP_X_ID, PSW_OPP_Z_ID].sort());
      const tenantIds = new Set((data ?? []).map((r) => r.tenant_id));
      expect(tenantIds.size).toBe(2);
    });
  });

  describe('psw_staff != platform_admin', () => {
    it('psw_staff só enxerga as oportunidades atribuídas (X e Z) — nunca via is_platform_admin()', async () => {
      const { client } = await asPswStaff();
      const { data, error } = await client
        .from('opportunities')
        .select('id')
        .in('id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);
      expect(error).toBeNull();
      const ids = (data ?? []).map((r) => r.id).sort();
      expect(ids).toEqual([PSW_OPP_X_ID, PSW_OPP_Z_ID].sort());
    });

    it('platform_admin continua enxergando tudo, inclusive Y (regressão da 0021)', async () => {
      const { client } = await authedClient(PLATFORM_ADMIN_TEST_EMAIL, TEST_PASSWORD);
      const { data, error } = await client
        .from('opportunities')
        .select('id')
        .in('id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);
      expect(error).toBeNull();
      const ids = (data ?? []).map((r) => r.id).sort();
      expect(ids).toEqual([PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID].sort());
    });
  });

  describe('regressão — isolamento existente permanece intacto', () => {
    it('membro comum do tenant A (FGCoop) continua sem ver a oportunidade Z do tenant B (Acme)', async () => {
      const { client } = await asFgcoop();
      const { data, error } = await client.from('opportunities').select('id').eq('id', PSW_OPP_Z_ID);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });
});

// =============================================================================
// Nomes de grupo RESERVADOS para os planos seguintes (17-03 a 17-07) — não
// inventar nome divergente; estender este arquivo com um novo `describe` por
// item, no exato texto abaixo:
//   - `check_assignee_tenant` (Plan 17-03 — os 4 casos do trigger reescrito)
//   - `tabelas filhas`        (Plan 17-04 — SELECT aditivo por tabela filha)
//   - `escrita escopada`      (Plan 17-05 — escrita permitida/rejeitada,
//                              sempre relendo a linha via service-role)
//   - `invited_emails`        (Plan 17-04/17-08 — convite do staff PSW)
//   - `assignee de tarefa`    (Plan 17-08 — psw_staff como responsável de
//                              tarefa, ACCESS-11)
//   - `lista unificada`       (Plan 17-07 — coluna/filtro de empresa)
// =============================================================================
