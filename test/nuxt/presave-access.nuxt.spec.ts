// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// presave-access middleware dependency classification:
//   AUTO-IMPORTS  → navigateTo (mockNuxtImport). useNuxtApp / defineNuxtRouteMiddleware are
//                   left REAL — @nuxt/test-utils relies on useNuxtApp during its own bootstrap,
//                   so we override only the real app's `$i18n` per test instead of mocking it.
//   EXPLICIT      → useLocalePath (#i18n), getReleaseBySlug (~/data/musicLibrary),
//                   getConfig/isUpcomingRelease/formatReleaseDate (~/utils/configHelpers) → vi.mock
//   REAL          → SOURCE_PREFIXES (pure const, drives the source-prefix branch)

const {
  navigateTo,
  getReleaseBySlug,
  getConfig,
  isUpcomingRelease,
  formatReleaseDate,
  localePath
} = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  getReleaseBySlug: vi.fn(),
  getConfig: vi.fn(),
  isUpcomingRelease: vi.fn(),
  formatReleaseDate: vi.fn(() => 'June 1, 2026'),
  localePath: vi.fn((p: string) => p)
}))

mockNuxtImport('navigateTo', () => navigateTo)

vi.mock('#i18n', () => ({ useLocalePath: () => localePath }))
vi.mock('~/data/musicLibrary', () => ({ getReleaseBySlug }))
vi.mock('~/utils/configHelpers', () => ({ getConfig, isUpcomingRelease, formatReleaseDate }))

const mw = (await import('~/middleware/presave-access')).default

