// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// presave-access middleware dependency classification:
//   AUTO-IMPORTS  → navigateTo (mockNuxtImport). useNuxtApp / defineNuxtRouteMiddleware are
//                   left REAL — @nuxt/test-utils relies on useNuxtApp during its own bootstrap,
//                   so we override only the real app's `$i18n` per test instead of mocking it.
//   EXPLICIT      → useLocalePath (#i18n), getReleaseBySlug (~/data/musicLibrary),
//                   getConfig/isUpcomingRelease (~/utils/configHelpers) → vi.mock
//                   (branch logic only; REAL date boundaries: middleware-integration.nuxt.spec.ts)
//   REAL          → SOURCE_PREFIXES (pure const, drives the source-prefix branch)

const { navigateTo, getReleaseBySlug, getConfig, isUpcomingRelease, localePath } = vi.hoisted(
  () => ({
    navigateTo: vi.fn(),
    getReleaseBySlug: vi.fn(),
    getConfig: vi.fn(),
    isUpcomingRelease: vi.fn(),
    localePath: vi.fn((p: string) => p)
  })
)

mockNuxtImport('navigateTo', () => navigateTo)

vi.mock('#i18n', () => ({ useLocalePath: () => localePath }))
vi.mock('~/data/musicLibrary', () => ({ getReleaseBySlug }))
vi.mock('~/utils/configHelpers', () => ({ getConfig, isUpcomingRelease }))

const mw = (await import('~/middleware/presave-access')).default

// A realistic upcoming release with working pre-save links.
function makeRelease(overrides: Record<string, any> = {}) {
  return {
    id: 'rel-1',
    slug: 'mania',
    title: 'Mania',
    type: 'single',
    releaseDate: '2026-07-01',
    imageUrl: '/images/mania.jpg',
    musicPlatformLinks: { spotify: 'https://open.spotify.com/track/abc' },
    preSaveMusicPlatformLinks: { spotify: 'https://presave.spotify.com/abc' },
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Defaults: presave enabled, release upcoming, formatter stable, identity locale path.
  getConfig.mockReturnValue(true)
  isUpcomingRelease.mockReturnValue(true)
  localePath.mockImplementation((p: string) => p)
})

