import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { musicLibrary } from '~/data/musicLibrary'
import { SOURCE_PREFIXES } from '~/utils/sourceAttribution'

// Prerender-completeness e2e: assert the static `.output/public` that `npm run
// generate` produces actually contains every share URL, alias, and SEO file.
// This is the single biggest static-output gap (testing-strategy §6): add a
// release / a source prefix / a locale and forget to regenerate → shared links
// 404 with only a build warning. Pure node fs — no browser, no flakiness.

const OUT = resolve(process.cwd(), '.output/public')
const SLUGS = musicLibrary.map((r) => r.slug)
const PREFIXES = Object.keys(SOURCE_PREFIXES)
const LOCALE_DIRS = ['ua', 'en'] // prefix strategy, default ua
const PAGE_TYPES = ['listen', 'pre-save'] as const

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

describe('non-localized share-URL aliases (create-nonlocalized-aliases.js ran)', () => {
  it('mirrors clean {listen,pre-save}/{slug} at the root', () => {
    for (const type of PAGE_TYPES) {
      for (const slug of SLUGS) {
        expect(existsSync(page(type, slug)), `root ${type}/${slug}`).toBe(true)
      }
    }
  })

  it('mirrors {listen,pre-save}/{prefix}/{slug} at the root for every prefix', () => {
    const missing: string[] = []
    for (const type of PAGE_TYPES) {
      for (const prefix of PREFIXES) {
        for (const slug of SLUGS) {
          if (!existsSync(page(type, prefix, slug))) missing.push(`${type}/${prefix}/${slug}`)
        }
      }
    }
    expect(missing, `missing root aliases: ${missing.join(', ')}`).toEqual([])
  })

  it('root alias HTML mirrors the ua build (same prerendered body)', () => {
    // create-nonlocalized-aliases.js copies ua/listen → listen, so a clean listen
    // page at the root must be byte-identical to its ua counterpart.
    for (const slug of SLUGS) {
      expect(html('listen', slug)).toBe(html('ua', 'listen', slug))
    }
  })
})

describe('distributor seamless redirect (regression guard for commit 74dd10a)', () => {
  // alina uses the distributor pre-save flow — its prerendered body must be the
  // minimal redirect screen (PreSaveRedirect / role="status"), NOT the full
  // link-less pre-save body, so the hop to the distributor never flashes.
  const distributorSlug = 'alina'

  it('prerenders the redirect screen into the alina pre-save page', () => {
    if (!SLUGS.includes(distributorSlug)) return
    const body = html('pre-save', distributorSlug)
    expect(body).toMatch(/PreSaveRedirect|role="status"|redirecting/i)
  })

  it('keeps a released listen page free of the redirect screen', () => {
    const body = html('listen', 'mania')
    expect(body).not.toMatch(/PreSaveRedirect/)
  })
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
    expect(sitemap).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/) // root home
    for (const slug of SLUGS) {
      expect(sitemap, `sitemap missing /listen/${slug}`).toContain(`/listen/${slug}`)
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
    const home = html('ua')
    expect(home).not.toMatch(/(?:href|src)="\/WBM-Band-WebSite\//)
    // Positive control: Nuxt assets are served from the apex root.
    expect(home).toMatch(/(?:href|src)="\/_nuxt\//)
  })
})

describe('FINDING — dev/test pages currently ship to the static output', () => {
  // NOTE: these dev-only pages are presently prerendered into production output.
  // testing-strategy §5.8 suggests they SHOULD be excluded. This characterization
  // test documents current reality; if they get excluded from the prerender list,
  // flip these to .toBe(false). Surfaced to the maintainer for a decision.
  it('detects the dev pages in the build (test / performance-test)', () => {
    const present = ['test', 'performance-test'].filter((p) =>
      LOCALE_DIRS.some((loc) => existsSync(page(loc, p)))
    )
    expect(present).toEqual(['test', 'performance-test'])
  })
})
