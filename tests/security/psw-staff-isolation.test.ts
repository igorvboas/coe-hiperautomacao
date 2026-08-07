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

// Tenant de CONTROLE — sem NENHUMA oportunidade atribuída ao staff PSW.
// FGCoop e Acme já têm atribuição (X/Z); só um tenant novo prova o negativo
// do describe `profiles visíveis`. Prefixo `eeee0000` — reservado, não colide
// com FGCOOP_TEST_ID/ACME_TEST_ID/PSW_TEST_ID (`1111.../2222.../3333...`) nem
// com os ids de oportunidade desta suíte (prefixo `aaaa0000`).
const CONTROL_TENANT_ID = 'eeee0000-0000-0000-0000-000000000001';
const CONTROL_TENANT_EMAIL = 'controle-sem-atribuicao@test.local';

// Tabelas filhas cobertas pela `0041` (SELECT aditivo) — usado tanto pela
// fixture quanto pelo describe `tabelas filhas` abaixo, para não deixar o
// nome de nenhuma tabela hardcoded em dois lugares divergentes.
const CHILD_TABLES = [
  'opportunity_phases',
  'opportunity_risks',
  'opportunity_tasks',
  'opportunity_notes',
  'opportunity_documents',
  'opportunity_history',
  'opportunity_assignees',
] as const;

type TestClient = Awaited<ReturnType<typeof authedClient>>['client'];

/** SELECT genérico por `opportunity_id` — só a coluna `id`, presente nas 7. */
async function selectByOpportunity(
  client: TestClient,
  table: (typeof CHILD_TABLES)[number],
  opportunityId: string,
) {
  return client.from(table).select('id').eq('opportunity_id', opportunityId);
}

