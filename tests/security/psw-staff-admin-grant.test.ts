// =============================================================================
// psw_tenant_admins — concessão de admin cross-tenant a `psw_staff` (Phase 18)
// =============================================================================
// Esta suíte prova GRANT-01, GRANT-02, GRANT-03, GRANT-06, GRANT-08 e GRANT-10:
// um `psw_staff` pode receber, de N em N tenants, o poder de `tenant_admin`
// SEM perder as atribuições que já tinha em outras empresas (Phase 17) — e,
// enquanto não tiver concessão em nenhum tenant, o comportamento dele
// permanece byte-idêntico ao da `0044` (só o atribuído, nada a mais).
//
// ESTADO NESTA WAVE: RED — a tabela `psw_tenant_admins` AINDA NÃO EXISTE (a
// migration `0045` só é escrita e aplicada no Plan 18-02). O `beforeAll` do
// describe "com concessão no tenant A" abaixo FALHA de propósito (insert numa
// tabela que não existe), e isso derruba todo teste declarado dentro daquele
// describe (b2, o describe aninhado de tenant_admin, e c1..c7). Isto é o
// esperado, não bug de fixture. O Plan 18-02 (TRACER) aplica a `0045` e a
// primeira metade da RLS de `opportunities`, tornando verdes os grupos `a` e
// `c`; o Plan 18-03 propaga às 7 tabelas filhas e torna `c4` verde.
//
// REGRA INEGOCIÁVEL (herdada de `psw-staff-isolation.test.ts:26-29`): nenhum
// spec pode concluir sucesso de uma escrita apenas por `error === null` — é
// obrigatório reler a linha via `serviceRoleClient()` e comparar o valor
// observado. Ver c5.
//
// Skip behavior: pulado inteiro sem `NEXT_PUBLIC_SUPABASE_URL` (modo
// unit-only) — nesse caso a suíte sai 0 sem executar nenhuma asserção, e isso
// NÃO pode ser lido como "verde". Ver Task 1 / SUMMARY deste plano.
//
// Arquivo NOVO — não editar `tests/security/psw-staff-isolation.test.ts`. Ele
// é a prova viva de GRANT-02 e afirma no nível de topo que `asPswStaff()`
// enxerga exatamente [X, Z]; uma linha de concessão que sobreviva a um
// `afterAll` quebraria aquele arquivo. Por isso esta suíte usa prefixo de
// UUID próprio (`bbbb0000-…`) e um `afterAll` incondicional que apaga
// primeiro qualquer linha de `psw_tenant_admins` do profile do staff — é a
// linha mais importante deste arquivo, porque `singleFork` +
// `sequence.concurrent: false` fazem um vazamento contaminar toda suíte
// posterior.
// =============================================================================
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { serviceRoleClient } from '../setup/supabase-test-client';
import { asFgcoop, asPswStaff } from '../helpers/auth-as';
import {
  FGCOOP_TEST_ID,
  ACME_TEST_ID,
  PSW_STAFF_TEST_EMAIL,
  TEST_PASSWORD,
  seedTestTenants,
} from '../setup/seed-test-tenants';

const HAS_DB = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Prefixo de UUID PRÓPRIO desta suíte — não reusar `1111…`/`2222…`/`3333…`
// (tenants de teste), `aaaa0000…` (oportunidades da suíte 17) nem
// `eeee0000…` (tenant de controle da suíte 17).
const OPP_A_NAO_ATRIBUIDA = 'bbbb0000-0000-0000-0000-000000000001'; // FGCoop, SEM atribuição — era invisível no baseline
const OPP_B_ATRIBUIDA = 'bbbb0000-0000-0000-0000-000000000002'; // Acme, ATRIBUÍDA ao staff (Phase 17, preservada)
const OPP_C_CONTROLE = 'bbbb0000-0000-0000-0000-000000000003'; // tenant terceiro — sem concessão, sem atribuição

// Tenant terceiro (nem FGCoop nem Acme), usado só como negativo decisivo (c3):
// nenhuma concessão nem atribuição existe nele em ponto algum desta suíte.
const CONTROL_TENANT_ID = 'cccc0000-0000-0000-0000-000000000001';

// Mesmo e-mail/padrão de `psw-staff-isolation.test.ts` — reusa o
// `platform_admin` de teste já existente em vez de criar um segundo. Não é o
// segundo usuário `psw_staff` proibido pelo plano: é um papel diferente,
// necessário só para preencher `granted_by`.
const PLATFORM_ADMIN_TEST_EMAIL = 'platform-admin@test.local';

