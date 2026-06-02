// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// useAssetUrl reads `useRuntimeConfig().app.baseURL` once, at the moment the
// composable is invoked, and closes over it. useRuntimeConfig is a Nuxt
// AUTO-IMPORT inside the composable, so we re-mock it with mockNuxtImport and
// back it with a hoisted, mutable ref. Flipping `baseURLRef.value` then calling
// useAssetUrl() AGAIN yields a resolver bound to the new base — this is how we
// drive both the `/` pass-through branch (the real default in this env) and the
// subdirectory prefixing branch (e.g. GitHub Pages `/WBM-Band-WebSite/`).
const { baseURLRef } = vi.hoisted(() => ({ baseURLRef: { value: '/' } }))

mockNuxtImport('useRuntimeConfig', () => () => ({ app: { baseURL: baseURLRef.value } }))

// Build a resolver pinned to a given baseURL. We import the source module fresh
// each time and call the composable AFTER setting the ref, because baseURL is
// captured at composable-creation time (not per resolveUrl call).
async function makeResolver(baseURL: string) {
  baseURLRef.value = baseURL
  const { useAssetUrl } = await import('~/composables/useAssetUrl')
  return useAssetUrl()
}

beforeEach(() => {
  // Restore the real-world default so every test is order-independent.
  baseURLRef.value = '/'
})