describe.skipIf(!HAS_DB)('psw_staff — RLS multi-tenant por atribuição (0040+)', () => {
  let sb: ReturnType<typeof serviceRoleClient>;
  let pswStaffUserId: string;
  let fgcoopUserId: string;
  let acmeUserId: string;
  let adminUserId: string;
  let controlUserId: string;

  beforeAll(async () => {
    sb = serviceRoleClient();
    const seed = await seedTestTenants();
    pswStaffUserId = seed.pswStaffUserId;
    fgcoopUserId = seed.fgcoopUserId;
    acmeUserId = seed.acmeUserId;

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

    // opportunity_assignees também precisa de uma linha SOB Y para provar o
    // negativo desta tabela filha (describe `tabelas filhas` — Plan 17-05):
    // sem uma linha ali, "Y não aparece" seria trivialmente verdade (não
    // existiria linha nenhuma para filtrar). O profile do FGCoop, no MESMO
    // tenant de Y, é um vínculo legítimo (não cross-tenant, não exercita
    // check_assignee_tenant de forma especial) — só precisa existir.
    const { error: assignYErr } = await sb.from('opportunity_assignees').insert({
      opportunity_id: PSW_OPP_Y_ID,
      profile_id: fgcoopUserId,
      tenant_id: FGCOOP_TEST_ID,
    });
    if (assignYErr) throw new Error(`setup falhou (assignee de Y): ${assignYErr.message}`);

    // ---------------------------------------------------------------------
    // Fixture das tabelas filhas (Plan 17-05, Task 1) — uma linha por tabela,
    // sob CADA uma das 3 oportunidades (X/Y/Z), para provar propagação de
    // visibilidade tabela a tabela (ACCESS-05). Todo insert respeita
    // CLAUDE.md §3 (nada de seq_id/score/priority_level/rpa_score — nenhum
    // desses campos aparece aqui) e o guard de coerência da 0043
    // (tenant_id da linha = tenant_id da oportunidade, sempre, inclusive para
    // psw_staff — a exceção da 0043 é só para o profile, não para a linha).
    // ---------------------------------------------------------------------
    const { error: phasesErr } = await sb.from('opportunity_phases').insert([
      { opportunity_id: PSW_OPP_X_ID, tenant_id: FGCOOP_TEST_ID, phase_key: 'planejamento' },
      { opportunity_id: PSW_OPP_Y_ID, tenant_id: FGCOOP_TEST_ID, phase_key: 'planejamento' },
      { opportunity_id: PSW_OPP_Z_ID, tenant_id: ACME_TEST_ID, phase_key: 'planejamento' },
    ]);
    if (phasesErr) throw new Error(`setup falhou (opportunity_phases da fixture): ${phasesErr.message}`);

    const { error: risksErr } = await sb.from('opportunity_risks').insert([
      {
        opportunity_id: PSW_OPP_X_ID,
        tenant_id: FGCOOP_TEST_ID,
        descricao: 'risco fixture X',
        tipo: 'risco',
        impacto: 'moderado',
        probabilidade: 'possivel',
      },
      {
        opportunity_id: PSW_OPP_Y_ID,
        tenant_id: FGCOOP_TEST_ID,
        descricao: 'risco fixture Y',
        tipo: 'risco',
        impacto: 'moderado',
        probabilidade: 'possivel',
      },
      {
        opportunity_id: PSW_OPP_Z_ID,
        tenant_id: ACME_TEST_ID,
        descricao: 'risco fixture Z',
        tipo: 'risco',
        impacto: 'moderado',
        probabilidade: 'possivel',
      },
    ]);
    if (risksErr) throw new Error(`setup falhou (opportunity_risks da fixture): ${risksErr.message}`);

    const { error: tasksErr } = await sb.from('opportunity_tasks').insert([
      { opportunity_id: PSW_OPP_X_ID, tenant_id: FGCOOP_TEST_ID, title: 'tarefa fixture X', status: 'backlog' },
      { opportunity_id: PSW_OPP_Y_ID, tenant_id: FGCOOP_TEST_ID, title: 'tarefa fixture Y', status: 'backlog' },
      { opportunity_id: PSW_OPP_Z_ID, tenant_id: ACME_TEST_ID, title: 'tarefa fixture Z', status: 'backlog' },
    ]);
    if (tasksErr) throw new Error(`setup falhou (opportunity_tasks da fixture): ${tasksErr.message}`);

    const { error: notesErr } = await sb.from('opportunity_notes').insert([
      { opportunity_id: PSW_OPP_X_ID, tenant_id: FGCOOP_TEST_ID, texto: 'nota fixture X' },
      { opportunity_id: PSW_OPP_Y_ID, tenant_id: FGCOOP_TEST_ID, texto: 'nota fixture Y' },
      { opportunity_id: PSW_OPP_Z_ID, tenant_id: ACME_TEST_ID, texto: 'nota fixture Z' },
    ]);
    if (notesErr) throw new Error(`setup falhou (opportunity_notes da fixture): ${notesErr.message}`);

    const { error: documentsErr } = await sb.from('opportunity_documents').insert([
      {
        opportunity_id: PSW_OPP_X_ID,
        tenant_id: FGCOOP_TEST_ID,
        kind: 'link',
        nome: 'documento fixture X',
        url: 'https://example.test/x',
      },
      {
        opportunity_id: PSW_OPP_Y_ID,
        tenant_id: FGCOOP_TEST_ID,
        kind: 'link',
        nome: 'documento fixture Y',
        url: 'https://example.test/y',
      },
      {
        opportunity_id: PSW_OPP_Z_ID,
        tenant_id: ACME_TEST_ID,
        kind: 'link',
        nome: 'documento fixture Z',
        url: 'https://example.test/z',
      },
    ]);
    if (documentsErr) throw new Error(`setup falhou (opportunity_documents da fixture): ${documentsErr.message}`);

    const { error: historyErr } = await sb.from('opportunity_history').insert([
      { opportunity_id: PSW_OPP_X_ID, tenant_id: FGCOOP_TEST_ID, resumo: 'historico fixture X' },
      { opportunity_id: PSW_OPP_Y_ID, tenant_id: FGCOOP_TEST_ID, resumo: 'historico fixture Y' },
      { opportunity_id: PSW_OPP_Z_ID, tenant_id: ACME_TEST_ID, resumo: 'historico fixture Z' },
    ]);
    if (historyErr) throw new Error(`setup falhou (opportunity_history da fixture): ${historyErr.message}`);

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

    // Tenant de CONTROLE (describe `profiles visíveis`) — SEM nenhuma
    // oportunidade atribuída ao staff PSW. FGCoop e Acme não servem de
    // controle porque X/Z já estão atribuídas neles.
    const { error: controlTenantErr } = await sb.from('tenants').upsert(
      {
        id: CONTROL_TENANT_ID,
        slug: 'controle-sem-atribuicao-test',
        name: 'Controle Sem Atribuição Test',
        status: 'active',
      },
      { onConflict: 'id' },
    );
    if (controlTenantErr) throw new Error(`upsert tenant de controle falhou: ${controlTenantErr.message}`);

    const { data: controlList } = await sb.auth.admin.listUsers();
    const existingControl = controlList?.users.find((u) => u.email === CONTROL_TENANT_EMAIL);
    if (existingControl) {
      controlUserId = existingControl.id;
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email: CONTROL_TENANT_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        app_metadata: { tenant_id: CONTROL_TENANT_ID },
        user_metadata: { full_name: 'Controle Sem Atribuição Test', tenant_id: CONTROL_TENANT_ID },
      });
      if (error || !data.user) throw new Error(`createUser falhou (controle): ${error?.message}`);
      controlUserId = data.user.id;
    }
  });

  afterAll(async () => {
    if (!sb) return;
    await sb
      .from('opportunity_assignees')
      .delete()
      .in('opportunity_id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);
    // Apagar as 3 oportunidades dispara `on delete cascade` para TODAS as
    // tabelas filhas (phases/risks/tasks/notes/documents/history — FKs
    // verificadas em cada migration de origem, 0001/0011/0018/0037) — não há
    // como um documento/histórico ficar órfão: a FK garante isso no schema,
    // não precisa de delete explícito por tabela aqui.
    await sb.from('opportunities').delete().in('id', [PSW_OPP_X_ID, PSW_OPP_Y_ID, PSW_OPP_Z_ID]);
    // NÃO deletar auth.users nem o tenant de controle — idempotência da
    // próxima run (mesmo padrão de FGCOOP_TEST_ID/ACME_TEST_ID/PSW_TEST_ID).
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

  // ===========================================================================
  // Plan 17-05, Task 1 — propagação às tabelas filhas, `profiles` e os dois
  // triggers de coerência de tenant (check_assignee_tenant / responsável de
  // tarefa).
  // ===========================================================================

  describe('tabelas filhas', () => {
    // Um `it` por tabela (via `it.each`, nomeado com o texto da tabela) — se
    // uma tabela ficar sem policy aditiva ou com a policy escrita por
    // `tenant_id` em vez de `opportunity_id` (o erro nº 1 desta fase, T-17-26),
    // a falha aponta exatamente qual tabela está errada.
    it.each(CHILD_TABLES)(
      '%s — X (atribuída) visível, Y (mesmo tenant, sem atribuição) invisível, Z (outro tenant, atribuída) visível',
      async (table) => {
        const { client } = await asPswStaff();

        const { data: x, error: ex } = await selectByOpportunity(client, table, PSW_OPP_X_ID);
        expect(ex).toBeNull();
        expect((x ?? []).length).toBeGreaterThan(0);

        // Negativo decisivo: Y é do MESMO tenant de X, mas psw_staff não está
        // atribuído a ela — precisa dar data vazio, error nulo (RLS filtra em
        // silêncio, um SELECT nunca levanta erro por linha ausente).
        const { data: y, error: ey } = await selectByOpportunity(client, table, PSW_OPP_Y_ID);
        expect(ey).toBeNull();
        expect(y).toEqual([]);

        // Cross-tenant: Z é de OUTRO tenant, mas está atribuída — prova que a
        // propagação segue a atribuição, não o tenant do ator.
        const { data: z, error: ez } = await selectByOpportunity(client, table, PSW_OPP_Z_ID);
        expect(ez).toBeNull();
        expect((z ?? []).length).toBeGreaterThan(0);
      },
    );
  });

  describe('profiles visíveis', () => {
    it('psw_staff enxerga pessoas do tenant FGCoop (onde tem atribuição) e NÃO do tenant de controle (sem nenhuma atribuição)', async () => {
      const { client } = await asPswStaff();

      const { data: fg, error: efg } = await client.from('profiles').select('id').eq('tenant_id', FGCOOP_TEST_ID);
      expect(efg).toBeNull();
      expect((fg ?? []).length).toBeGreaterThan(0);

      const { data: ctrl, error: ectrl } = await client
        .from('profiles')
        .select('id')
        .eq('tenant_id', CONTROL_TENANT_ID);
      expect(ectrl).toBeNull();
      expect(ctrl).toEqual([]);
    });
  });

  describe('check_assignee_tenant', () => {
    // Todas as inserções abaixo usam SERVICE-ROLE de propósito: o objetivo é
    // exercitar o TRIGGER `check_assignee_tenant()` (0032/0040), que roda
    // mesmo com RLS bypassada (ele sobrevive inclusive a uma escrita por
    // service-role, é a ÚNICA barreira de banco contra atribuição cruzada
    // indevida). Não trocar para cliente autenticado "para ficar mais
    // realista" — a policy de INSERT de `opportunity_assignees` é
    // admin-only e não é o que este describe testa.
    it('a) profile do MESMO tenant da oportunidade aceita', async () => {
      const { error } = await sb.from('opportunity_assignees').insert({
        opportunity_id: PSW_OPP_X_ID,
        profile_id: fgcoopUserId,
        tenant_id: FGCOOP_TEST_ID,
      });
      expect(error).toBeNull();
      await sb
        .from('opportunity_assignees')
        .delete()
        .eq('opportunity_id', PSW_OPP_X_ID)
        .eq('profile_id', fgcoopUserId);
    });

    it('b) profile de OUTRO tenant, sem o papel psw_staff, rejeita', async () => {
      const { error } = await sb.from('opportunity_assignees').insert({
        opportunity_id: PSW_OPP_X_ID,
        profile_id: acmeUserId,
        tenant_id: FGCOOP_TEST_ID,
      });
      expect(error).not.toBeNull();
    });

    it('c) profile com o papel psw_staff aceita atribuição cross-tenant, em qualquer tenant', async () => {
      // Reusa a fixture do topo do arquivo em vez de inserir de novo: as
      // atribuições X (FGCoop) e Z (Acme) do staff PSW só existem porque o
      // trigger reescrito (0040) as aceitou — se ele tivesse rejeitado, o
      // `beforeAll` já teria lançado (`insertErr`/`assignXErr`/`assignZErr`
      // só logam, mas a suíte inteira dependeria dessas linhas existirem
      // para os describes de propagação acima, que já passaram).
      const { data, error } = await sb
        .from('opportunity_assignees')
        .select('opportunity_id')
        .eq('profile_id', pswStaffUserId)
        .in('opportunity_id', [PSW_OPP_X_ID, PSW_OPP_Z_ID]);
      expect(error).toBeNull();
      const ids = (data ?? []).map((r) => r.opportunity_id).sort();
      expect(ids).toEqual([PSW_OPP_X_ID, PSW_OPP_Z_ID].sort());
    });

    it('d) tenant_id da LINHA divergente do da oportunidade rejeita, para TODOS os papéis (D-10)', async () => {
      const { error } = await sb.from('opportunity_assignees').insert({
        opportunity_id: PSW_OPP_Y_ID, // tenant real: FGCoop
        profile_id: acmeUserId,
        tenant_id: ACME_TEST_ID, // errado de propósito — Y não é do tenant Acme
      });
      expect(error).not.toBeNull();
    });
  });

  describe('assignee de tarefa', () => {
    // Os 3 casos de `check_task_tenant_coherence()` reescrito (0041/D-14,
    // ACCESS-11) — mesma técnica por service-role do describe anterior.
    // Mensagens conferidas por substring (não igualdade exata) para não
    // quebrar em ajuste de texto da exceção.
    it('1) staff PSW atribuído à oportunidade é aceito como responsável da tarefa', async () => {
      const { data, error } = await sb
        .from('opportunity_tasks')
        .insert({
          opportunity_id: PSW_OPP_X_ID,
          tenant_id: FGCOOP_TEST_ID,
          title: 'tarefa — responsável psw_staff atribuído',
          status: 'backlog',
          assignee_id: pswStaffUserId,
        })
        .select('id')
        .single();
      expect(error).toBeNull();
      if (data?.id) await sb.from('opportunity_tasks').delete().eq('id', data.id);
    });

    it('2) staff PSW NÃO atribuído àquela oportunidade é rejeitado como responsável', async () => {
      const { error } = await sb.from('opportunity_tasks').insert({
        opportunity_id: PSW_OPP_Y_ID, // mesmo tenant de X, mas staff NÃO atribuído aqui
        tenant_id: FGCOOP_TEST_ID,
        title: 'tarefa — responsável psw_staff NÃO atribuído',
        status: 'backlog',
        assignee_id: pswStaffUserId,
      });
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Responsável de outra empresa');
    });

    it('3) profile de outro tenant, sem o papel psw_staff, é rejeitado como responsável', async () => {
      const { error } = await sb.from('opportunity_tasks').insert({
        opportunity_id: PSW_OPP_Z_ID, // tenant Acme
        tenant_id: ACME_TEST_ID,
        title: 'tarefa — responsável de outro tenant sem o papel novo',
        status: 'backlog',
        assignee_id: fgcoopUserId, // FGCoop, não psw_staff
      });
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Responsável de outra empresa');
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
