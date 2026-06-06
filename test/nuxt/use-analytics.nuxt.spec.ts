// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// useGtag is a Nuxt auto-import (nuxt-gtag). Re-mock it here so we can capture
// the gtag calls that useAnalytics makes. A hoisted vi.fn lets us assert per test.
const { gtag } = vi.hoisted(() => ({ gtag: vi.fn() }))
mockNuxtImport('useGtag', () => () => ({ gtag }))

// isLikelyBot and getOrPersistSourcePlatform are EXPLICIT imports in the source,
// so mockNuxtImport would NOT intercept them — they need vi.mock.
const { isLikelyBot, getOrPersistSourcePlatform } = vi.hoisted(() => ({
  isLikelyBot: vi.fn(() => false),
  getOrPersistSourcePlatform: vi.fn(() => 'instagram')
}))
vi.mock('~/utils/isLikelyBot', () => ({ isLikelyBot }))
vi.mock('~/utils/sourceAttribution', () => ({ getOrPersistSourcePlatform }))

const { useAnalytics } = await import('~/composables/useAnalytics')

const DEDUP_KEY = 'wbm_release_views_seen'

beforeEach(() => {
  vi.clearAllMocks()
  // Restore default mock implementations cleared above.
  isLikelyBot.mockImplementation(() => false)
  getOrPersistSourcePlatform.mockImplementation(() => 'instagram')
  // gtag invokes the event_callback synchronously, mirroring how real gtag
  // confirms an event was dispatched — so the awaitable sends resolve and the
  // flush-timeout timer is cleared (no leaked timers between tests).
  gtag.mockImplementation((_cmd: string, _name: string, params?: Record<string, unknown>) => {
    const cb = params?.event_callback
    if (typeof cb === 'function') (cb as () => void)()
  })
  // The dedup state lives in the real (nuxt-env) sessionStorage.
  window.sessionStorage.clear()
})

