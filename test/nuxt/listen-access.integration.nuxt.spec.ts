// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { generalConfig } from '~/config/general'

// Integration-style companion to listen-access.nuxt.spec.ts (T-04). That file
// mocks isUpcomingRelease/getConfig to exercise branches; this one uses the REAL
// ~/utils/configHelpers (getConfig, isUpcomingRelease) and the REAL hasPreSaveLinks
// under a frozen clock, so a flipped `>`/`>=` or a timezone change in the real
// helper cannot slip through. Only the I/O edges are faked: navigateTo, the locale
// path builder, and the release lookup (one synthetic release at a known instant).

const { navigateTo, getReleaseBySlug } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  getReleaseBySlug: vi.fn()
}))

mockNuxtImport('navigateTo', () => navigateTo)
vi.mock('~/data/musicLibrary', () => ({ getReleaseBySlug }))
vi.mock('#i18n', () => ({ useLocalePath: () => (p: string) => p }))

const mw = (await import('~/middleware/listen-access')).default

// Midnight Kyiv on 30 Oct 2026 (EET, UTC+2).
const RELEASE_AT = '2026-10-29T22:00:00Z'
const T = new Date(RELEASE_AT).getTime()

const release = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  slug: 'song',
  title: 'Song',
  releaseDate: RELEASE_AT,
  musicPlatformLinks: {},
  distributorPreSaveUrl: 'https://example.lnk.to/song',
  ...overrides
})

const run = (query: Record<string, string> = {}, source?: string) =>
  mw({ params: { slug: 'song', ...(source ? { source } : {}) }, query } as any, {} as any)

const originalEnablePreSave = generalConfig.enablePreSave

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  generalConfig.enablePreSave = true
  getReleaseBySlug.mockReturnValue(release())
})

afterEach(() => {
  vi.useRealTimers()
  generalConfig.enablePreSave = originalEnablePreSave
})

describe('listen-access (real configHelpers) around the release instant', () => {
  it('T-1ms: still upcoming → redirects to pre-save (distributor-only counts, B-02)', async () => {
    vi.setSystemTime(T - 1)
    await run()
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/pre-save/song', query: {} },
      { redirectCode: 302 }
    )
  })

  it('T: the page is shown (no redirect) - release day needs no redeploy', async () => {
    vi.setSystemTime(T)
    expect(await run()).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('T+1ms: the page is shown', async () => {
    vi.setSystemTime(T + 1)
    expect(await run()).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('keeps the source prefix and ?c= campaign on the pre-save redirect', async () => {
    vi.setSystemTime(T - 1)
    await run({ c: 'promo-1021' }, 'tt')
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/pre-save/tt/song', query: { c: 'promo-1021' } },
      { redirectCode: 302 }
    )
  })

  it('ignores inherited keys as source prefixes (B-07)', async () => {
    vi.setSystemTime(T - 1)
    await run({}, 'constructor')
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/pre-save/song', query: {} },
      { redirectCode: 302 }
    )
  })

  it('upcoming + pre-save globally off → localized locked page with the Kyiv-day ISO date', async () => {
    generalConfig.enablePreSave = false
    vi.setSystemTime(T - 1)
    await run()
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/404', query: { reason: 'release_locked', date: RELEASE_AT } },
      { replace: true }
    )
  })

  it('upcoming + no pre-save target at all → locked page, even with pre-save on', async () => {
    getReleaseBySlug.mockReturnValue(release({ distributorPreSaveUrl: undefined }))
    vi.setSystemTime(T - 1)
    await run()
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/404', query: { reason: 'release_locked', date: RELEASE_AT } },
      { replace: true }
    )
  })

  it('a date-only release flips at its own instant, not on a timezone-shifted day', async () => {
    getReleaseBySlug.mockReturnValue(release({ releaseDate: '2026-11-01' }))
    const t = new Date('2026-11-01').getTime()
    vi.setSystemTime(t - 1)
    await run()
    expect(navigateTo).toHaveBeenCalledTimes(1)
    navigateTo.mockClear()
    vi.setSystemTime(t)
    await run()
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
