import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { musicLibrary } from '~/data/musicLibrary'
import { SOURCE_PREFIXES } from '~/utils/sourceAttribution'

// Prerender-completeness e2e: assert the static `.output/public` that `npm run
// generate` produces actually contains every share URL and SEO file.
// This is the single biggest static-output gap (testing-strategy §6): add a
// release / a source prefix / a locale and forget to regenerate → shared links
// 404 with only a build warning. Pure node fs — no browser, no flakiness.

const OUT = resolve(process.cwd(), '.output/public')
const SLUGS = musicLibrary.map((r) => r.slug)
const PREFIXES = Object.keys(SOURCE_PREFIXES)
// `prefix_except_default`: Ukrainian (default) is served from the output root, English from en/.
const LOCALE_DIRS = ['', 'en']
const PAGE_TYPES = ['listen', 'pre-save'] as const

// A release is "released" once its date has passed; before that /listen/<slug> is a redirect
// stub (middleware/listen-access.ts) and the sitemap deliberately omits it.
const isReleased = (r: { releaseDate?: string }) =>
  Boolean(r.releaseDate) && new Date(r.releaseDate as string).getTime() <= Date.now()
const RELEASED = musicLibrary.filter(isReleased)
const UPCOMING = musicLibrary.filter((r) => !isReleased(r))

const page = (...segs: string[]) => resolve(OUT, ...segs, 'index.html')
const html = (...segs: string[]) => readFileSync(page(...segs), 'utf8')

beforeAll(() => {
  if (!existsSync(OUT)) {
    throw new Error(
      `.output/public not found — run \`npm run generate\` first (the test:e2e script does this).`
    )
  }
})

describe('prerender completeness — localized release pages', () => {
  it('has every {locale}/{listen,pre-save}/{slug} clean page', () => {
    for (const loc of LOCALE_DIRS) {
      for (const type of PAGE_TYPES) {
        for (const slug of SLUGS) {
          expect(existsSync(page(loc, type, slug)), `${loc}/${type}/${slug}`).toBe(true)
        }
      }
    }
  })

  it('has every {locale}/{listen,pre-save}/{prefix}/{slug} source-attribution page', () => {
    const missing: string[] = []
    for (const loc of LOCALE_DIRS) {
      for (const type of PAGE_TYPES) {
        for (const prefix of PREFIXES) {
          for (const slug of SLUGS) {
            if (!existsSync(page(loc, type, prefix, slug))) {
              missing.push(`${loc}/${type}/${prefix}/${slug}`)
            }
          }
        }
      }
    }
    expect(missing, `missing prefixed pages: ${missing.join(', ')}`).toEqual([])
  })
})

