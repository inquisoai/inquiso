import { defineConfig } from '@playwright/test'

/** E2E loads the built extension in real Chromium. Requires `pnpm build` first
 * and `pnpm exec playwright install chromium`. Runs in CI, not in unit runs. */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
})
