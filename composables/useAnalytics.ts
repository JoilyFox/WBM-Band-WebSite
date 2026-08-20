import { getOrPersistSourcePlatform, type SourcePlatform } from '~/utils/sourceAttribution'
import { getOrPersistCampaign, NO_CAMPAIGN } from '~/utils/campaignAttribution'
import { isLikelyBot } from '~/utils/isLikelyBot'

export type MasterPageType = 'listen' | 'pre-save'

export interface ReleaseViewParams {
  releaseSlug: string
  pageType: MasterPageType
}

export interface PlatformClickParams {
  platformName: string
  releaseSlug: string
  pageType: MasterPageType
}

const VIEW_DEDUP_KEY = 'wbm_release_views_seen'

// Upper bound on how long an awaited event waits for gtag to dispatch it
// before we proceed anyway. Must exceed the Consent Mode `wait_for_update`
// (500ms) so the cookieless ping is actually sent before navigation, while
// still being short enough not to make a redirect feel broken.
const EVENT_FLUSH_TIMEOUT_MS = 1000

function getSeenViews(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(VIEW_DEDUP_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function markViewSeen(key: string): void {
  if (typeof window === 'undefined') return
  const seen = getSeenViews()
  if (seen.includes(key)) return
  seen.push(key)
  try {
    window.sessionStorage.setItem(VIEW_DEDUP_KEY, JSON.stringify(seen))
  } catch {
    // sessionStorage full or disabled — fail silently; dedup is best-effort
  }
}

/**
 * The single GA4 surface for the rest of the app. Pages and components
 * use these helpers; nobody else calls `gtag()` directly.
 *
 * All methods are SSR-safe no-ops on the server. Bot traffic is filtered
 * before `platform_click` (the conversion event) — page-view noise is
 * tolerable but inflated conversion counts would break the dashboards.
 */
export function useAnalytics() {
  const { gtag } = useGtag()

  function getSourcePlatform(): SourcePlatform {
    if (typeof window === 'undefined') return 'direct'
    return getOrPersistSourcePlatform()
  }

  /**
   * Promo-campaign id from `?c=…` (first-touch, session-persisted), or
   * `'none'`. Orthogonal to the source platform: the platform says WHERE the
   * visitor came from, the campaign says WHICH placement on it.
   */
  function getCampaignId(): string {
    if (typeof window === 'undefined') return NO_CAMPAIGN
    return getOrPersistCampaign()
  }

  /**
   * Fire a GA4 event and resolve once gtag confirms it was dispatched (via
   * `event_callback`) or a safety timeout elapses. Callers that navigate away
   * immediately afterwards (the pre-save distributor redirect) MUST await this,
   * otherwise the page is torn down before the cookieless ping leaves the
   * browser and the event is lost — `transport_type` as an event param is NOT
   * real beacon transport, so fire-and-forget-then-redirect drops the hit.
   * `event_timeout` caps how long gtag itself waits; the extra setTimeout is a
   * backstop for when gtag never calls back (blocked, not loaded, no consent).
   */
  function sendEvent(name: string, params: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      let settled = false
      const done = (): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve()
      }
      const timer = setTimeout(done, EVENT_FLUSH_TIMEOUT_MS)
      gtag('event', name, {
        ...params,
        event_callback: done,
        event_timeout: EVENT_FLUSH_TIMEOUT_MS
      })
    })
  }

  function trackReleaseView({ releaseSlug, pageType }: ReleaseViewParams): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    const source = getSourcePlatform()
    const campaign = getCampaignId()
    // Dedup per session AND per source AND per campaign: the same release
    // opened from two bio links (e.g. /listen/i/<slug> then /listen/tt/<slug>)
    // — or from two different campaign links on the same platform — is two
    // distinct views and both must count. Keying on pageType:slug alone would
    // silently drop the second one.
    const key = `${pageType}:${releaseSlug}:${source}:${campaign}`
    if (getSeenViews().includes(key)) return Promise.resolve()
    markViewSeen(key)
    return sendEvent('release_view', {
      release_slug: releaseSlug,
      page_type: pageType,
      source_platform: source,
      campaign_id: campaign
    })
  }

  function trackPlatformClick({
    platformName,
    releaseSlug,
    pageType
  }: PlatformClickParams): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    if (isLikelyBot()) return Promise.resolve()
    return sendEvent('platform_click', {
      platform_name: platformName,
      release_slug: releaseSlug,
      page_type: pageType,
      source_platform: getSourcePlatform(),
      campaign_id: getCampaignId()
    })
  }

  return {
    getSourcePlatform,
    getCampaignId,
    trackReleaseView,
    trackPlatformClick
  }
}
