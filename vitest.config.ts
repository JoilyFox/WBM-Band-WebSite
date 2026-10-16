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
      // Ratchet floor, set to the measured baseline rounded DOWN (Oct 2026, after the
      // dead API/cache layer was deleted: lines 52.7 / stmts 51.7 / funcs 54.3 /
      // branches 45.9). CI runs `npm run coverage`, so a drop below fails the build.
      // Raise these as the untested perf/scroll composables get covered; never set a
      // threshold you aren't already above (docs/testing-strategy.md §7).
      thresholds: { lines: 52, statements: 51, functions: 54, branches: 45 }
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
