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
