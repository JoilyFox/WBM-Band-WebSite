import { vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// nuxt-gtag isn't wired up in the test runtime — stub useGtag so analytics
// composables (useAnalytics / useCookieConsent) don't explode on import.
mockNuxtImport('useGtag', () => () => ({
  gtag: vi.fn(),
  initialize: vi.fn(),
  enableAnalytics: vi.fn(),
  disableAnalytics: vi.fn()
}))

// The Web Cache API (caches.*) isn't implemented in happy-dom — minimal shim so
// utils/cache.ts can exercise its Cache-API branch without throwing.
if (typeof globalThis.caches === 'undefined') {
  // Minimal shim — not the full CacheStorage surface, hence the cast.
  globalThis.caches = {
    open: async () => ({
      match: async () => undefined,
      put: async () => {},
      delete: async () => false,
      keys: async () => []
    }),
    delete: async () => false,
    keys: async () => []
  } as unknown as CacheStorage
}
