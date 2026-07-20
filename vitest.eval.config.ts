import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// Evaluation harness config (pnpm evaluate:memory) — separate from unit tests
// so `pnpm test` stays fast and eval scenarios can take their time.
export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['tests/evaluation/**/*.eval.test.ts'],
    testTimeout: 30_000,
  },
})
