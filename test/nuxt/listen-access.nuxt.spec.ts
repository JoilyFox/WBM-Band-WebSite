// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// listen-access.ts classifies its imports as follows:
//   • AUTO-IMPORTS (mockNuxtImport): navigateTo, useNuxtApp
//   • EXPLICIT IMPORTS (vi.mock): useLocalePath (#i18n), getReleaseBySlug
//     (~/data/musicLibrary), getConfig/isUpcomingRelease/formatReleaseDate
//     (~/utils/configHelpers)
//   • SOURCE_PREFIXES (~/utils/sourceAttribution) is left REAL so the
//     source-prefix branch exercises the genuine prefix table (i, tt, yt, ...).

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
  localePath: vi.fn((p: string) => `/en${p}`)
}))

// NOTE: we deliberately do NOT mock useNuxtApp — replacing it breaks the
// @nuxt/test-utils setupNuxt harness (it calls useRouter().afterEach on the real
// app). Instead we read the real nuxtApp in beforeEach and assign $i18n directly
// to drive the locale-normalization branches.
mockNuxtImport('navigateTo', () => navigateTo)

vi.mock('~/data/musicLibrary', () => ({ getReleaseBySlug }))
vi.mock('~/utils/configHelpers', () => ({ getConfig, isUpcomingRelease, formatReleaseDate }))
vi.mock('#i18n', () => ({ useLocalePath: () => localePath }))

const mw = (await import('~/middleware/listen-access')).default

// Convenience: the middleware only ever reads `to.params`.
const route = (params: Record<string, unknown>, query: Record<string, string> = {}) =>
  ({ params, query }) as any

const released = {
  id: '1',
  slug: 'mania',
  title: 'Mania',
  releaseDate: '2020-01-01',
  preSaveMusicPlatformLinks: { spotify: 'https://spotify.com/x' }
}

const upcomingWithLinks = {
  id: '2',
  slug: 'future',
  title: 'Future',
  releaseDate: '2099-01-01',
  preSaveMusicPlatformLinks: { spotify: 'https://spotify.com/y' }
}

const upcomingNoLinks = {
  id: '3',
  slug: 'soon',
  title: 'Soon',
  releaseDate: '2099-06-01',
  preSaveMusicPlatformLinks: {}
}

beforeEach(() => {
  vi.clearAllMocks()
  // Sensible defaults; each test overrides what it cares about.
  getConfig.mockReturnValue(true)
  isUpcomingRelease.mockReturnValue(false)
  formatReleaseDate.mockReturnValue('June 1, 2026')
  localePath.mockImplementation((p: string) => `/en${p}`)
  // Default locale = 'en' so the 404 branch normalizes to 'en-US' unless a test
  // overrides it via mockUseNuxtAppLocale().
  mockUseNuxtAppLocale('en')
})

// The middleware reads useNuxtApp()?.$i18n?.locale?.value. On the real test-env
// nuxtApp, $i18n is a non-configurable getter but $i18n.locale is a writable ref,
// so we drive the locale-normalization branches by mutating locale.value.
// An empty string makes i18nLocale falsy, exercising the `|| 'en-US'` fallback.
function mockUseNuxtAppLocale(value: string) {
  const nuxtApp = useNuxtApp() as any
  nuxtApp.$i18n.locale.value = value
}

describe('listen-access middleware — slug guard', () => {
  it('returns (pass-through) when no slug param is present', async () => {
    const result = await mw(route({}), {} as any)
    expect(result).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
    expect(getReleaseBySlug).not.toHaveBeenCalled()
  })

  it('returns when slug param is an empty string', async () => {
    const result = await mw(route({ slug: '' }), {} as any)
    expect(result).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
    expect(getReleaseBySlug).not.toHaveBeenCalled()
  })

  it('uses the first element when slug is an array', async () => {
    getReleaseBySlug.mockReturnValue(undefined)
    await mw(route({ slug: ['mania', 'ignored'] }), {} as any)
    expect(getReleaseBySlug).toHaveBeenCalledWith('mania')
  })
})

