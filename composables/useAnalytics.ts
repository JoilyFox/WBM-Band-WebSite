import { getOrPersistSourcePlatform, type SourcePlatform } from '~/utils/sourceAttribution'
import { isLikelyBot } from '~/utils/isLikelyBot'

export type MasterPageType = 'listen' | 'pre-save'

export interface ReleaseViewParams {
  releaseSlug: string
  pageType: MasterPageType
  /**
   * Set to 'beacon' when an external navigation follows immediately (the
   * pre-save distributor auto-redirect). sendBeacon survives page teardown,
   * so the view isn't lost in the hop to the distributor. Omit on normal
   * pages — the default transport is fine when nothing tears the page down.
   */
  transport?: 'beacon'
}

export interface PlatformClickParams {
  platformName: string
  releaseSlug: string
  pageType: MasterPageType
}

const VIEW_DEDUP_KEY = 'wbm_release_views_seen'

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

  function trackReleaseView({ releaseSlug, pageType, transport }: ReleaseViewParams): void {
    if (typeof window === 'undefined') return
    const key = `${pageType}:${releaseSlug}`
    if (getSeenViews().includes(key)) return
    markViewSeen(key)
    gtag('event', 'release_view', {
      release_slug: releaseSlug,
      page_type: pageType,
      source_platform: getSourcePlatform(),
      ...(transport ? { transport_type: transport } : {})
    })
  }

  function trackPlatformClick({ platformName, releaseSlug, pageType }: PlatformClickParams): void {
    if (typeof window === 'undefined') return
    if (isLikelyBot()) return
    gtag('event', 'platform_click', {
      platform_name: platformName,
      release_slug: releaseSlug,
      page_type: pageType,
      source_platform: getSourcePlatform(),
      // 'beacon' transport survives the navigation that follows the click,
      // so the event isn't lost when the browser tears down the page.
      transport_type: 'beacon'
    })
  }

  return {
    getSourcePlatform,
    trackReleaseView,
    trackPlatformClick
  }
}
