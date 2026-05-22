import { serviceRoleClient } from './supabase-test-client';

// UUIDs determinísticos para teste — facilita debug e cleanup
export const FGCOOP_TEST_ID = '11111111-1111-1111-1111-111111111111';
export const ACME_TEST_ID   = '22222222-2222-2222-2222-222222222222';

export const FGCOOP_TEST_EMAIL = 'fgcoop-user@test.local';
export const ACME_TEST_EMAIL   = 'acme-user@test.local';
export const TEST_PASSWORD     = 'test-password-123';

type SeedResult = {
  fgcoopTenantId: string;
  acmeTenantId: string;
  fgcoopUserId: string;
  acmeUserId: string;
};

/** Idempotente — seguro para chamar antes de cada suite. */
export async function seedTestTenants(): Promise<SeedResult> {
  const sb = serviceRoleClient();

  // 1. Tenants (upsert por id — 0002 já cria fgcoop, mas usamos slugs '-test' separados)
  const { error: tenantsErr } = await sb.from('tenants').upsert(
    [
      { id: FGCOOP_TEST_ID, slug: 'fgcoop-test', name: 'FGCoop Test', status: 'active' },
      { id: ACME_TEST_ID,   slug: 'acme-test',   name: 'Acme Test',   status: 'active' },
    ],
    { onConflict: 'id' },
  );
  if (tenantsErr) throw new Error(`upsert tenants falhou: ${tenantsErr.message}`);

  // 2. Users via Admin API — handle_new_user trigger lê app_metadata.tenant_id
  //    e cria o profile automaticamente.
  async function ensureUser(email: string, tenantId: string): Promise<string> {
    // Procura primeiro (idempotência)
    const { data: list } = await sb.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === email);
    if (existing) return existing.id;

    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      app_metadata: { tenant_id: tenantId },
      user_metadata: { full_name: `Test ${email}`, tenant_id: tenantId },
    });
    if (error || !data.user) {
      throw new Error(`createUser falhou para ${email}: ${error?.message}`);
    }
    return data.user.id;
  }

  const fgcoopUserId = await ensureUser(FGCOOP_TEST_EMAIL, FGCOOP_TEST_ID);
  const acmeUserId   = await ensureUser(ACME_TEST_EMAIL,   ACME_TEST_ID);

  return {
    fgcoopTenantId: FGCOOP_TEST_ID,
    acmeTenantId: ACME_TEST_ID,
    fgcoopUserId,
    acmeUserId,
  };
}

/** Para uso opcional em afterAll global — não obrigatório em CI. */
export async function cleanupTestTenants(): Promise<void> {
  const sb = serviceRoleClient();
  // Deleta oportunidades dos tenants de teste (cascade lida com phases)
  await sb.from('opportunities').delete().in('tenant_id', [FGCOOP_TEST_ID, ACME_TEST_ID]);
  // NÃO deletar auth.users automaticamente; deixar persistir para idempotência da próxima run.
}