describe('listen-access middleware — unknown release', () => {
  it('returns (pass-through) when getReleaseBySlug yields undefined', async () => {
    getReleaseBySlug.mockReturnValue(undefined)
    const result = await mw(route({ slug: 'nope' }), {} as any)
    expect(result).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
    expect(isUpcomingRelease).not.toHaveBeenCalled()
  })

  it('returns when getReleaseBySlug yields null', async () => {
    getReleaseBySlug.mockReturnValue(null)
    const result = await mw(route({ slug: 'nope' }), {} as any)
    expect(result).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })
})

describe('listen-access middleware — already released (asymmetry vs presave)', () => {
  it('passes through (stays on listen page) for a past release, never redirecting', async () => {
    getReleaseBySlug.mockReturnValue(released)
    isUpcomingRelease.mockReturnValue(false)
    const result = await mw(route({ slug: 'mania' }), {} as any)
    expect(result).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
    // It must not even reach the config/links checks once released.
    expect(getConfig).not.toHaveBeenCalled()
  })

  it('checks upcoming status using the release releaseDate', async () => {
    getReleaseBySlug.mockReturnValue(released)
    isUpcomingRelease.mockReturnValue(false)
    await mw(route({ slug: 'mania' }), {} as any)
    expect(isUpcomingRelease).toHaveBeenCalledWith('2020-01-01')
  })
})

describe('listen-access middleware — upcoming with pre-save → redirect', () => {
  beforeEach(() => {
    getReleaseBySlug.mockReturnValue(upcomingWithLinks)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)
  })

  it('redirects to the localized /pre-save/<slug> with redirectCode 302 (no source prefix)', async () => {
    await mw(route({ slug: 'future' }), {} as any)
    expect(navigateTo).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/en/pre-save/future', query: {} },
      { redirectCode: 302 }
    )
  })

  it('includes a valid source prefix in the pre-save target', async () => {
    await mw(route({ slug: 'future', source: 'i' }), {} as any)
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/en/pre-save/i/future', query: {} },
      { redirectCode: 302 }
    )
  })

  it('uses the first element when source is an array', async () => {
    await mw(route({ slug: 'future', source: ['tt', 'x'] }), {} as any)
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/en/pre-save/tt/future', query: {} },
      { redirectCode: 302 }
    )
  })

  it('ignores an unrecognised source prefix (falls back to prefix-less target)', async () => {
    await mw(route({ slug: 'future', source: 'bogus' }), {} as any)
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/en/pre-save/future', query: {} },
      { redirectCode: 302 }
    )
  })

  it('passes the target through useLocalePath before navigating', async () => {
    localePath.mockImplementation((p: string) => `/ua${p}`)
    await mw(route({ slug: 'future' }), {} as any)
    expect(localePath).toHaveBeenCalledWith('/pre-save/future')
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/ua/pre-save/future', query: {} },
      { redirectCode: 302 }
    )
  })

  it('carries the promo-campaign query across the redirect', async () => {
    // Without this the `?c=` id is lost on the listen → pre-save bounce and the
    // whole visit reports as untagged.
    await mw(route({ slug: 'future', source: 'i' }, { c: 'khvyli-promo-0821' }), {} as any)
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/en/pre-save/i/future', query: { c: 'khvyli-promo-0821' } },
      { redirectCode: 302 }
    )
  })

  it('reads the enablePreSave flag from config with a false fallback', async () => {
    await mw(route({ slug: 'future' }), {} as any)
    expect(getConfig).toHaveBeenCalledWith('general.enablePreSave', { fallback: false })
  })
})

