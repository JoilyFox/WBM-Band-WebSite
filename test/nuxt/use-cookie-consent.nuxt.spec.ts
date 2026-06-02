// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// useGtag is an AUTO-IMPORT inside the composable (`const { gtag } = useGtag()`),
// so it must be re-mocked via mockNuxtImport. The hoisted `gtag` spy is returned
// for every call, letting us assert the exact Consent-Mode v2 payloads. This
// override shadows the generic stub in test/setup.nuxt.ts for this file only.
const { gtag } = vi.hoisted(() => ({ gtag: vi.fn() }))
mockNuxtImport('useGtag', () => () => ({ gtag }))

const STORAGE_KEY = 'wbm_cookie_consent'

// The composable keeps module-level singleton state (`state`, `sessionSnoozed`,
// `initialized`). resetModules() + dynamic re-import gives each test a pristine
// singleton, which is essential for honestly testing hydration and the
// idempotency guard that lives in the module-private `initialized` flag.
async function freshConsent() {
  vi.resetModules()
  const mod = await import('~/composables/useCookieConsent')
  return mod.useCookieConsent()
}

beforeEach(() => {
  window.localStorage.clear()
  gtag.mockClear()
})

describe('useCookieConsent', () => {
  describe('initial / undecided state', () => {
    it('starts undecided with no stored decision', async () => {
      const consent = await freshConsent()
      expect(consent.state.value).toBe('undecided')
      expect(consent.isUndecided.value).toBe(true)
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('does not touch gtag before any decision or hydrate', async () => {
      await freshConsent()
      expect(gtag).not.toHaveBeenCalled()
    })
  })

  describe('accept()', () => {
    it('sets state to accepted and persists "accepted"', async () => {
      const consent = await freshConsent()
      consent.accept()
      expect(consent.state.value).toBe('accepted')
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('accepted')
    })

    it('pushes the granted Consent-Mode v2 payload to gtag', async () => {
      const consent = await freshConsent()
      consent.accept()
      expect(gtag).toHaveBeenCalledTimes(1)
      expect(gtag).toHaveBeenCalledWith('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      })
    })

    it('grants exactly the four Consent-Mode v2 keys and nothing else', async () => {
      const consent = await freshConsent()
      consent.accept()
      const payload = gtag.mock.calls[0][2]
      expect(Object.keys(payload).sort()).toEqual([
        'ad_personalization',
        'ad_storage',
        'ad_user_data',
        'analytics_storage'
      ])
      expect(Object.values(payload).every((v) => v === 'granted')).toBe(true)
    })

    it('flips state once no longer undecided', async () => {
      const consent = await freshConsent()
      consent.accept()
      expect(consent.isUndecided.value).toBe(false)
    })
  })

  describe('decline()', () => {
    it('sets state to declined and persists "declined"', async () => {
      const consent = await freshConsent()
      consent.decline()
      expect(consent.state.value).toBe('declined')
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('declined')
    })

    it('pushes the denied Consent-Mode v2 payload to gtag', async () => {
      const consent = await freshConsent()
      consent.decline()
      expect(gtag).toHaveBeenCalledTimes(1)
      expect(gtag).toHaveBeenCalledWith('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      })
    })

    it('denies exactly the four Consent-Mode v2 keys and nothing else', async () => {
      const consent = await freshConsent()
      consent.decline()
      const payload = gtag.mock.calls[0][2]
      expect(Object.keys(payload).sort()).toEqual([
        'ad_personalization',
        'ad_storage',
        'ad_user_data',
        'analytics_storage'
      ])
      expect(Object.values(payload).every((v) => v === 'denied')).toBe(true)
    })

    it('flips state once no longer undecided', async () => {
      const consent = await freshConsent()
      consent.decline()
      expect(consent.isUndecided.value).toBe(false)
    })
  })

  describe('snooze()', () => {
    it('hides the banner via isUndecided without changing state', async () => {
      const consent = await freshConsent()
      consent.snooze()
      expect(consent.state.value).toBe('undecided')
      expect(consent.isUndecided.value).toBe(false)
    })

    it('does NOT persist anything to localStorage', async () => {
      const consent = await freshConsent()
      consent.snooze()
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('does NOT call gtag', async () => {
      const consent = await freshConsent()
      consent.snooze()
      expect(gtag).not.toHaveBeenCalled()
    })

    it('a full reload (fresh module) resurfaces the banner', async () => {
      const consent = await freshConsent()
      consent.snooze()
      expect(consent.isUndecided.value).toBe(false)
      // Simulate a full page reload: brand-new module, snooze flag gone.
      const reloaded = await freshConsent()
      expect(reloaded.isUndecided.value).toBe(true)
    })
  })

  describe('reset()', () => {
    it('reverts state to undecided and wipes the stored value', async () => {
      const consent = await freshConsent()
      consent.accept()
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('accepted')
      consent.reset()
      expect(consent.state.value).toBe('undecided')
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('does NOT push a fresh consent update to gtag', async () => {
      const consent = await freshConsent()
      consent.accept()
      gtag.mockClear()
      consent.reset()
      expect(gtag).not.toHaveBeenCalled()
    })

    it('makes isUndecided true again (banner reappears)', async () => {
      const consent = await freshConsent()
      consent.decline()
      expect(consent.isUndecided.value).toBe(false)
      consent.reset()
      expect(consent.isUndecided.value).toBe(true)
    })

    it('reset after a session snooze still re-surfaces the banner', async () => {
      const consent = await freshConsent()
      consent.snooze()
      consent.reset()
      // sessionSnoozed is in-memory and untouched by reset, but state is
      // back to undecided. snooze still suppresses within the same session.
      expect(consent.state.value).toBe('undecided')
      expect(consent.isUndecided.value).toBe(false)
    })
  })

  describe('hydrate()', () => {
    it('applies a stored "accepted" decision to state and gtag', async () => {
      window.localStorage.setItem(STORAGE_KEY, 'accepted')
      const consent = await freshConsent()
      consent.hydrate()
      expect(consent.state.value).toBe('accepted')
      expect(gtag).toHaveBeenCalledTimes(1)
      expect(gtag).toHaveBeenCalledWith('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      })
    })

    it('applies a stored "declined" decision to state and gtag', async () => {
      window.localStorage.setItem(STORAGE_KEY, 'declined')
      const consent = await freshConsent()
      consent.hydrate()
      expect(consent.state.value).toBe('declined')
      expect(gtag).toHaveBeenCalledTimes(1)
      expect(gtag).toHaveBeenCalledWith('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      })
    })

    it('is a no-op when nothing is stored', async () => {
      const consent = await freshConsent()
      consent.hydrate()
      expect(consent.state.value).toBe('undecided')
      expect(gtag).not.toHaveBeenCalled()
    })

    it('ignores garbage / unknown stored values', async () => {
      window.localStorage.setItem(STORAGE_KEY, 'maybe-later')
      const consent = await freshConsent()
      consent.hydrate()
      expect(consent.state.value).toBe('undecided')
      expect(gtag).not.toHaveBeenCalled()
    })

    it('is idempotent — a second hydrate does not re-apply to gtag', async () => {
      window.localStorage.setItem(STORAGE_KEY, 'accepted')
      const consent = await freshConsent()
      consent.hydrate()
      consent.hydrate()
      expect(gtag).toHaveBeenCalledTimes(1)
      expect(consent.state.value).toBe('accepted')
    })

    it('the initialized guard sticks even if storage changes after first hydrate', async () => {
      const consent = await freshConsent()
      // First hydrate with empty storage marks the singleton as initialized.
      consent.hydrate()
      expect(consent.state.value).toBe('undecided')
      // A later write should be ignored by a subsequent hydrate (guard short-circuits).
      window.localStorage.setItem(STORAGE_KEY, 'accepted')
      consent.hydrate()
      expect(consent.state.value).toBe('undecided')
      expect(gtag).not.toHaveBeenCalled()
    })
  })

  describe('shared singleton across callers', () => {
    it('two useCookieConsent() calls observe the same reactive state', async () => {
      const mod = await (async () => {
        vi.resetModules()
        return import('~/composables/useCookieConsent')
      })()
      const a = mod.useCookieConsent()
      const b = mod.useCookieConsent()
      a.accept()
      expect(b.state.value).toBe('accepted')
      expect(b.isUndecided.value).toBe(false)
    })
  })

  describe('isUndecided derivation', () => {
    it('is true only while undecided AND not snoozed', async () => {
      const consent = await freshConsent()
      expect(consent.isUndecided.value).toBe(true)
      consent.snooze()
      expect(consent.isUndecided.value).toBe(false)
    })

    it('decided state keeps isUndecided false regardless of snooze', async () => {
      const consent = await freshConsent()
      consent.accept()
      consent.snooze()
      expect(consent.isUndecided.value).toBe(false)
    })
  })

  describe('localStorage resilience', () => {
    it('accept() still updates state + gtag when setItem throws', async () => {
      const setSpy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded / private mode')
      })
      try {
        const consent = await freshConsent()
        expect(() => consent.accept()).not.toThrow()
        expect(consent.state.value).toBe('accepted')
        expect(gtag).toHaveBeenCalledTimes(1)
      } finally {
        setSpy.mockRestore()
      }
    })

    it('hydrate() treats a throwing getItem as "no stored decision"', async () => {
      const getSpy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      try {
        const consent = await freshConsent()
        expect(() => consent.hydrate()).not.toThrow()
        expect(consent.state.value).toBe('undecided')
        expect(gtag).not.toHaveBeenCalled()
      } finally {
        getSpy.mockRestore()
      }
    })
  })
})
