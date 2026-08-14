// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ---------------------------------------------------------------------------
// Dependency classification (read the middleware import lines first):
//   • navigateTo, defineNuxtRouteMiddleware → AUTO-IMPORTS → mockNuxtImport.
//     `defineNuxtRouteMiddleware` is left REAL (it just returns the handler), so
//     the exported default is the bare handler we can invoke directly.
//   • useLocalePath → EXPLICIT import from '#i18n' → vi.mock.
//
// `navigateTo` is a SHARED mock that Nuxt's own route/i18n middleware also call
// while the app boots during the dynamic `import()` below. We therefore import
// the middleware ONCE at top level and `mockClear()` in beforeEach so those
// boot-time calls never pollute a per-test assertion.
//
// The former `i18n-root-redirect.global` suite lived here too. That middleware
// was DELETED (2026-08) because it made Googlebot render the English home at
// `/`; see docs/search-console.md. Bare `/` now serves the Ukrainian build
// output directly, with no client-side locale bounce.
// ---------------------------------------------------------------------------

const { navigateTo, localePathImpl } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  // Mirrors the real default-locale ('ua') prefix strategy closely enough for
  // assertions: '/' → '/ua', '/x' → '/ua/x'. The exact return is what the
  // middleware forwards to navigateTo, and we assert against this same impl.
  localePathImpl: vi.fn((p: string) => `/ua${p === '/' ? '' : p}`)
}))

mockNuxtImport('navigateTo', () => navigateTo)

vi.mock('#i18n', () => ({
  useLocalePath: () => localePathImpl
}))

// Imported once; see isolation note above.
const shareRedirect = (await import('~/middleware/redirect-share-urls.global')).default

// Tiny helper to build the route-location-ish objects the middleware reads.
const route = (path: string) => ({ path }) as any
const callShare = (path: string) => (shareRedirect as any)(route(path), route('/'))

beforeEach(() => {
  navigateTo.mockClear()
  localePathImpl.mockClear()
})

describe('redirect-share-urls.global middleware (regression: must stay INERT)', () => {
  it('exports a callable handler (defineNuxtRouteMiddleware unwrapped)', () => {
    expect(typeof shareRedirect).toBe('function')
  })

  it('does NOT redirect a non-localized /pre-save/ share URL', async () => {
    const result = await callShare('/pre-save/mania')
    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does NOT redirect a non-localized /listen/ share URL', async () => {
    const result = await callShare('/listen/i/mania')
    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does NOT consult useLocalePath for any path (early return before it)', async () => {
    await callShare('/pre-save/some-slug')
    await callShare('/listen/some-slug')
    expect(localePathImpl).not.toHaveBeenCalled()
  })

  it('stays inert for already-localized, root, and arbitrary paths too', async () => {
    const paths = ['/ua/pre-save/mania', '/en/listen/mania', '/', '/en/about', '/anything/else', '']
    for (const p of paths) {
      const result = await callShare(p)
      expect(result).toBeUndefined()
    }
    // Across every input above, navigateTo is never invoked — the guard so this
    // middleware is never silently re-enabled (server-side .htaccess owns it).
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
