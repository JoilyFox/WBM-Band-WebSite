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

  it('is wired into the `generate` npm script (runs after alias creation)', () => {
    const pkg = JSON.parse(read('package.json'))
    const gen = pkg.scripts.generate as string
    expect(gen).toContain('scripts/generate-sitemap.js')
    expect(gen).toContain('scripts/create-nonlocalized-aliases.js')
    // The sitemap lists /listen/<slug> clean URLs, which only exist after the
    // non-localized aliases are copied — order matters.
    expect(gen.indexOf('create-nonlocalized-aliases.js')).toBeLessThan(
      gen.indexOf('generate-sitemap.js')
    )
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
    // The catch-all internal rewrite that serves /ua content for clean URLs.
    expect(htaccess).toMatch(/RewriteRule\s+\^pre-save\/\(\.\*\)\$\s+\/ua\/pre-save\//)
    expect(htaccess).toMatch(/RewriteRule\s+\^listen\/\(\.\*\)\$\s+\/ua\/listen\//)
    expect(htaccess).toMatch(/RewriteEngine\s+On/)
  })

  it('IF _redirects exists, it routes the SAME share paths to the SAME ua locale', () => {
    if (!redirectsExists) {
      // Optional file — assert its absence explicitly rather than throwing.
      expect(redirectsExists).toBe(false)
      return
    }
    const redirects = read('public', '_redirects')
    // Both share entrypoints must be present and target /ua/<type>/:splat.
    expect(redirects).toMatch(/^\/pre-save\/\*\s+\/ua\/pre-save\/:splat\b/im)
    expect(redirects).toMatch(/^\/listen\/\*\s+\/ua\/listen\/:splat\b/im)
  })

  it('both routing files agree the default locale for share URLs is `ua`', () => {
    if (!htaccessExists || !redirectsExists) {
      expect(htaccessExists || redirectsExists).toBe(true)
      return
    }
    const htaccess = read('public', '.htaccess')
    const redirects = read('public', '_redirects')

    // Neither file may route share URLs to a non-default locale (e.g. /en).
    for (const type of ['pre-save', 'listen']) {
      // .htaccess: every rewrite target for bare /<type>/ goes to /ua/<type>/.
      const htRule = new RegExp(`RewriteRule\\s+\\^${type}\\/\\(\\.\\*\\)\\$\\s+\\/en\\/`)
      expect(htaccess).not.toMatch(htRule)
      // _redirects: same — no /en target for the bare share path.
      const reRule = new RegExp(`^\\/${type}\\/\\*\\s+\\/en\\/`, 'im')
      expect(redirects).not.toMatch(reRule)
    }
  })

  it('the non-localized alias generator agrees: ua/* is copied to bare /pre-save and /listen', () => {
    const alias = read('scripts', 'create-nonlocalized-aliases.js')
    // The alias mappings are the runtime equivalent of the .htaccess rewrites.
    expect(alias).toMatch(/from:\s*'ua\/pre-save',\s*to:\s*'pre-save'/)
    expect(alias).toMatch(/from:\s*'ua\/listen',\s*to:\s*'listen'/)
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

    const targets = Array.from(
      htaccess.matchAll(/RewriteRule\s+\S+\s+\/([a-z]{2})\/(?:pre-save|listen)\b/g)
    ).map((m) => m[1])
    expect(targets.length).toBeGreaterThan(0)
    for (const localeSeg of targets) {
      expect(declaredLocales).toContain(localeSeg)
    }
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

  it('the external Font Awesome / fonts CDN hrefs are NOT prefixed', () => {
    // Absolute external URLs must remain untouched by the baseURL prefix.
    const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome'
    expect(config).toContain(cdn)
    expect(config).not.toContain(`${PREFIX}` + 'https://')
    expect(config).not.toContain(`'${PREFIX}https://`)
  })
})

describe('prerender route list covers both locales for static pages', () => {
  const config = read('nuxt.config.ts')

  it('declares the prefix i18n strategy with default locale ua', () => {
    expect(config).toMatch(/strategy:\s*'prefix'/)
    expect(config).toMatch(/defaultLocale:\s*'ua'/)
  })

  it('STATIC_ROUTES include both /ua and /en variants for each policy page', () => {
    // Pull the STATIC_ROUTES array literal and assert symmetry across locales.
    const block = config.match(/const STATIC_ROUTES = \[([\s\S]*?)\]/)?.[1]
    expect(block, 'STATIC_ROUTES literal must exist').toBeTruthy()
    const routes = Array.from((block as string).matchAll(/'([^']+)'/g)).map((m) => m[1])

    const policyPages = routes
      .filter((r) => /^\/(ua|en)\//.test(r))
      .map((r) => r.replace(/^\/(ua|en)\//, ''))

    // Every localized policy page must exist for BOTH locales.
    const uaPages = new Set(routes.filter((r) => r.startsWith('/ua/')).map((r) => r.slice(4)))
    const enPages = new Set(routes.filter((r) => r.startsWith('/en/')).map((r) => r.slice(4)))
    expect(policyPages.length).toBeGreaterThan(0)
    expect([...uaPages].sort()).toEqual([...enPages].sort())
  })
})