describe('useAnalytics()', () => {
  it('exposes the three public helpers', () => {
    const api = useAnalytics()
    expect(typeof api.getSourcePlatform).toBe('function')
    expect(typeof api.trackReleaseView).toBe('function')
    expect(typeof api.trackPlatformClick).toBe('function')
  })

  describe('getSourcePlatform()', () => {
    it('delegates to getOrPersistSourcePlatform in the browser', () => {
      getOrPersistSourcePlatform.mockReturnValue('tiktok')
      const { getSourcePlatform } = useAnalytics()
      expect(getSourcePlatform()).toBe('tiktok')
      expect(getOrPersistSourcePlatform).toHaveBeenCalledTimes(1)
    })
  })

  describe('trackReleaseView()', () => {
    it('fires release_view with the correct event name and params on first human view', () => {
      getOrPersistSourcePlatform.mockReturnValue('youtube')
      const { trackReleaseView } = useAnalytics()

      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })

      expect(gtag).toHaveBeenCalledTimes(1)
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'release_view',
        expect.objectContaining({
          release_slug: 'mania',
          page_type: 'listen',
          source_platform: 'youtube'
        })
      )
    })

    it('attaches event_callback + event_timeout for delivery, and no dead transport_type param', () => {
      const { trackReleaseView } = useAnalytics()
      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })

      const params = gtag.mock.calls[0][2]
      // event_callback + event_timeout are what let the pre-save redirect await
      // real delivery; transport_type-as-param was a no-op and is gone.
      expect(typeof params.event_callback).toBe('function')
      expect(params.event_timeout).toBeGreaterThan(0)
      expect(params).not.toHaveProperty('transport_type')
    })

    it('resolves the returned promise once gtag dispatches (awaitable before a redirect)', async () => {
      const { trackReleaseView } = useAnalytics()
      await expect(
        trackReleaseView({ releaseSlug: 'mania', pageType: 'pre-save' })
      ).resolves.toBeUndefined()
      expect(gtag).toHaveBeenCalledTimes(1)
    })

    it('dedupes a SECOND identical view via sessionStorage (does not re-fire)', () => {
      const { trackReleaseView } = useAnalytics()

      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })
      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })

      expect(gtag).toHaveBeenCalledTimes(1)
    })

    it('persists the seen key to sessionStorage under the dedup key', () => {
      const { trackReleaseView } = useAnalytics()
      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })

      const raw = window.sessionStorage.getItem(DEDUP_KEY)
      expect(raw).toBeTruthy()
      // Dedup key is pageType:slug:source (source mock defaults to 'instagram').
      expect(JSON.parse(raw as string)).toEqual(['listen:mania:instagram'])
    })

    it('treats a different pageType for the same slug as a distinct view', () => {
      const { trackReleaseView } = useAnalytics()

      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })
      trackReleaseView({ releaseSlug: 'mania', pageType: 'pre-save' })

      expect(gtag).toHaveBeenCalledTimes(2)
      expect(JSON.parse(window.sessionStorage.getItem(DEDUP_KEY) as string)).toEqual([
        'listen:mania:instagram',
        'pre-save:mania:instagram'
      ])
    })

    it('treats a different slug for the same pageType as a distinct view', () => {
      const { trackReleaseView } = useAnalytics()

      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })
      trackReleaseView({ releaseSlug: 'other-song', pageType: 'listen' })

      expect(gtag).toHaveBeenCalledTimes(2)
    })

    it('treats the SAME release from a different source as a distinct view (source-aware dedup)', () => {
      // A band pushes one release across multiple bio links; opening
      // /listen/i/<slug> then /listen/tt/<slug> in one session is two source
      // views and both must fire. Keying on pageType:slug alone dropped the 2nd.
      const { trackReleaseView } = useAnalytics()

      getOrPersistSourcePlatform.mockReturnValue('instagram')
      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })

      getOrPersistSourcePlatform.mockReturnValue('tiktok')
      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })

      expect(gtag).toHaveBeenCalledTimes(2)
      expect(JSON.parse(window.sessionStorage.getItem(DEDUP_KEY) as string)).toEqual([
        'listen:mania:instagram',
        'listen:mania:tiktok'
      ])
    })

    it('still records the release_view event even for bot traffic (views are not bot-filtered)', () => {
      // Bot filtering applies only to the conversion event (platform_click);
      // release_view noise is intentionally tolerated.
      isLikelyBot.mockReturnValue(true)
      const { trackReleaseView } = useAnalytics()

      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })

      expect(gtag).toHaveBeenCalledTimes(1)
      expect(gtag).toHaveBeenCalledWith('event', 'release_view', expect.any(Object))
    })

    it('survives a pre-seeded dedup list and only fires for unseen keys', () => {
      window.sessionStorage.setItem(DEDUP_KEY, JSON.stringify(['listen:mania:instagram']))
      const { trackReleaseView } = useAnalytics()

      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })
      expect(gtag).not.toHaveBeenCalled()

      trackReleaseView({ releaseSlug: 'fresh', pageType: 'listen' })
      expect(gtag).toHaveBeenCalledTimes(1)
    })

    it('tolerates a corrupt dedup payload by treating it as no views seen', () => {
      // getSeenViews swallows JSON.parse errors and returns []; the view fires.
      window.sessionStorage.setItem(DEDUP_KEY, '{not-valid-json')
      const { trackReleaseView } = useAnalytics()

      trackReleaseView({ releaseSlug: 'mania', pageType: 'listen' })
      expect(gtag).toHaveBeenCalledTimes(1)
    })
  })

  describe('trackPlatformClick()', () => {
    it('fires platform_click with the correct params for a human', () => {
      getOrPersistSourcePlatform.mockReturnValue('telegram')
      const { trackPlatformClick } = useAnalytics()

      trackPlatformClick({
        platformName: 'spotify',
        releaseSlug: 'mania',
        pageType: 'listen'
      })

      expect(gtag).toHaveBeenCalledTimes(1)
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'platform_click',
        expect.objectContaining({
          platform_name: 'spotify',
          release_slug: 'mania',
          page_type: 'listen',
          source_platform: 'telegram'
        })
      )
      // transport_type-as-param was a no-op (not real beacon) and is removed.
      expect(gtag.mock.calls[0][2]).not.toHaveProperty('transport_type')
    })

    it('resolves the returned promise so the pre-save redirect can await delivery', async () => {
      const { trackPlatformClick } = useAnalytics()
      await expect(
        trackPlatformClick({
          platformName: 'distributor',
          releaseSlug: 'alina',
          pageType: 'pre-save'
        })
      ).resolves.toBeUndefined()
      expect(gtag).toHaveBeenCalledTimes(1)
    })

    it('suppresses the conversion event for bot traffic (isLikelyBot → true)', () => {
      isLikelyBot.mockReturnValue(true)
      const { trackPlatformClick } = useAnalytics()

      trackPlatformClick({
        platformName: 'spotify',
        releaseSlug: 'mania',
        pageType: 'listen'
      })

      expect(gtag).not.toHaveBeenCalled()
    })

    it('is NOT deduped — repeated human clicks each fire', () => {
      const { trackPlatformClick } = useAnalytics()
      const args = { platformName: 'apple', releaseSlug: 'mania', pageType: 'pre-save' as const }

      trackPlatformClick(args)
      trackPlatformClick(args)

      expect(gtag).toHaveBeenCalledTimes(2)
    })

    it('carries the page_type through for pre-save clicks', () => {
      const { trackPlatformClick } = useAnalytics()
      trackPlatformClick({
        platformName: 'deezer',
        releaseSlug: 'newsong',
        pageType: 'pre-save'
      })

      const params = gtag.mock.calls[0][2]
      expect(params.page_type).toBe('pre-save')
      expect(params.platform_name).toBe('deezer')
    })
  })
})
