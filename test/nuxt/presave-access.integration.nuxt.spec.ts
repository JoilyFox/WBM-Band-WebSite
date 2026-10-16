// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { generalConfig } from '~/config/general'

// Integration-style companion to presave-access.nuxt.spec.ts (T-04): REAL
// ~/utils/configHelpers + REAL hasPreSaveLinks under a frozen clock, checking the
// T-1ms / T / T+1ms boundary and the B-03 ordering (released → /listen BEFORE the
// global enablePreSave flag).

const { navigateTo, getReleaseBySlug } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  getReleaseBySlug: vi.fn()
}))

mockNuxtImport('navigateTo', () => navigateTo)
vi.mock('~/data/musicLibrary', () => ({ getReleaseBySlug }))
vi.mock('#i18n', () => ({ useLocalePath: () => (p: string) => p }))

const mw = (await import('~/middleware/presave-access')).default

const RELEASE_AT = '2026-10-29T22:00:00Z'
const T = new Date(RELEASE_AT).getTime()

const release = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  slug: 'song',
  title: 'Song',
  releaseDate: RELEASE_AT,
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

describe('presave-access (real configHelpers) around the release instant', () => {
  it('T-1ms: still upcoming → the pre-save page is allowed', async () => {
    vi.setSystemTime(T - 1)
    expect(await run()).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('T: released → forwards to /listen (302)', async () => {
    vi.setSystemTime(T)
    await run()
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/listen/song', query: {} },
      { redirectCode: 302 }
    )
  })

  it('T+1ms: released → forwards to /listen, keeping source + ?c=', async () => {
    vi.setSystemTime(T + 1)
    await run({ c: 'promo-1021' }, 'i')
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/listen/i/song', query: { c: 'promo-1021' } },
      { redirectCode: 302 }
    )
  })

  it('B-03: released + pre-save globally OFF still forwards to /listen (old QR codes)', async () => {
    generalConfig.enablePreSave = false
    vi.setSystemTime(T + 1)
    await run({ c: 'qr-1' })
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/listen/song', query: { c: 'qr-1' } },
      { redirectCode: 302 }
    )
  })

  it('upcoming + pre-save globally OFF → localized "disabled" page', async () => {
    generalConfig.enablePreSave = false
    vi.setSystemTime(T - 1)
    await run()
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/404', query: { reason: 'presave_disabled' } },
      { replace: true }
    )
  })

  it('upcoming + nothing to pre-save to → localized "not ready" page with the ISO date', async () => {
    getReleaseBySlug.mockReturnValue(release({ distributorPreSaveUrl: undefined }))
    vi.setSystemTime(T - 1)
    await run()
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/404', query: { reason: 'presave_not_ready', date: RELEASE_AT } },
      { replace: true }
    )
  })

  it('ignores inherited keys as source prefixes (B-07)', async () => {
    vi.setSystemTime(T + 1)
    await run({}, '__proto__')
    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/listen/song', query: {} },
      { redirectCode: 302 }
    )
  })
})