describe('presave-access middleware', () => {
  describe('(a) missing slug → pass-through', () => {
    it('returns undefined and does not navigate when slug is absent', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      const result = await mw({ params: {} } as any, {} as any)
      expect(result).toBeUndefined()
      expect(navigateTo).not.toHaveBeenCalled()
      expect(getReleaseBySlug).not.toHaveBeenCalled()
    })

    it('returns undefined when params object itself is missing', async () => {
      const result = await mw({} as any, {} as any)
      expect(result).toBeUndefined()
      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('returns undefined when slug is an empty string', async () => {
      const result = await mw({ params: { slug: '' } } as any, {} as any)
      expect(result).toBeUndefined()
      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('uses the first element when slug is an array', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      await mw({ params: { slug: ['mania', 'ignored'] } } as any, {} as any)
      expect(getReleaseBySlug).toHaveBeenCalledWith('mania')
    })
  })

  describe('(b) unknown release → pass-through', () => {
    it('returns undefined and does not navigate when release is undefined', async () => {
      getReleaseBySlug.mockReturnValue(undefined)
      const result = await mw({ params: { slug: 'nope' } } as any, {} as any)
      expect(result).toBeUndefined()
      expect(navigateTo).not.toHaveBeenCalled()
      expect(getReleaseBySlug).toHaveBeenCalledWith('nope')
      // never reaches the config gate
      expect(getConfig).not.toHaveBeenCalled()
    })
  })

  describe('(c) pre-save globally disabled → localized "Pre-save Disabled" page', () => {
    it('sends an UPCOMING release to the localized locked page when enablePreSave is false', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      getConfig.mockReturnValue(false)
      isUpcomingRelease.mockReturnValue(true)
      localePath.mockImplementation((p: string) => `/en${p}`)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(getConfig).toHaveBeenCalledWith('general.enablePreSave', { fallback: false })
      expect(navigateTo).toHaveBeenCalledTimes(1)
      // A reason CODE, not English prose: ErrorPage localizes it.
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/en/404', query: { reason: 'presave_disabled' } },
        { replace: true }
      )
    })

    it('treats a falsy non-boolean config (null) as disabled', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      getConfig.mockReturnValue(null)
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({ query: { reason: 'presave_disabled' } }),
        { replace: true }
      )
    })

    it('treats a truthy non-boolean config (1) as enabled and continues', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      getConfig.mockReturnValue(1 as any)
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      // does NOT hit the disabled page
      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('B-03: a RELEASED track still forwards to /listen when pre-save is globally off', async () => {
      // Old QR codes / stories / emails must keep working after the campaign ends.
      getReleaseBySlug.mockReturnValue(makeRelease({ releaseDate: '2020-01-01' }))
      getConfig.mockReturnValue(false)
      isUpcomingRelease.mockReturnValue(false)
      await mw(
        { params: { slug: 'mania', source: 'i' }, query: { c: 'promo-1' } } as any,
        {} as any
      )
      expect(navigateTo).toHaveBeenCalledTimes(1)
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/listen/i/mania', query: { c: 'promo-1' } },
        { redirectCode: 302 }
      )
    })
  })

  describe('(d) already released → 302 redirect to /listen', () => {
    it('redirects to localePath(/listen/<slug>) with 302 when not upcoming', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease({ releaseDate: '2020-01-01' }))
      isUpcomingRelease.mockReturnValue(false)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(isUpcomingRelease).toHaveBeenCalledWith('2020-01-01')
      expect(localePath).toHaveBeenCalledWith('/listen/mania')
      expect(navigateTo).toHaveBeenCalledTimes(1)
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/listen/mania', query: {} },
        { redirectCode: 302 }
      )
    })

    it('includes a valid source prefix in the listen target', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(false)
      // 'i' is a real SOURCE_PREFIXES key (instagram) — left unmocked
      await mw({ params: { slug: 'mania', source: 'i' } } as any, {} as any)
      expect(localePath).toHaveBeenCalledWith('/listen/i/mania')
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/listen/i/mania', query: {} },
        { redirectCode: 302 }
      )
    })

    it('ignores an unrecognized source prefix and omits it from the target', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(false)
      await mw({ params: { slug: 'mania', source: 'bogus' } } as any, {} as any)
      expect(localePath).toHaveBeenCalledWith('/listen/mania')
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/listen/mania', query: {} },
        { redirectCode: 302 }
      )
    })

    it('uses the first element when source is an array', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(false)
      await mw({ params: { slug: 'mania', source: ['tt', 'extra'] } } as any, {} as any)
      expect(localePath).toHaveBeenCalledWith('/listen/tt/mania')
    })

    it('honours a non-identity localePath when building the redirect', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(false)
      localePath.mockImplementation((p: string) => `/en${p}`)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/en/listen/mania', query: {} },
        { redirectCode: 302 }
      )
    })

    it('carries the promo-campaign query across the redirect', async () => {
      // Without this the `?c=` id is lost on the pre-save → listen bounce that
      // happens on release day, and the whole visit reports as untagged.
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(false)
      await mw(
        { params: { slug: 'mania', source: 'i' }, query: { c: 'mania-promo-0821' } } as any,
        {} as any
      )
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/listen/i/mania', query: { c: 'mania-promo-0821' } },
        { redirectCode: 302 }
      )
    })
  })

  describe('(e) upcoming but no pre-save links → localized "Pre-save Not Ready" page', () => {
    const notReady = (date?: string) => [
      { path: '/404', query: { reason: 'presave_not_ready', ...(date ? { date } : {}) } },
      { replace: true }
    ]

    it('sends the visitor to the locked page when both preSaveMusicPlatformLinks and distributor URL are absent', async () => {
      getReleaseBySlug.mockReturnValue(
        makeRelease({ preSaveMusicPlatformLinks: undefined, distributorPreSaveUrl: undefined })
      )
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo).toHaveBeenCalledTimes(1)
      // ISO date goes in the query; ErrorPage formats it (Kyiv zone, active locale).
      expect(navigateTo.mock.calls[0]).toEqual(notReady('2026-07-01'))
    })

    it('treats a preSaveMusicPlatformLinks object with only falsy values as no links', async () => {
      getReleaseBySlug.mockReturnValue(
        makeRelease({ preSaveMusicPlatformLinks: { spotify: '', appleMusic: undefined } })
      )
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo.mock.calls[0]).toEqual(notReady('2026-07-01'))
    })

    it('omits the date for an undated (TBA) release', async () => {
      getReleaseBySlug.mockReturnValue(
        makeRelease({ releaseDate: undefined, preSaveMusicPlatformLinks: undefined })
      )
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo.mock.calls[0]).toEqual(notReady())
    })
  })

  describe('happy path → no navigation', () => {
    it('lets an upcoming release with a spotify pre-save link through untouched', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(true)
      const result = await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(result).toBeUndefined()
      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('lets an upcoming release through when only a distributorPreSaveUrl is present', async () => {
      getReleaseBySlug.mockReturnValue(
        makeRelease({
          preSaveMusicPlatformLinks: undefined,
          distributorPreSaveUrl: 'https://distrokid.com/presave/abc'
        })
      )
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo).not.toHaveBeenCalled()
    })
  })
})
