import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Drift-guard tests for the static-hosting routing contract.
//
// These assertions enforce invariants that span several un-typed text files
// (robots.txt, .htaccess, _redirects, scripts/generate-sitemap.js, nuxt.config.ts).
// They have no single source of truth in code, so they silently rot when one
// file changes without the others. Each test below should FAIL LOUDLY if the
// share-URL routing intent, the sitemap reference, or the DEPLOY_TARGET head
// prefixing drift apart.
//
// cwd is the project root for the `unit` vitest project (see vitest.config.ts).
const root = process.cwd()
const read = (...segments: string[]) => readFileSync(resolve(root, ...segments), 'utf8')
const has = (...segments: string[]) => existsSync(resolve(root, ...segments))

describe('robots.txt', () => {
  const robots = read('public', 'robots.txt')

  it('exists and is non-empty (audit defect #3 fixed)', () => {
    expect(robots.trim().length).toBeGreaterThan(0)
  })

  it('references a sitemap via an absolute https URL', () => {
    const m = robots.match(/^\s*Sitemap:\s*(\S+)\s*$/im)
    expect(m, 'robots.txt must contain a Sitemap: directive').not.toBeNull()
    const url = m![1]
    expect(url).toMatch(/^https:\/\//)
    expect(url).toMatch(/sitemap\.xml$/)
  })

  it('declares a User-agent and an Allow rule (does not block the whole site)', () => {
    expect(robots).toMatch(/^\s*User-agent:\s*\*/im)
    expect(robots).toMatch(/^\s*Allow:\s*\//im)
    // A bare `Disallow: /` would hide the noindex/canonical signals the
    // comment in robots.txt explicitly relies on — guard against it.
    expect(robots).not.toMatch(/^\s*Disallow:\s*\/\s*$/im)
  })

  it('points the sitemap at the canonical production origin', () => {
    const app = read('constants', 'app.ts')
    const siteUrl = app.match(/export const SITE_URL = '([^']+)'/)?.[1]
    expect(siteUrl, 'SITE_URL must exist in constants/app.ts').toBeTruthy()
    const host = new URL(siteUrl as string).host
    const sitemapUrl = robots.match(/^\s*Sitemap:\s*(\S+)\s*$/im)?.[1] as string
    expect(new URL(sitemapUrl).host).toBe(host)
  })
})

describe('sitemap generator', () => {
  it('the generator script exists', () => {
    expect(has('scripts', 'generate-sitemap.js')).toBe(true)
  })

  it('is wired into the `generate` npm script', () => {
    const pkg = JSON.parse(read('package.json'))
    const gen = pkg.scripts.generate as string
    expect(gen).toContain('scripts/generate-sitemap.js')
    // Ukrainian is the unprefixed default locale, so /listen/<slug> is a route
    // the prerenderer emits directly. The old create-nonlocalized-aliases.js
    // copy step (ua/listen -> listen) is gone and must not come back.
    expect(gen).not.toContain('create-nonlocalized-aliases')
    expect(has('scripts', 'create-nonlocalized-aliases.js')).toBe(false)
  })

  it('emits a sitemap keyed off SITE_URL, not DEPLOY_TARGET (no staging mirror)', () => {
    const script = read('scripts', 'generate-sitemap.js')
    expect(script).toContain('SITE_URL')
    // The script may MENTION DEPLOY_TARGET in a comment explaining why it does
    // not branch on it — but it must never READ process.env.DEPLOY_TARGET, or
    // the sitemap would point at the GitHub Pages staging mirror.
    expect(script).not.toMatch(/process\.env\.DEPLOY_TARGET/)
  })

  it('only emits canonical clean /listen/<slug> URLs, never source-prefixed variants', () => {
    const script = read('scripts', 'generate-sitemap.js')
    // The clean listen URL template must be present...
    expect(script).toContain('/listen/${release.slug}')
    // ...and pre-save (transient) pages must NOT be added to the sitemap.
    expect(script).not.toMatch(/loc:\s*`\$\{siteUrl\}\/(?:[a-z]{2}\/)?pre-save/)
  })
})

describe('share-URL routing intent (.htaccess vs _redirects)', () => {
  const htaccessExists = has('public', '.htaccess')
  const redirectsExists = has('public', '_redirects')

  it('.htaccess exists (primary host is Apache, per CLAUDE.md)', () => {
    expect(htaccessExists).toBe(true)
  })

  it('.htaccess rewrites bare /pre-save/* and /listen/* into the ua locale', () => {
    if (!htaccessExists) {
      expect(htaccessExists).toBe(false)
      return
    }
    const htaccess = read('public', '.htaccess')
    // Share URLs are served in place from the prerendered directory — never
    // rewritten into a /ua/ prefix, which is no longer a route.
    expect(htaccess).toMatch(
      /RewriteRule\s+\^\(listen\|pre-save\|lyrics\)\/\(\.\*\)\$\s+\/\$1\/\$2\/index\.html/
    )
    expect(htaccess).not.toMatch(/RewriteRule\s+\S+\s+\/ua\/(?:listen|pre-save|lyrics)/)
    // The legacy prefix must 301 to the clean URL rather than 404.
    expect(htaccess).toMatch(/RewriteRule\s+\^ua\/\(\.\*\)\$\s+\/\$1\s+\[R=301,L\]/)
    expect(htaccess).toMatch(/RewriteEngine\s+On/)
  })

  it('IF _redirects exists, it leaves the clean share URLs alone and retires /ua', () => {
    if (!redirectsExists) {
      // Optional file — assert its absence explicitly rather than throwing.
      expect(redirectsExists).toBe(false)
      return
    }
    const redirects = read('public', '_redirects')
    // The clean share URLs ARE canonical Ukrainian now — redirecting them would
    // point Google away from the URL every page declares as its canonical.
    expect(redirects).not.toMatch(/^\/(?:pre-save|listen|lyrics)\/\*/im)
    // The retired prefix collapses onto the clean form.
    expect(redirects).toMatch(/^\/ua\/\*\s+\/:splat\s+301\b/im)
  })

  it('both routing files agree the default locale for share URLs is `ua`', () => {
    if (!htaccessExists || !redirectsExists) {
      expect(htaccessExists || redirectsExists).toBe(true)
      return
    }
    const htaccess = read('public', '.htaccess')
    const redirects = read('public', '_redirects')

    // Neither file may route a bare share URL into a locale prefix at all —
    // unprefixed IS Ukrainian now, and /en would be the wrong language.
    for (const type of ['pre-save', 'listen', 'lyrics']) {
      const htRule = new RegExp(`RewriteRule\\s+\\^${type}\\/\\(\\.\\*\\)\\$\\s+\\/(?:en|ua)\\/`)
      expect(htaccess).not.toMatch(htRule)
      const reRule = new RegExp(`^\\/${type}\\/\\*\\s+\\/(?:en|ua)\\/`, 'im')
      expect(redirects).not.toMatch(reRule)
    }
  })

  it('the build emits share URLs natively — no alias copy step survives', () => {
    // Ukrainian is the unprefixed default locale, so `/listen/<slug>` is a real
    // prerendered route. The alias script that used to fake it (copying
    // ua/listen -> listen after the build) is deleted; if it reappears, the
    // clean URLs are duplicates again and canonical drift follows.
    expect(has('scripts', 'create-nonlocalized-aliases.js')).toBe(false)
    const nuxt = read('nuxt.config.ts')
    expect(nuxt).toMatch(/strategy:\s*'prefix_except_default'/)
  })

  it('.htaccess share-URL rewrite targets reference paths the build actually produces', () => {
    if (!htaccessExists) {
      expect(htaccessExists).toBe(false)
      return
    }
    const htaccess = read('public', '.htaccess')
    // Every internal rewrite target path begins with a locale that the i18n
    // config declares; drift here (e.g. a typo'd /uk/ or /de/) would 404.
    const nuxt = read('nuxt.config.ts')
    const declaredLocales = Array.from(nuxt.matchAll(/code:\s*'([a-z]{2})'/g)).map((m) => m[1])
    expect(declaredLocales).toEqual(expect.arrayContaining(['ua', 'en']))

    // Only English carries a locale segment now; Ukrainian is unprefixed. Any
    // /xx/ segment appearing in a share rewrite must be a declared locale.
    const targets = Array.from(
      htaccess.matchAll(/RewriteRule\s+\S+\s+\/([a-z]{2})\/(?:pre-save|listen|lyrics)\b/g)
    ).map((m) => m[1])
    for (const localeSeg of targets) {
      expect(declaredLocales).toContain(localeSeg)
    }
    // And the unprefixed form must be handled explicitly.
    expect(htaccess).toMatch(/\^\(listen\|pre-save\|lyrics\)/)
  })
})

describe('nuxt.config.ts DEPLOY_TARGET head-prefixing invariant', () => {
  const config = read('nuxt.config.ts')
  const PREFIX = '/WBM-Band-WebSite'
  const COND = `process.env.DEPLOY_TARGET === 'github' ? '${PREFIX}' : ''`

  it('baseURL switches on DEPLOY_TARGET=github', () => {
    expect(config).toMatch(
      /baseURL:\s*process\.env\.DEPLOY_TARGET === 'github'\s*\?\s*'\/WBM-Band-WebSite\/'\s*:\s*'\/'/
    )
  })

  it('every favicon/og/manifest href that carries the prefix uses the SAME conditional', () => {
    // Each occurrence of the GitHub-Pages prefix in an href/content must be
    // produced by the canonical ternary — never hardcoded — so a single env
    // flag flips them all together.
    const prefixOccurrences = config.split(PREFIX).length - 1
    const conditionalOccurrences = config.split(COND).length - 1

    expect(prefixOccurrences).toBeGreaterThan(0)
    // Exactly one extra raw occurrence is allowed: the baseURL literal
    // ('/WBM-Band-WebSite/'), which is itself inside the same ternary but with
    // a trailing slash so it doesn't match COND. Everything else must be COND.
    expect(prefixOccurrences).toBe(conditionalOccurrences + 1)
  })

  it('the conditional prefix is applied to head assets, never bare', () => {
    // Sanity: representative assets that MUST be prefixed under github deploy.
    const prefixedAssets = [
      '/favicon.ico',
      '/site.webmanifest',
      '/android-chrome-512x512.png',
      '/apple-touch-icon.png',
      '/browserconfig.xml'
    ]
    for (const asset of prefixedAssets) {
      // The asset string appears, and is immediately preceded (allowing
      // whitespace) by the closing of the conditional ternary `+`.
      expect(config).toContain(`'${asset}'`)
      const re = new RegExp(`\\)\\s*\\+\\s*\\n?\\s*'${asset.replace(/\./g, '\\.')}'`)
      const inlineRe = new RegExp(`: ''\\)\\s*\\+\\s*'${asset.replace(/\./g, '\\.')}'`)
      expect(
        re.test(config) || inlineRe.test(config),
        `${asset} must be concatenated onto the DEPLOY_TARGET conditional`
      ).toBe(true)
    }
  })

  it('external absolute URLs (og:image etc.) are NOT prefixed with the baseURL', () => {
    // The render-blocking Font Awesome cdnjs <link> was removed (it duplicated
    // the bundled plugins/fontawesome.client.ts import). Whatever absolute https
    // URLs remain in the head (e.g. og:image / twitter:image on SITE_URL) must
    // never get the DEPLOY_TARGET baseURL glued in front of them.
    expect(config).not.toContain(`${PREFIX}` + 'https://')
    expect(config).not.toContain(`'${PREFIX}https://`)
  })
})

