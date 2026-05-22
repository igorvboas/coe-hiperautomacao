import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
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