describe('useAssetUrl', () => {
  describe('shape', () => {
    it('exposes resolveUrl and resolveSrcSet functions', async () => {
      const { resolveUrl, resolveSrcSet } = await makeResolver('/')
      expect(typeof resolveUrl).toBe('function')
      expect(typeof resolveSrcSet).toBe('function')
    })
  })

  describe('resolveUrl — guard clauses (base-independent)', () => {
    // The early guards run before the baseURL check, so they behave identically
    // regardless of base. We exercise them under the subdirectory base to prove
    // they short-circuit BEFORE any prefixing could happen.
    it('returns empty string unchanged', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('')).toBe('')
    })

    it('returns a non-string value as-is (null)', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      // @ts-expect-error intentionally passing a non-string to hit the guard
      expect(resolveUrl(null)).toBe(null)
    })

    it('returns a non-string value as-is (undefined)', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      // @ts-expect-error intentionally passing a non-string to hit the guard
      expect(resolveUrl(undefined)).toBe(undefined)
    })

    it('returns a number as-is (typeof !== string)', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      // @ts-expect-error intentionally passing a non-string to hit the guard
      expect(resolveUrl(123)).toBe(123)
    })

    it('leaves a relative path (no leading slash) untouched', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('images/logo.png')).toBe('images/logo.png')
    })

    it('leaves a bare filename untouched', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('logo.png')).toBe('logo.png')
    })

    it('leaves a ./-relative path untouched', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('./images/logo.png')).toBe('./images/logo.png')
    })

    it('leaves an external http URL untouched', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('http://example.com/a.png')).toBe('http://example.com/a.png')
    })

    it('leaves an external https URL untouched', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    })
  })

  describe('resolveUrl — baseURL === "/" (production default)', () => {
    it('passes an absolute path through unchanged', async () => {
      const { resolveUrl } = await makeResolver('/')
      expect(resolveUrl('/images/logo.png')).toBe('/images/logo.png')
    })

    it('passes a root path through unchanged', async () => {
      const { resolveUrl } = await makeResolver('/')
      expect(resolveUrl('/')).toBe('/')
    })

    it('passes a nested absolute path through unchanged', async () => {
      const { resolveUrl } = await makeResolver('/')
      expect(resolveUrl('/a/b/c/d.webp')).toBe('/a/b/c/d.webp')
    })

    it('preserves query and hash on an absolute path', async () => {
      const { resolveUrl } = await makeResolver('/')
      expect(resolveUrl('/images/x.png?v=2#frag')).toBe('/images/x.png?v=2#frag')
    })

    it('still skips external URLs (guards run first)', async () => {
      const { resolveUrl } = await makeResolver('/')
      expect(resolveUrl('https://x.io/a.png')).toBe('https://x.io/a.png')
    })
  })

  describe('resolveUrl — subdirectory base "/WBM-Band-WebSite/" (GitHub Pages)', () => {
    it('prefixes an absolute path exactly once', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('/images/logo.png')).toBe('/WBM-Band-WebSite/images/logo.png')
    })

    it('strips the base trailing slash so there is no double slash at the join', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      const out = resolveUrl('/images/logo.png')
      expect(out).toBe('/WBM-Band-WebSite/images/logo.png')
      expect(out).not.toContain('//')
    })

    it('does NOT double-prefix an already-prefixed path', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('/WBM-Band-WebSite/images/logo.png')).toBe(
        '/WBM-Band-WebSite/images/logo.png'
      )
    })

    it('is idempotent — resolving an already-resolved path returns it unchanged', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      const once = resolveUrl('/images/logo.png')
      const twice = resolveUrl(once)
      expect(twice).toBe(once)
    })

    it('prefixes a path that merely shares a name fragment with the base', async () => {
      // '/WBM-Band-WebSite-other/...' does NOT start with the prefix + '/', so it
      // must still be prefixed (the guard checks `prefix + '/'`, not a substring).
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('/WBM-Band-WebSite-other/x.png')).toBe(
        '/WBM-Band-WebSite/WBM-Band-WebSite-other/x.png'
      )
    })

    it('prefixes the bare base path "/" → "/WBM-Band-WebSite/"', async () => {
      // path '/' does not start with 'prefix + "/"' ("/WBM-Band-WebSite/"),
      // so it gets prefixed to `${prefix}/` = '/WBM-Band-WebSite/'.
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('/')).toBe('/WBM-Band-WebSite/')
    })

    it('preserves query and hash while prefixing', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('/images/x.png?v=2#frag')).toBe('/WBM-Band-WebSite/images/x.png?v=2#frag')
    })

    it('still leaves external and relative paths alone under the subdirectory base', async () => {
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('https://cdn.io/a.png')).toBe('https://cdn.io/a.png')
      expect(resolveUrl('images/rel.png')).toBe('images/rel.png')
    })

    it('treats the exact prefix-without-trailing-slash path as NOT already-prefixed', async () => {
      // '/WBM-Band-WebSite' does not start with '/WBM-Band-WebSite/' (note the
      // trailing slash in the guard), so it is prefixed.
      const { resolveUrl } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveUrl('/WBM-Band-WebSite')).toBe('/WBM-Band-WebSite/WBM-Band-WebSite')
    })
  })

  describe('resolveUrl — subdirectory base WITHOUT trailing slash', () => {
    // Defensive: even if baseURL has no trailing slash, the `.replace(/\/$/, '')`
    // is a no-op and the join still produces a single-slash result.
    it('prefixes correctly when baseURL lacks a trailing slash', async () => {
      const { resolveUrl } = await makeResolver('/sub')
      expect(resolveUrl('/images/logo.png')).toBe('/sub/images/logo.png')
    })

    it('does not double-prefix under a no-trailing-slash base', async () => {
      const { resolveUrl } = await makeResolver('/sub')
      expect(resolveUrl('/sub/images/logo.png')).toBe('/sub/images/logo.png')
    })
  })

  describe('resolveSrcSet — guard clauses', () => {
    it('returns empty string unchanged', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('')).toBe('')
    })

    it('returns a non-string value as-is (null)', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      // @ts-expect-error intentionally passing a non-string to hit the guard
      expect(resolveSrcSet(null)).toBe(null)
    })

    it('returns undefined as-is', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      // @ts-expect-error intentionally passing a non-string to hit the guard
      expect(resolveSrcSet(undefined)).toBe(undefined)
    })
  })

  describe('resolveSrcSet — baseURL === "/" (pass-through)', () => {
    it('returns a multi-URL srcset unchanged but re-joined with ", "', async () => {
      const { resolveSrcSet } = await makeResolver('/')
      expect(resolveSrcSet('/a.png 400w, /b.png 800w')).toBe('/a.png 400w, /b.png 800w')
    })

    it('preserves the width descriptors exactly', async () => {
      const { resolveSrcSet } = await makeResolver('/')
      const out = resolveSrcSet('/a.png 400w, /b.png 800w, /c.png 1200w')
      expect(out).toContain('400w')
      expect(out).toContain('800w')
      expect(out).toContain('1200w')
    })

    it('preserves density (x) descriptors', async () => {
      const { resolveSrcSet } = await makeResolver('/')
      expect(resolveSrcSet('/a.png 1x, /b.png 2x')).toBe('/a.png 1x, /b.png 2x')
    })

    it('handles a single URL without descriptor', async () => {
      const { resolveSrcSet } = await makeResolver('/')
      expect(resolveSrcSet('/a.png')).toBe('/a.png')
    })

    it('normalizes irregular whitespace/commas into ", " joins', async () => {
      const { resolveSrcSet } = await makeResolver('/')
      // Extra spaces around commas and between url+descriptor collapse on rejoin.
      expect(resolveSrcSet('/a.png 400w ,  /b.png 800w')).toBe('/a.png 400w, /b.png 800w')
    })
  })

  describe('resolveSrcSet — subdirectory base (prefix EACH url, keep descriptors)', () => {
    it('prefixes every URL in a multi-entry srcset', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/a.png 400w, /b.png 800w')).toBe(
        '/WBM-Band-WebSite/a.png 400w, /WBM-Band-WebSite/b.png 800w'
      )
    })

    it('prefixes three URLs and preserves all width descriptors', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/a.png 400w, /b.png 800w, /c.png 1200w')).toBe(
        '/WBM-Band-WebSite/a.png 400w, ' +
          '/WBM-Band-WebSite/b.png 800w, ' +
          '/WBM-Band-WebSite/c.png 1200w'
      )
    })

    it('prefixes a single URL that carries a descriptor', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/a.png 2x')).toBe('/WBM-Band-WebSite/a.png 2x')
    })

    it('prefixes a single bare URL (no descriptor, no comma)', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/a.png')).toBe('/WBM-Band-WebSite/a.png')
    })

    it('preserves density descriptors while prefixing', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/a.png 1x, /b.png 2x')).toBe(
        '/WBM-Band-WebSite/a.png 1x, /WBM-Band-WebSite/b.png 2x'
      )
    })

    it('keeps a multi-word descriptor intact (only the first space splits url/descriptor)', async () => {
      // Only the FIRST space separates url from descriptor; everything after the
      // first space is preserved verbatim as the descriptor.
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/a.png 400w extra')).toBe('/WBM-Band-WebSite/a.png 400w extra')
    })

    it('leaves external URLs in a srcset un-prefixed while prefixing local ones', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('https://cdn.io/a.png 400w, /b.png 800w')).toBe(
        'https://cdn.io/a.png 400w, /WBM-Band-WebSite/b.png 800w'
      )
    })

    it('does not double-prefix already-prefixed URLs inside a srcset', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/WBM-Band-WebSite/a.png 400w, /b.png 800w')).toBe(
        '/WBM-Band-WebSite/a.png 400w, /WBM-Band-WebSite/b.png 800w'
      )
    })

    it('drops an empty trailing entry from a trailing comma', async () => {
      // A trailing comma yields an empty part; resolveSrcSet returns '' for it,
      // and the rejoin produces a dangling ", " after the real entry.
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      expect(resolveSrcSet('/a.png 400w,')).toBe('/WBM-Band-WebSite/a.png 400w, ')
    })

    it('prefixes relative-stripped guard: a relative url in srcset stays relative', async () => {
      const { resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      // 'rel.png' has no leading slash → resolveUrl leaves it; descriptor kept.
      expect(resolveSrcSet('rel.png 400w, /b.png 800w')).toBe(
        'rel.png 400w, /WBM-Band-WebSite/b.png 800w'
      )
    })
  })

  describe('parity: resolveSrcSet delegates to resolveUrl per entry', () => {
    it('each prefixed entry matches calling resolveUrl on that url directly', async () => {
      const { resolveUrl, resolveSrcSet } = await makeResolver('/WBM-Band-WebSite/')
      const out = resolveSrcSet('/a.png 400w, /b.png 800w')
      const expected = resolveUrl('/a.png') + ' 400w, ' + resolveUrl('/b.png') + ' 800w'
      expect(out).toBe(expected)
    })
  })
})