describe('prerender route list covers both locales for static pages', () => {
  const config = read('nuxt.config.ts')

  it('declares the unprefixed-default i18n strategy with default locale ua', () => {
    // Ukrainian must stay UNPREFIXED: its canonical URLs are the clean ones
    // (`/`, `/listen/x`), and under the old `'prefix'` strategy those were not
    // real routes — they client-redirected to `/ua/...` while claiming to be
    // canonical. See docs/search-console.md.
    expect(config).toMatch(/strategy:\s*'prefix_except_default'/)
    expect(config).toMatch(/defaultLocale:\s*'ua'/)
  })

  it('STATIC_ROUTES cover every policy page in BOTH locales (ua unprefixed)', () => {
    const block = config.match(/const STATIC_ROUTES = \[([\s\S]*?)\]/)?.[1]
    expect(block, 'STATIC_ROUTES literal must exist').toBeTruthy()
    const routes = Array.from((block as string).matchAll(/'([^']+)'/g)).map((m) => m[1])

    // No route may carry the retired /ua prefix.
    expect(routes.filter((r) => r === '/ua' || r.startsWith('/ua/'))).toEqual([])

    const enPages = new Set(routes.filter((r) => r.startsWith('/en/')).map((r) => r.slice(4)))
    const uaPages = new Set(
      routes.filter((r) => r !== '/' && r !== '/en' && !r.startsWith('/en/')).map((r) => r.slice(1))
    )
    expect(uaPages.size).toBeGreaterThan(0)
    // Every localized page exists for both locales: unprefixed for ua, /en/ for en.
    expect([...uaPages].sort()).toEqual([...enPages].sort())
    // And both home pages are prerendered.
    expect(routes).toContain('/')
    expect(routes).toContain('/en')
  })
})
