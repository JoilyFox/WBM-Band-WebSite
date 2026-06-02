// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { detectFromPath } from '~/utils/sourceAttribution'

// Smoke test: proves the nuxt Vitest project boots end-to-end — the `~/` alias
// resolves to project source, Nuxt auto-imports are injected, and
// test/setup.nuxt.ts ran (Cache API shim present). If this is green, the harness
// is ready for the real composable/component/middleware tests in later waves.
describe('nuxt test environment smoke', () => {
  it('resolves the ~ alias to project source', () => {
    expect(detectFromPath('/listen/i/mania')).toBe('instagram')
  })

  it('exposes Nuxt auto-imports (useRuntimeConfig)', () => {
    expect(useRuntimeConfig()).toBeDefined()
  })

  it('ran setup.nuxt.ts (Web Cache API shim present)', () => {
    expect(globalThis.caches).toBeDefined()
  })
})
