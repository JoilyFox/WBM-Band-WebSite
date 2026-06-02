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
// each middleware ONCE at top level and `mockClear()` in beforeEach so those
// boot-time calls never pollute a per-test assertion. (Verified empirically: a
// single bare-'/' invocation then yields exactly one navigateTo call.)
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
const rootRedirect = (await import('~/middleware/i18n-root-redirect.global')).default
const shareRedirect = (await import('~/middleware/redirect-share-urls.global')).default

// Tiny helpers to build the route-location-ish objects the middlewares read.
const route = (path: string) => ({ path }) as any
const callRoot = (path: string) => (rootRedirect as any)(route(path), route('/'))
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

describe('i18n-root-redirect.global middleware', () => {
  it('exports a callable handler (defineNuxtRouteMiddleware unwrapped)', () => {
    expect(typeof rootRedirect).toBe('function')
  })

  describe('bare "/" on the client', () => {
    it('redirects to the localized home via navigateTo with { replace: true }', async () => {
      await callRoot('/')
      expect(navigateTo).toHaveBeenCalledTimes(1)
      expect(navigateTo).toHaveBeenCalledWith('/ua', { replace: true })
    })

    it('resolves the target through useLocalePath("/")', async () => {
      await callRoot('/')
      expect(localePathImpl).toHaveBeenCalledTimes(1)
      expect(localePathImpl).toHaveBeenCalledWith('/')
    })

    it('forwards exactly what useLocalePath returns (no hardcoded prefix)', async () => {
      localePathImpl.mockReturnValueOnce('/custom-home')
      await callRoot('/')
      expect(navigateTo).toHaveBeenCalledWith('/custom-home', { replace: true })
    })

    it('returns the navigateTo result so Nuxt aborts the original navigation', async () => {
      const sentinel = Symbol('redirect')
      navigateTo.mockReturnValueOnce(sentinel as any)
      const result = await callRoot('/')
      expect(result).toBe(sentinel)
    })
  })

  describe('non-"/" paths short-circuit with no redirect', () => {
    it.each([
      ['/ua', 'localized home'],
      ['/en', 'localized home (en)'],
      ['/ua/about', 'localized inner page'],
      ['/en/listen/mania', 'localized listen page'],
      ['/pre-save/mania', 'non-localized share URL'],
      ['', 'empty path'],
      ['//', 'double slash (not exactly "/")'],
      ['/ ', 'slash + space']
    ])('does not redirect for %s (%s)', async (path) => {
      const result = await callRoot(path)
      expect(navigateTo).not.toHaveBeenCalled()
      expect(localePathImpl).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })
})
