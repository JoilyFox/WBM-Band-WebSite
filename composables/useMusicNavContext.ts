import { ref, computed } from 'vue'

/**
 * Tracks whether the visitor has actively navigated between a release's
 * Music (links) view and its Lyrics view in the recent past.
 *
 * Drives the lyrics "back" pill label. There are two ways onto a /lyrics/<slug>
 * page and they need different copy:
 *   1. From the release page — the visitor tapped "Lyrics" (or toggled back),
 *      so they have the context for "Back to Music".
 *   2. Cold, straight from a search engine — "Back to Music" means nothing to
 *      them (they never saw the music view), so the pill reads "Listen to the
 *      Song" instead.
 *
 * The flag is set the moment the visitor interacts with the toggle, and is
 * persisted in localStorage with a timestamp so it survives refreshes and
 * navigation. It EXPIRES after CONTEXT_TTL_MS (a couple of hours) — long enough
 * to keep the context across one browsing session, short enough that a visitor
 * returning days later (who has forgotten the context) is treated as cold again.
 * It's global, not per-release: once someone understands the music<->lyrics
 * relationship, it reads the same for every song.
 *
 * Mirrors the SSR-safe localStorage approach in useCookieConsent.ts.
 */

const STORAGE_KEY = 'wbm_music_nav_context_ts'
const CONTEXT_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

// Module-level ref so every caller shares the same reactive state. Starts false
// so SSR (no localStorage) and the first client render agree — no hydration
// mismatch; hydrate() promotes it to true after mount when a fresh stamp exists.
const hasContext = ref(false)
let initialized = false

function safeRead(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const ts = Number.parseInt(raw, 10)
    return Number.isFinite(ts) ? ts : null
  } catch {
    return null
  }
}

function safeWrite(ts: number | null): void {
  if (typeof window === 'undefined') return
  try {
    if (ts === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, String(ts))
  } catch {
    // localStorage may be disabled (Safari private mode etc.) — skip silently
  }
}

export function useMusicNavContext() {
  /**
   * Hydrate from localStorage on the first call after mount. A stamp within the
   * TTL flips hasContext on; an expired stamp is cleaned up. Idempotent.
   */
  function hydrate(): void {
    if (initialized || typeof window === 'undefined') return
    initialized = true
    const ts = safeRead()
    if (ts !== null && Date.now() - ts <= CONTEXT_TTL_MS) {
      hasContext.value = true
    } else if (ts !== null) {
      safeWrite(null) // expired — drop the stale stamp
    }
  }

  /**
   * Record that the visitor has used the music<->lyrics toggle. Refreshes the
   * timestamp (sliding window) so continued use keeps the context alive.
   */
  function markContext(): void {
    safeWrite(Date.now())
    hasContext.value = true
  }

  return {
    hasContext: computed(() => hasContext.value),
    markContext,
    hydrate
  }
}