// Override the locale on the REAL nuxt app instance for a single test.
// useNuxtApp() is only valid inside a test/hook (an instance exists then). The
// real $i18n is a getter-only property (can't be reassigned), but $i18n.locale
// is a writable Vue ref — so we mutate locale.value and restore it in beforeEach.
let originalLocale: unknown
let captured = false
function setLocale(value: unknown) {
  const app = useNuxtApp() as any
  if (!captured) {
    originalLocale = app.$i18n.locale.value
    captured = true
  }
  app.$i18n.locale.value = value
}

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
  formatReleaseDate.mockReturnValue('June 1, 2026')
  localePath.mockImplementation((p: string) => p)
  // Restore the harness's real locale so a prior setLocale() override doesn't
  // leak. Default real locale is 'en' → formatter sees 'en-US'.
  if (captured) {
    ;(useNuxtApp() as any).$i18n.locale.value = originalLocale
  }
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

  describe('(c) pre-save globally disabled → 404 Pre-save Disabled', () => {
    it('redirects to /404 with replace when enablePreSave is false', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      getConfig.mockReturnValue(false)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(getConfig).toHaveBeenCalledWith('general.enablePreSave', { fallback: false })
      expect(navigateTo).toHaveBeenCalledTimes(1)
      expect(navigateTo).toHaveBeenCalledWith(
        {
          path: '/404',
          query: {
            title: 'Pre-save Disabled',
            message: 'Pre-save access is currently turned off for this release.',
            buttonText: 'Go to Home',
            buttonLink: '/',
            buttonIcon: 'pi pi-home'
          }
        },
        { replace: true }
      )
      // short-circuits before the upcoming check
      expect(isUpcomingRelease).not.toHaveBeenCalled()
    })

    it('treats a falsy non-boolean config (null) as disabled', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      getConfig.mockReturnValue(null)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/404',
          query: expect.objectContaining({ title: 'Pre-save Disabled' })
        }),
        { replace: true }
      )
    })

    it('treats a truthy non-boolean config (1) as enabled and continues', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      getConfig.mockReturnValue(1 as any)
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      // does NOT hit the disabled 404
      expect(navigateTo).not.toHaveBeenCalled()
      expect(isUpcomingRelease).toHaveBeenCalled()
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
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania', { redirectCode: 302 })
    })

    it('includes a valid source prefix in the listen target', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(false)
      // 'i' is a real SOURCE_PREFIXES key (instagram) — left unmocked
      await mw({ params: { slug: 'mania', source: 'i' } } as any, {} as any)
      expect(localePath).toHaveBeenCalledWith('/listen/i/mania')
      expect(navigateTo).toHaveBeenCalledWith('/listen/i/mania', { redirectCode: 302 })
    })

    it('ignores an unrecognized source prefix and omits it from the target', async () => {
      getReleaseBySlug.mockReturnValue(makeRelease())
      isUpcomingRelease.mockReturnValue(false)
      await mw({ params: { slug: 'mania', source: 'bogus' } } as any, {} as any)
      expect(localePath).toHaveBeenCalledWith('/listen/mania')
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania', { redirectCode: 302 })
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
      expect(navigateTo).toHaveBeenCalledWith('/en/listen/mania', { redirectCode: 302 })
    })
  })

  describe('(e) upcoming but no pre-save links → 404 Pre-save Not Ready', () => {
    it('redirects to /404 when both preSaveMusicPlatformLinks and distributor URL are absent', async () => {
      getReleaseBySlug.mockReturnValue(
        makeRelease({ preSaveMusicPlatformLinks: undefined, distributorPreSaveUrl: undefined })
      )
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      // No locale is set here, so this is the app's real default: 'ua' → 'uk-UA'.
      // (It used to read 'en-US' because browser-language detection booted the
      // suite in English; that detection is off now — docs/search-console.md.)
      expect(formatReleaseDate).toHaveBeenCalledWith('2026-07-01', 'uk-UA')
      expect(navigateTo).toHaveBeenCalledTimes(1)
      expect(navigateTo).toHaveBeenCalledWith(
        {
          path: '/404',
          query: {
            title: 'Pre-save Not Ready',
            message:
              'Pre-save links for this release are not configured yet. Please try again closer to June 1, 2026.',
            buttonText: 'Go to Home',
            buttonLink: '/',
            buttonIcon: 'pi pi-home'
          }
        },
        { replace: true }
      )
    })

    it('treats a preSaveMusicPlatformLinks object with only falsy values as no links', async () => {
      getReleaseBySlug.mockReturnValue(
        makeRelease({ preSaveMusicPlatformLinks: { spotify: '', appleMusic: undefined } })
      )
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/404',
          query: expect.objectContaining({ title: 'Pre-save Not Ready' })
        }),
        { replace: true }
      )
    })

    it("uses 'TBA' in the message when the release has no releaseDate", async () => {
      getReleaseBySlug.mockReturnValue(
        makeRelease({ releaseDate: undefined, preSaveMusicPlatformLinks: undefined })
      )
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(formatReleaseDate).not.toHaveBeenCalled()
      expect(navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            message:
              'Pre-save links for this release are not configured yet. Please try again closer to TBA.'
          })
        }),
        { replace: true }
      )
    })

    it("maps i18n locale 'ua' to 'uk-UA' when formatting the date", async () => {
      setLocale('ua')
      getReleaseBySlug.mockReturnValue(makeRelease({ preSaveMusicPlatformLinks: undefined }))
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(formatReleaseDate).toHaveBeenCalledWith('2026-07-01', 'uk-UA')
    })

    it('passes an unrecognized i18n locale straight through to the formatter', async () => {
      setLocale('de')
      getReleaseBySlug.mockReturnValue(makeRelease({ preSaveMusicPlatformLinks: undefined }))
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(formatReleaseDate).toHaveBeenCalledWith('2026-07-01', 'de')
    })

    it("falls back to 'en-US' when the i18n locale value is missing", async () => {
      setLocale(undefined)
      getReleaseBySlug.mockReturnValue(makeRelease({ preSaveMusicPlatformLinks: undefined }))
      isUpcomingRelease.mockReturnValue(true)
      await mw({ params: { slug: 'mania' } } as any, {} as any)
      expect(formatReleaseDate).toHaveBeenCalledWith('2026-07-01', 'en-US')
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
