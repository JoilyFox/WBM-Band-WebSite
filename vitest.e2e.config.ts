import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Standalone e2e config — kept OUT of the default `vitest run` (see vitest.config.ts)
// so the inner loop stays fast. These specs assert against the prerendered
// `.output/public` produced by `npm run generate`; the `test:e2e` script builds first.
const rootDir = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')

export default defineConfig({
  resolve: { alias: { '~': rootDir, '@': rootDir } },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/e2e/**/*.{test,spec}.ts'],
    // Browser specs (when present) need more headroom than unit tests.
    testTimeout: 30000,
    hookTimeout: 120000
  }
})
