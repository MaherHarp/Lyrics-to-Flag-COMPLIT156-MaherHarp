import { defineConfig } from '@playwright/test';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/** Monorepo root (parent of `apps/`). */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
  webServer: {
    command: './node_modules/.bin/pnpm dev',
    cwd: repoRoot,
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