describe.skipIf(!HAS_DB)('psw_tenant_admins — concessão de admin cross-tenant (0045+)', () => {
  let sb: ReturnType<typeof serviceRoleClient>;
  let pswStaffUserId: string;
  let fgcoopUserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    sb = serviceRoleClient();
    const seed = await seedTestTenants();
    pswStaffUserId = seed.pswStaffUserId;
    fgcoopUserId = seed.fgcoopUserId;

    // Limpeza defensiva (idempotência caso um `afterAll` anterior não tenha
    // rodado). Ordem: filhas antes do pai.
    await sb
      .from('opportunity_assignees')
      .delete()
      .in('opportunity_id', [OPP_A_NAO_ATRIBUIDA, OPP_B_ATRIBUIDA, OPP_C_CONTROLE]);
    await sb.from('opportunities').delete().in('id', [OPP_A_NAO_ATRIBUIDA, OPP_B_ATRIBUIDA, OPP_C_CONTROLE]);

    // Tenant terceiro (controle) — upsert, idempotente entre runs.
    const { error: controlTenantErr } = await sb.from('tenants').upsert(
      {
        id: CONTROL_TENANT_ID,
        slug: 'controle-grant-test',
        name: 'Controle Grant Test',
        status: 'active',
      },
      { onConflict: 'id' },
    );
    if (controlTenantErr) throw new Error(`upsert tenant de controle falhou: ${controlTenantErr.message}`);

    const baseFields = {
      source: 'persona' as const,
      solicitante: 'psw-staff-admin-grant fixture',
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
      {
        id: OPP_A_NAO_ATRIBUIDA,
        tenant_id: FGCOOP_TEST_ID,
        processo: 'A — FGCoop, SEM atribuição ao staff (o positivo decisivo de c1)',
        ...baseFields,
      },
      {
        id: OPP_B_ATRIBUIDA,
        tenant_id: ACME_TEST_ID,
        processo: 'B — Acme, ATRIBUÍDA ao staff (a atribuição da Phase 17 que não pode se perder)',
        ...baseFields,
      },
      {
        id: OPP_C_CONTROLE,
        tenant_id: CONTROL_TENANT_ID,
        processo: 'C — tenant de controle, sem concessão nem atribuição (o negativo decisivo de c3)',
        ...baseFields,
      },
    ]);
    if (insertErr) throw new Error(`setup falhou (opportunities da fixture): ${insertErr.message}`);

    // Atribuição real do staff em B (Acme) — o cenário de GRANT-03 é a MESMA
    // pessoa com concessão em A (FGCoop) e atribuição em B (Acme); por isso
    // nenhuma atribuição é criada em A nem em C.
    const { error: assignBErr } = await sb.from('opportunity_assignees').insert({
      opportunity_id: OPP_B_ATRIBUIDA,
      profile_id: pswStaffUserId,
      tenant_id: ACME_TEST_ID,
    });
    if (assignBErr) throw new Error(`setup falhou (atribuição de B): ${assignBErr.message}`);

    // `platform_admin` de teste — cria (idempotente) e promove, mesma forma
    // de `psw-staff-isolation.test.ts`. Só existe para preencher
    // `granted_by`; nenhuma asserção desta suíte depende do e-mail dele.
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

  // LINHA MAIS IMPORTANTE DO ARQUIVO — incondicional, sem `if` sobre estado
  // de teste anterior. Sob `singleFork`, uma linha de concessão vazada
  // contamina toda suíte posterior, inclusive `psw-staff-isolation.test.ts`
  // (que este plano não pode tocar).
  afterAll(async () => {
    if (!sb) return;
    await sb.from('psw_tenant_admins').delete().eq('profile_id', pswStaffUserId);

    await sb
      .from('opportunity_assignees')
      .delete()
      .in('opportunity_id', [OPP_A_NAO_ATRIBUIDA, OPP_B_ATRIBUIDA, OPP_C_CONTROLE]);
    // Apagar as 3 oportunidades dispara `on delete cascade` para as tabelas
    // filhas — nenhuma fica órfã (FKs verificadas nas migrations de origem).
    await sb.from('opportunities').delete().in('id', [OPP_A_NAO_ATRIBUIDA, OPP_B_ATRIBUIDA, OPP_C_CONTROLE]);
    // NÃO apagar o tenant de controle nem auth.users — idempotência da
    // próxima run, mesmo padrão de FGCOOP_TEST_ID/ACME_TEST_ID/PSW_TEST_ID.
  });

  // ---------------------------------------------------------------------
  // Grupo (a) — baseline SEM concessão (GRANT-02/GRANT-08, SC-4)
  // ---------------------------------------------------------------------
  let baselineIds: string[] = [];

  it('a1) sem concessão, o conjunto visível é medido em runtime e guardado como baseline', async () => {
    const { client } = await asPswStaff();
    const { data, error } = await client.from('opportunities').select('id');
    expect(error).toBeNull();
    baselineIds = (data ?? []).map((r) => r.id).sort();

    // Negativo decisivo herdado da 0044: a oportunidade NÃO atribuída do
    // tenant A não pode estar no conjunto visível sem concessão.
    expect(baselineIds).not.toContain(OPP_A_NAO_ATRIBUIDA);
    // A atribuída em B continua lá (Phase 17, intocada por esta fase).
    expect(baselineIds).toContain(OPP_B_ATRIBUIDA);
  });

  // ---------------------------------------------------------------------
  // Grupo (b) — não-regressão de `member`/`tenant_admin` (GRANT-10/SC-12)
  // ---------------------------------------------------------------------
  let memberBaseline = -1;

  it('b1) baseline de member do FGCoop, ANTES de existir concessão', async () => {
    const { client } = await asFgcoop(); // role 'member'
    const { count } = await client.from('opportunities').select('id', { count: 'exact', head: true });
    memberBaseline = count ?? -1;
    expect(memberBaseline).toBeGreaterThan(0); // testemunha viva
  });

  describe('com concessão no tenant A (FGCoop)', () => {
    beforeAll(async () => {
      const { error } = await sb.from('psw_tenant_admins').insert({
        profile_id: pswStaffUserId,
        tenant_id: FGCOOP_TEST_ID,
        granted_by: adminUserId,
      });
      if (error) throw new Error(`setup falhou (concessão): ${error.message}`);
    });

    afterAll(async () => {
      await sb.from('psw_tenant_admins').delete().eq('profile_id', pswStaffUserId);
    });

    it('b2) com a concessão ATIVA, a contagem do member do FGCoop não se move', async () => {
      const { client } = await asFgcoop();
      const { count } = await client.from('opportunities').select('id', { count: 'exact', head: true });
      expect(count).toBe(memberBaseline);
    });

    describe('tenant_admin do FGCoop — não-regressão (0029/0041 preservadas)', () => {
      // Promove o usuário FGCoop compartilhado a `tenant_admin` só durante
      // este describe — mesmo padrão de `psw-staff-isolation.test.ts:1031`.
      const createdInviteIds: string[] = [];

      beforeAll(async () => {
        const { error } = await sb.from('profiles').update({ role: 'tenant_admin' }).eq('id', fgcoopUserId);
        if (error) throw new Error(`não foi possível promover FGCoop a tenant_admin: ${error.message}`);
      });

      afterAll(async () => {
        if (sb && fgcoopUserId) {
          await sb.from('profiles').update({ role: 'member' }).eq('id', fgcoopUserId);
        }
        if (sb && createdInviteIds.length > 0) {
          await sb.from('invited_emails').delete().in('id', createdInviteIds);
        }
      });

      it('b3) tenant_admin do FGCoop CONTINUA sem conseguir convidar psw_staff (detector da regressão da 0029)', async () => {
        const { client } = await asFgcoop();
        const { error } = await client.from('invited_emails').insert({
          email: 'tentativa-psw-staff-grant-18@test.local',
          tenant_id: FGCOOP_TEST_ID,
          role: 'psw_staff',
        });
        expect(error).not.toBeNull();
      });

      it('b4) tenant_admin do FGCoop CONTINUA convidando papéis legítimos do próprio tenant', async () => {
        const { client } = await asFgcoop();
        const { data, error } = await client
          .from('invited_emails')
          .insert({ email: 'convite-legitimo-grant-18@test.local', tenant_id: FGCOOP_TEST_ID, role: 'member' })
          .select('id')
          .single();
        expect(error).toBeNull();
        expect(data?.id).toBeTruthy();
        if (data?.id) createdInviteIds.push(data.id);
      });

      it('b5) tenant_admin do FGCoop CONTINUA sem ver invited_emails do Acme', async () => {
        const { client } = await asFgcoop();
        const { data, error } = await client.from('invited_emails').select('id').eq('tenant_id', ACME_TEST_ID);
        expect(error).toBeNull();
        expect(data).toEqual([]);
      });
    });

    // ---------------------------------------------------------------------
    // Grupo (c) — com concessão ativa no FGCoop (GRANT-03/GRANT-06, SC-5)
    // ---------------------------------------------------------------------

    it('c1) POSITIVO DECISIVO — staff-admin passa a ver a oportunidade de A que NÃO lhe foi atribuída', async () => {
      const { client } = await asPswStaff();
      const { data, error } = await client.from('opportunities').select('id').eq('id', OPP_A_NAO_ATRIBUIDA);
      expect(error).toBeNull();
      expect(data).toHaveLength(1); // era [] no baseline (a1) — a diferença É a fase
    });

    it('c2) não perde de vista a oportunidade atribuída em OUTRA empresa (Acme)', async () => {
      const { client } = await asPswStaff();
      const { data, error } = await client.from('opportunities').select('id, tenant_id').eq('id', OPP_B_ATRIBUIDA);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('c3) NEGATIVO DECISIVO — nada do tenant de controle, onde não há concessão nem atribuição', async () => {
      const { client } = await asPswStaff();
      const { data, error } = await client.from('opportunities').select('id').eq('tenant_id', CONTROL_TENANT_ID);
      expect(error).toBeNull();
      expect(data).toEqual([]); // o "tenant A não vê tenant B" do CLAUDE.md
    });

    // Propagação da concessão às 7 tabelas filhas — a migration que reemite
    // as policies das filhas com o 3º disjunto de admin (0046) só existe no
    // Plan 18-03. Declarado aqui, e não omitido, para que o gate do plano
    // seguinte seja "tirar este it.todo do papel", não "lembrar de escrever
    // o teste".
    it.todo(
      'c4) as 7 tabelas filhas (opportunity_phases/risks/notes/documents/history/tasks/assignees) propagam a concessão — acrescentado no Plan 18-03 junto da migration 0046',
    );

    it('c5) escreve em A com releitura por service-role — não é sucesso silencioso', async () => {
      const { client } = await asPswStaff();
      const novoValor = `observacao staff-admin ${Date.now()}`;
      const { error } = await client.from('opportunities').update({ observacao: novoValor }).eq('id', OPP_A_NAO_ATRIBUIDA);
      expect(error).toBeNull();

      const { data, error: readErr } = await sb
        .from('opportunities')
        .select('observacao')
        .eq('id', OPP_A_NAO_ATRIBUIDA)
        .single();
      expect(readErr).toBeNull();
      expect(data?.observacao).toBe(novoValor); // ← a releitura obrigatória, nunca `error === null` sozinho
    });

    it('c6) D-B — o staff-admin NÃO consegue conceder a ninguém, nem a si (erro explícito no INSERT)', async () => {
      const { client } = await asPswStaff();
      const { error } = await client
        .from('psw_tenant_admins')
        .insert({ profile_id: pswStaffUserId, tenant_id: ACME_TEST_ID });
      expect(error).not.toBeNull(); // RLS, não UI
    });

    it('c7) D-B — o staff-admin NÃO consegue revogar (delete casa zero linhas em silêncio)', async () => {
      const { client } = await asPswStaff();
      const { data } = await client.from('psw_tenant_admins').delete().eq('tenant_id', FGCOOP_TEST_ID).select('id');
      expect(data ?? []).toEqual([]);

      const { count } = await sb
        .from('psw_tenant_admins')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', pswStaffUserId);
      expect(count).toBe(1); // a linha continua lá — o delete não afetou nada
    });
  });

  it('a2) após revogar (afterAll do describe de concessão), o conjunto visível volta EXATAMENTE ao baseline', async () => {
    const { client } = await asPswStaff();
    const { data, error } = await client.from('opportunities').select('id');
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.id).sort()).toEqual(baselineIds);
  });
});

// =============================================================================
// Nomes de grupo RESERVADOS para os planos seguintes — não inventar nome
// divergente; estender este arquivo com o item abaixo, no exato texto:
//   - c4 (Plan 18-03): trocar o `it.todo` por specs reais, um por tabela
//     filha, no mesmo padrão de `psw-staff-isolation.test.ts` → `it.each`.
// =============================================================================
