// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// listen-access.ts classifies its imports as follows:
//   • AUTO-IMPORTS (mockNuxtImport): navigateTo
//   • EXPLICIT IMPORTS (vi.mock): useLocalePath (#i18n), getReleaseBySlug
//     (~/data/musicLibrary), getConfig/isUpcomingRelease (~/utils/configHelpers)
//     — branch logic only; the REAL date boundaries are covered by
//     listen-access.integration.nuxt.spec.ts.
//   • SOURCE_PREFIXES (~/utils/sourceAttribution) is left REAL so the
//     source-prefix branch exercises the genuine prefix table (i, tt, yt, ...).

const { navigateTo, getReleaseBySlug, getConfig, isUpcomingRelease, localePath } = vi.hoisted(
  () => ({
    navigateTo: vi.fn(),
    getReleaseBySlug: vi.fn(),
    getConfig: vi.fn(),
    isUpcomingRelease: vi.fn(),
    localePath: vi.fn((p: string) => `/en${p}`)
  })
)

mockNuxtImport('navigateTo', () => navigateTo)

vi.mock('~/data/musicLibrary', () => ({ getReleaseBySlug }))
vi.mock('~/utils/configHelpers', () => ({ getConfig, isUpcomingRelease }))
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
  localePath.mockImplementation((p: string) => `/en${p}`)
})

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

describe('listen-access middleware — already released', () => {
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

describe('listen-access middleware — upcoming but no redirect → localized locked page', () => {
  const locked = (date: string) => [
    { path: '/en/404', query: { reason: 'release_locked', date } },
    { replace: true }
  ]

  it('locks when enablePreSave is false even if links exist', async () => {
    getReleaseBySlug.mockReturnValue(upcomingWithLinks)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(false)

    await mw(route({ slug: 'future' }), {} as any)
    expect(navigateTo).toHaveBeenCalledTimes(1)
    // A reason CODE + ISO date, not English prose: ErrorPage localizes it.
    expect(navigateTo.mock.calls[0]).toEqual(locked('2099-01-01'))
  })

  it('builds the locked page through useLocalePath (EN visitors stay on /en)', async () => {
    getReleaseBySlug.mockReturnValue(upcomingNoLinks)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)
    localePath.mockImplementation((p: string) => `/ua${p}`)

    await mw(route({ slug: 'soon' }), {} as any)
    expect(localePath).toHaveBeenCalledWith('/404')
    expect(navigateTo.mock.calls[0][0].path).toBe('/ua/404')
  })

  it('locks when enablePreSave is true but there are no pre-save links (empty object)', async () => {
    getReleaseBySlug.mockReturnValue(upcomingNoLinks)
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)

    await mw(route({ slug: 'soon' }), {} as any)
    expect(navigateTo).toHaveBeenCalledTimes(1)
    expect(navigateTo.mock.calls[0]).toEqual(locked('2099-06-01'))
  })

  it('locks when preSaveMusicPlatformLinks is undefined', async () => {
    getReleaseBySlug.mockReturnValue({
      id: '4',
      slug: 'nolinks',
      title: 'NoLinks',
      releaseDate: '2099-12-01'
    })
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)

    await mw(route({ slug: 'nolinks' }), {} as any)
    expect(navigateTo.mock.calls[0]).toEqual(locked('2099-12-01'))
  })

  it('locks when all pre-save link values are falsy', async () => {
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
    expect(navigateTo.mock.calls[0]).toEqual(locked('2099-12-01'))
  })

  it('does not crash for an undated (TBA) upcoming release', async () => {
    getReleaseBySlug.mockReturnValue({ id: '8', slug: 'tba', title: 'TBA' })
    isUpcomingRelease.mockReturnValue(true)
    getConfig.mockReturnValue(true)

    await mw(route({ slug: 'tba' }), {} as any)
    expect(navigateTo.mock.calls[0]).toEqual([
      { path: '/en/404', query: { reason: 'release_locked' } },
      { replace: true }
    ])
  })
})

describe('listen-access middleware — distributor-only pre-save (B-02 symmetry)', () => {
  it('treats distributorPreSaveUrl as a valid pre-save target, like presave-access does', async () => {
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
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/en/pre-save/dist', query: {} },
      { redirectCode: 302 }
    )
  })
})

describe('listen-access middleware — source prefix lookup is own-property only (B-07)', () => {
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'does not treat the inherited key %s as a source prefix',
    async (bogus) => {
      getReleaseBySlug.mockReturnValue(upcomingWithLinks)
      isUpcomingRelease.mockReturnValue(true)
      getConfig.mockReturnValue(true)

      await mw(route({ slug: 'future', source: bogus }), {} as any)
      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/en/pre-save/future', query: {} },
        { redirectCode: 302 }
      )
    }
  )
})