describe('listen-access middleware — upcoming but no redirect → 404', () => {
  it('404s when enablePreSave is false even if links exist', async () => {
    getReleaseBySlug.mockReturnValue(upcomingWithLinks)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(false)
    formatReleaseDate.mockReturnValue('January 1, 2099')

    await mw(route({ slug: 'future' }), {} as any)
    expect(navigateTo).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith(
      {
        path: '/404',
        query: {
          title: 'Release Not Available',
          message: 'This track unlocks on January 1, 2099. Please check back soon.',
          buttonText: 'Go to Home',
          buttonLink: '/',
          buttonIcon: 'pi pi-home'
        }
      },
      { replace: true }
    )
  })

  it('404s when enablePreSave is true but there are no pre-save links (empty object)', async () => {
    getReleaseBySlug.mockReturnValue(upcomingNoLinks)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)

    await mw(route({ slug: 'soon' }), {} as any)
    expect(navigateTo).toHaveBeenCalledTimes(1)
    const arg = navigateTo.mock.calls[0][0]
    expect(arg.path).toBe('/404')
    expect(arg.query.title).toBe('Release Not Available')
    expect(navigateTo.mock.calls[0][1]).toEqual({ replace: true })
  })

  it('404s when preSaveMusicPlatformLinks is undefined', async () => {
    getReleaseBySlug.mockReturnValue({
      id: '4',
      slug: 'nolinks',
      title: 'NoLinks',
      releaseDate: '2099-12-01'
    })
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)

    await mw(route({ slug: 'nolinks' }), {} as any)
    expect(navigateTo).toHaveBeenCalledWith(expect.objectContaining({ path: '/404' }), {
      replace: true
    })
  })

  it('404s when all pre-save link values are falsy', async () => {
    getReleaseBySlug.mockReturnValue({
      id: '5',
      slug: 'falsy',
      title: 'Falsy',
      releaseDate: '2099-12-01',
      preSaveMusicPlatformLinks: { spotify: '', appleMusic: undefined }
    })
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)

    await mw(route({ slug: 'falsy' }), {} as any)
    expect(navigateTo).toHaveBeenCalledWith(expect.objectContaining({ path: '/404' }), {
      replace: true
    })
  })

  it('does NOT treat distributorPreSaveUrl as a valid pre-save link (listen asymmetry)', async () => {
    // Unlike presave-access, listen-access ignores distributorPreSaveUrl when
    // deciding whether to redirect, so a distributor-only upcoming release 404s.
    getReleaseBySlug.mockReturnValue({
      id: '6',
      slug: 'dist',
      title: 'Dist',
      releaseDate: '2099-12-01',
      preSaveMusicPlatformLinks: {},
      distributorPreSaveUrl: 'https://distrokid.com/x'
    })
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)

    await mw(route({ slug: 'dist' }), {} as any)
    expect(navigateTo).toHaveBeenCalledWith(expect.objectContaining({ path: '/404' }), {
      replace: true
    })
  })

  it('formats the unlock date using the localized message', async () => {
    getReleaseBySlug.mockReturnValue(upcomingNoLinks)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)
    formatReleaseDate.mockReturnValue('the future')

    await mw(route({ slug: 'soon' }), {} as any)
    expect(formatReleaseDate).toHaveBeenCalledWith('2099-06-01', 'en-US')
    const arg = navigateTo.mock.calls[0][0]
    expect(arg.query.message).toBe('This track unlocks on the future. Please check back soon.')
  })
})

describe('listen-access middleware — locale normalization for the 404 path', () => {
  const upcoming404 = {
    id: '7',
    slug: 'loc',
    title: 'Loc',
    releaseDate: '2099-06-01',
    preSaveMusicPlatformLinks: {}
  }

  beforeEach(() => {
    getReleaseBySlug.mockReturnValue(upcoming404)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)
  })

  it("maps i18n locale 'ua' to 'uk-UA'", async () => {
    mockUseNuxtAppLocale('ua')
    await mw(route({ slug: 'loc' }), {} as any)
    expect(formatReleaseDate).toHaveBeenCalledWith('2099-06-01', 'uk-UA')
  })

  it("maps i18n locale 'en' to 'en-US'", async () => {
    mockUseNuxtAppLocale('en')
    await mw(route({ slug: 'loc' }), {} as any)
    expect(formatReleaseDate).toHaveBeenCalledWith('2099-06-01', 'en-US')
  })

  it('passes through any other locale verbatim', async () => {
    mockUseNuxtAppLocale('de')
    await mw(route({ slug: 'loc' }), {} as any)
    expect(formatReleaseDate).toHaveBeenCalledWith('2099-06-01', 'de')
  })

  it("falls back to 'en-US' when the i18n locale is empty/falsy", async () => {
    mockUseNuxtAppLocale('')
    await mw(route({ slug: 'loc' }), {} as any)
    expect(formatReleaseDate).toHaveBeenCalledWith('2099-06-01', 'en-US')
  })
})
