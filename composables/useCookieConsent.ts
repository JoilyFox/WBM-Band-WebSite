import { ref, computed } from 'vue'

/**
 * Single source of truth for the visitor's GA4 consent state.
 *
 * Wrapper around Google Consent Mode v2: the gtag default in
 * nuxt.config.ts is `denied` for every storage type, and we call
 * `gtag('consent', 'update', ...)` when the user makes a choice.
 *
 * State persists in localStorage so the toast doesn't reappear on
 * every page load. Resetting (from the cookies-policy page) wipes
 * the stored value and reverts to default-deny.
 */

export type ConsentState = 'undecided' | 'accepted' | 'declined'

const STORAGE_KEY = 'wbm_cookie_consent'

// Module-level ref so every component that calls useCookieConsent()
// shares the same reactive state.
const state = ref<ConsentState>('undecided')
let initialized = false

function safeWriteStorage(value: ConsentState | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // localStorage may be disabled (Safari private mode etc.) — skip silently
  }
}

function safeReadStorage(): 'accepted' | 'declined' | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === 'accepted' || raw === 'declined' ? raw : null
  } catch {
    return null
  }
}

export function useCookieConsent() {
  const { gtag } = useGtag()

  function applyToGtag(decision: 'accepted' | 'declined'): void {
    const value = decision === 'accepted' ? 'granted' : 'denied'
    gtag('consent', 'update', {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value
    })
  }

  /**
   * Hydrate state from localStorage on the first call after mount,
   * and apply any persisted decision to gtag so the user doesn't
   * have to re-consent every visit. Idempotent.
   */
  function hydrate(): void {
    if (initialized || typeof window === 'undefined') return
    initialized = true
    const stored = safeReadStorage()
    if (stored) {
      state.value = stored
      applyToGtag(stored)
    }
  }

  function accept(): void {
    state.value = 'accepted'
    safeWriteStorage('accepted')
    applyToGtag('accepted')
  }

  function decline(): void {
    state.value = 'declined'
    safeWriteStorage('declined')
    applyToGtag('declined')
  }

  /**
   * Wipe the stored decision and revert state to undecided so the
   * toast reappears on next page load. We don't push a new consent
   * update to gtag here — the existing in-memory grant remains until
   * the page is reloaded, which is the expected user model.
   */
  function reset(): void {
    state.value = 'undecided'
    safeWriteStorage(null)
  }

  return {
    state: computed(() => state.value),
    isUndecided: computed(() => state.value === 'undecided'),
    accept,
    decline,
    reset,
    hydrate
  }
}
