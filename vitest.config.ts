import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // `server-only` é um marker do Next.js que existe apenas no bundler para
      // impedir que módulos server-side vazem para o client bundle. Em ambiente
      // de teste (Node puro), o pacote não está instalado e não tem efeito —
      // resolvemos para um stub vazio para que `import 'server-only'` passe.
      // Padrão recomendado pela própria doc do Next para Vitest.
      'server-only': path.resolve(__dirname, './tests/setup/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'node',
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    sequence: { concurrent: false },
    globalSetup: ['./tests/setup/global-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'supabase/**', 'get-shit-done/**'],
  },
});
