/**
 * Microsoft Clarity (heatmaps, scroll maps, session recordings).
 *
 * Unlike GA4, which loads for everyone and runs cookieless until consent
 * (Consent Mode v2 default-deny), Clarity records the session itself, so it is
 * not loaded at all until the visitor accepts analytics cookies in the toast.
 * useCookieConsent() calls applyClarityConsent() on accept / decline / hydrate.
 *
 * Clarity enforces a consent signal for EEA/UK/CH visits since 2025-10-31; we
 * send it with the Consent API v2 right after the snippet, before any cookie is
 * set. A later decline sends `denied`, which stops Clarity from using cookies;
 * it fully unloads on the next page load, like gtag.
 *
 * Only production hosts and non-bot user agents are recorded. Clarity has no
 * GA4-style internal-traffic filter, so a local `npx serve` of a production
 * build would otherwise land in the real dashboard.
 */
import { isLikelyBot } from '~/utils/isLikelyBot'
import { PRODUCTION_HOSTS } from '~/utils/productionHosts'

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    clarity?: ClarityFn
  }
}

let loaded = false
// Custom tags (source_platform, campaign_id) can be set before Clarity loads;
// they are replayed when it does, so recordings are filterable by bio-link.
const pendingTags = new Map<string, string>()

function canRecord(projectId: string): boolean {
  if (!projectId || typeof window === 'undefined') return false
  if (!PRODUCTION_HOSTS.includes(window.location.hostname)) return false
  return !isLikelyBot()
}

function load(projectId: string): void {
  // Microsoft's snippet, unminified: a queueing stub plus the async tag script.
  const stub: ClarityFn = (...args: unknown[]) => {
    ;(stub.q = stub.q || []).push(args)
  }
  window.clarity = window.clarity || stub
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`
  document.head.appendChild(script)
  loaded = true
}

export function applyClarityConsent(projectId: string, granted: boolean): void {
  if (!canRecord(projectId)) return
  if (!loaded) {
    if (!granted) return
    load(projectId)
  }
  window.clarity?.('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: granted ? 'granted' : 'denied'
  })
  if (granted) {
    for (const [key, value] of pendingTags) window.clarity?.('set', key, value)
  }
}

export function setClarityTags(tags: Record<string, string>): void {
  for (const [key, value] of Object.entries(tags)) pendingTags.set(key, value)
  if (!loaded) return
  for (const [key, value] of Object.entries(tags)) window.clarity?.('set', key, value)
}

/** Test hook: forget the loaded script and queued tags. */
export function resetClarityForTests(): void {
  loaded = false
  pendingTags.clear()
  delete window.clarity
}
