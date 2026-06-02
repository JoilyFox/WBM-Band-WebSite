import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

// Project root, so the `node` unit project can resolve `~`/`@` imports the same
// way Nuxt does (many pure utils import `~/constants/*`, `~/config/*`). The nuxt
// project gets these aliases from Nuxt's own Vite config.
const rootDir = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')

// Two projects, one mental model (see docs/testing-strategy.md §3):
//   • unit  → env `node`, no Nuxt. Pure utils. Fastest. Import by RELATIVE path.
//   • nuxt  → env `nuxt`. Composables/components/middleware touching auto-imports,
//             useNuxtApp, #i18n, navigateTo, etc. `~/` and `#imports` resolve here.
// e2e lives in its own config (vitest.e2e.config.ts) and is kept OUT of `vitest run`
// so the inner loop stays fast.
//
// NOTE: @nuxt/test-utils@4 rejects `projects` inside `defineVitestConfig`; the
// supported shape is plain `defineConfig` + `defineVitestProject` per Nuxt project.
// This also keeps test/setup.nuxt.ts (mockNuxtImport) scoped to the nuxt project only.
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['utils/**', 'composables/**', 'middleware/**', 'config/**'],
      exclude: ['**/*.d.ts', 'scripts/**', '**/types/**'],
      // Ratchet floor — set a few points under the measured baseline (lines 57.8 /
      // stmts 56.5 / funcs 56.3 / branches 53.5). Enforced by `npm run coverage`.
      // Bump these toward ~70% as the untested perf/scroll composables get covered;
      // never set a threshold you aren't already above (docs/testing-strategy.md §7).
      thresholds: { lines: 54, statements: 53, functions: 52, branches: 50 }
    },
    projects: [
      {
        resolve: { alias: { '~': rootDir, '@': rootDir } },
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          include: ['test/unit/**/*.{test,spec}.ts']
        }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          globals: true,
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environmentOptions: {
            nuxt: { domEnvironment: 'happy-dom', mock: { intersectionObserver: true } }
          },
          setupFiles: ['./test/setup.nuxt.ts']
        }
      })
    ]
  }
})
