import { config as loadEnv } from 'dotenv';
import { seedTestTenants } from './seed-test-tenants';

// Carrega .env.test ANTES de qualquer import que toque process.env
loadEnv({ path: '.env.test' });

function assertSafeEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const allowed =
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('http://localhost') ||
    url.includes('-test.supabase.co'); // projeto de teste dedicado
  if (!allowed) {
    throw new Error(
      `[ABORT] NEXT_PUBLIC_SUPABASE_URL=${url} parece apontar para produção. ` +
        `Tests só rodam contra localhost ou *-test.supabase.co.`,
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[ABORT] SUPABASE_SERVICE_ROLE_KEY ausente em .env.test');
  }
}

export default async function globalSetup() {
  assertSafeEnv();
  await seedTestTenants();
}