describe('Ukrainian pages are native (prefix_except_default)', () => {
  it('serves the Ukrainian pages from the root and has no retired ua/ copy', () => {
    expect(existsSync(page())).toBe(true)
    expect(existsSync(resolve(OUT, 'ua')), 'ua/ directory must not exist').toBe(false)
    for (const type of PAGE_TYPES) {
      for (const slug of SLUGS) {
        expect(existsSync(page(type, slug)), `root ${type}/${slug}`).toBe(true)
      }
    }
  })

  it('declares the Ukrainian home as <html lang="uk"> (not the English shell)', () => {
    expect(html()).toMatch(/<html[^>]*lang="uk/i)
  })
})

describe('redirect stubs are noindex (soft-404 guard)', () => {
  it.each(UPCOMING.map((r) => r.slug))(
    'unreleased /listen/%s is a noindex refresh stub',
    (slug) => {
      const body = html('listen', slug)
      expect(body).toMatch(/http-equiv="refresh"/i)
      expect(body).toMatch(/<meta name="robots" content="noindex">/)
    }
  )

  it.each(RELEASED.map((r) => r.slug))(
    'released /pre-save/%s is a noindex stub to /listen',
    (slug) => {
      const body = html('pre-save', slug)
      expect(body).toMatch(/http-equiv="refresh"/i)
      expect(body).toMatch(/<meta name="robots" content="noindex">/)
    }
  )
})

describe('distributor seamless redirect (regression guard)', () => {
  // An upcoming release that uses the distributor pre-save flow must prerender the minimal
  // redirect screen (PreSaveRedirect / role="status"), NOT the full link-less pre-save body,
  // so the hop to the distributor never flashes.
  const distributor = UPCOMING.find((r) => r.useDistributorPreSave && r.distributorPreSaveUrl)

  it.skipIf(!distributor)(
    'prerenders the redirect screen into the distributor pre-save page',
    () => {
      const body = html('pre-save', distributor!.slug)
      expect(body).toMatch(/PreSaveRedirect|role="status"|redirecting/i)
    }
  )

  it.skipIf(RELEASED.length === 0)(
    'keeps a released listen page free of the redirect screen',
    () => {
      const body = html('listen', RELEASED[0].slug)
      expect(body).not.toMatch(/PreSaveRedirect/)
    }
  )
})

describe('SEO files', () => {
  it('robots.txt is non-empty and references the sitemap (defect #3 fixed)', () => {
    const robots = readFileSync(resolve(OUT, 'robots.txt'), 'utf8')
    expect(robots.trim().length).toBeGreaterThan(0)
    expect(robots).toMatch(/User-agent:\s*\*/i)
    expect(robots).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i)
  })

  it('sitemap.xml is well-formed and lists the homes + every release listen URL', () => {
    const sitemap = readFileSync(resolve(OUT, 'sitemap.xml'), 'utf8')
    expect(sitemap).toMatch(/^<\?xml/)
    expect(sitemap).toContain('<urlset')
    expect(sitemap).toMatch(/<loc>https:\/\/www\.wbmband\.com<\/loc>/) // Ukrainian home, no trailing slash
    for (const r of RELEASED) {
      expect(sitemap, `sitemap missing /listen/${r.slug}`).toContain(`/listen/${r.slug}`)
    }
    // Unreleased listen pages are redirect stubs (soft 404): never listed.
    for (const r of UPCOMING) {
      expect(sitemap, `sitemap must not list /listen/${r.slug}`).not.toContain(`/listen/${r.slug}`)
    }
    // No source-prefixed variants in the sitemap (they carry noindex).
    for (const prefix of PREFIXES) {
      expect(sitemap).not.toContain(`/listen/${prefix}/`)
    }
  })
})

describe('error + policy pages', () => {
  it('emits a root 404.html and a localized 404 per locale', () => {
    expect(existsSync(resolve(OUT, '404.html'))).toBe(true)
    for (const loc of LOCALE_DIRS) {
      expect(existsSync(page(loc, '404')), `${loc}/404`).toBe(true)
    }
  })

  it('emits all policy pages in both locales', () => {
    for (const loc of LOCALE_DIRS) {
      for (const policy of ['privacy-policy', 'terms-of-service', 'cookies-policy']) {
        expect(existsSync(page(loc, policy)), `${loc}/${policy}`).toBe(true)
      }
    }
  })
})

describe('DEPLOY_TARGET — production build uses the apex baseURL', () => {
  it('does not prefix asset hrefs/srcs with the GitHub Pages /WBM-Band-WebSite sub-path', () => {
    // Generated WITHOUT DEPLOY_TARGET=github, so the sub-path must NOT prefix assets.
    // NB: the bare substring also appears in the i18n payload as the repo's absolute
    // build path (…/@Repositories/WBM-Band-WebSite/locales/…), so anchor the check on
    // quoted href=/src= asset attributes — that's where the real baseURL would surface.
    const home = html()
    expect(home).not.toMatch(/(?:href|src)="\/WBM-Band-WebSite\//)
    // Positive control: Nuxt assets are served from the apex root.
    expect(home).toMatch(/(?:href|src)="\/_nuxt\//)
  })
})

describe('dev/test pages are not shipped to the static output', () => {
  // pages/test.vue and pages/performance-test.vue were removed (audit Q-01); they must
  // never come back into production output (indexable template page under the band's domain).
  it.each(['test', 'performance-test'])('has no /%s (root, en)', (p) => {
    for (const dir of ['', 'en']) {
      expect(existsSync(page(dir, p)), `${dir}/${p}`).toBe(false)
    }
  })
})
