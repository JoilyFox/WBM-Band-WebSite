import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { SOURCE_PREFIXES } from '~/utils/sourceAttribution'
import { SITE_URL } from '~/constants/app'

// ---------------------------------------------------------------------------
// Drift guards for the build-time scripts that DON'T import the typed TS
// modules — they text-parse the canonical source files at runtime instead
// (scripts run under plain `node`). That parsing is fragile: a refactor of
// `SOURCE_PREFIXES` or `SITE_URL` that keeps the TS valid but changes the
// surrounding syntax would silently break the regex and emit wrong/empty
// bio-links. These tests re-run the exact extraction the script does and
// assert it still equals the real, imported source of truth.
// ---------------------------------------------------------------------------

const root = process.cwd()

const read = (...segments: string[]): string => readFileSync(resolve(root, ...segments), 'utf8')

const bioScript = read('scripts', 'generate-bio-links.js')
const sourceAttributionSrc = read('utils', 'sourceAttribution.ts')
const appConstantsSrc = read('constants', 'app.ts')

// Re-implementations of the script's own extractors. These regexes are copied
// verbatim from scripts/generate-bio-links.js — if the script's parsing logic
// changes, the "script still references its source" tests below catch that.
function extractPrefixesFromAttribution(src: string): Array<[string, string]> {
  const block = src.match(/export const SOURCE_PREFIXES = \{([\s\S]*?)\} as const/)
  if (!block) throw new Error('SOURCE_PREFIXES block not found')
  return [...block[1].matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]])
}

function extractSiteUrlFromConstants(src: string): string {
  const m = src.match(/export const SITE_URL = '([^']+)'/)
  if (!m) throw new Error('SITE_URL not found')
  return m[1]
}

describe('bio-links script: no prefix drift from SOURCE_PREFIXES', () => {
  it('text-parses prefixes rather than hard-copying the map', () => {
    // The whole point is a single source of truth: the script must read
    // utils/sourceAttribution.ts, not embed its own copy of the prefix map.
    expect(bioScript).toMatch(/readRepoFile\(\s*'utils',\s*'sourceAttribution\.ts'\s*\)/)
    expect(bioScript).toContain('export const SOURCE_PREFIXES =')
  })

  it("the script's extraction regex still matches the current source file", () => {
    // Guards against a refactor that keeps valid TS but breaks the regex
    // (e.g. dropping `as const`, multi-line value, renaming the const).
    const parsed = extractPrefixesFromAttribution(sourceAttributionSrc)
    expect(parsed.length).toBeGreaterThan(0)
  })

  it('parsed prefix keys equal Object.keys(SOURCE_PREFIXES) exactly, same order', () => {
    const parsedKeys = extractPrefixesFromAttribution(sourceAttributionSrc).map(([k]) => k)
    expect(parsedKeys).toEqual(Object.keys(SOURCE_PREFIXES))
  })

  it('parsed prefix → platform pairs equal the real map exactly', () => {
    const parsed = extractPrefixesFromAttribution(sourceAttributionSrc)
    expect(Object.fromEntries(parsed)).toEqual({ ...SOURCE_PREFIXES })
  })

  it('every prefix has a display label in the script (no unlabeled prefix)', () => {
    // PREFIX_LABELS in the script must cover every real prefix; a missing
    // label silently degrades to a humanized platform value.
    const labelsBlock = bioScript.match(/const PREFIX_LABELS = \{([\s\S]*?)\n\}/)
    expect(labelsBlock).not.toBeNull()
    const labeledPrefixes = [...labelsBlock![1].matchAll(/(\w+):\s*'/g)].map((m) => m[1])
    for (const prefix of Object.keys(SOURCE_PREFIXES)) {
      expect(labeledPrefixes).toContain(prefix)
    }
  })
})

describe('bio-links script: single-source host (no www-vs-apex duplicate)', () => {
  it('text-parses SITE_URL from constants/app.ts rather than hard-coding it', () => {
    expect(bioScript).toMatch(/readRepoFile\(\s*'constants',\s*'app\.ts'\s*\)/)
    expect(bioScript).toContain("export const SITE_URL = '")
    // The script must NOT embed the production host as a URL string literal
    // of its own (the one mention in the JSDoc comment is fine — it's prose,
    // not a value that could drift). Guard against `'https://...wbmband.com'`.
    const codeLines = bioScript
      .split('\n')
      .filter((l) => {
        const t = l.trimStart()
        return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
      })
      .join('\n')
    expect(codeLines).not.toMatch(/['"`]https?:\/\/[^'"`]*wbmband\.com/)
  })

  it("the script's SITE_URL regex still matches the constants file", () => {
    expect(extractSiteUrlFromConstants(appConstantsSrc)).toBe(SITE_URL)
  })

  it('SITE_URL is the canonical www host with no trailing slash', () => {
    expect(SITE_URL).toBe('https://www.wbmband.com')
    expect(SITE_URL.endsWith('/')).toBe(false)
  })
})

describe('canonical/OG URL builders reference SITE_URL (single source)', () => {
  const masterPageSrc = read('composables', 'useMasterPage.ts')
  const indexPageSrc = read('pages', 'index.vue')
  const listenSourcePage = read('pages', 'listen', '[source]', '[slug].vue')
  const presaveSourcePage = read('pages', 'pre-save', '[source]', '[slug].vue')

  it('exactly one export of SITE_URL exists across the codebase touchpoints', () => {
    // Both constants/app.ts and the scripts only ever MATCH this literal;
    // app.ts is the only place that declares it.
    expect((appConstantsSrc.match(/export const SITE_URL = /g) ?? []).length).toBe(1)
  })

  it('useMasterPage imports SITE_URL and builds page URLs from it', () => {
    expect(masterPageSrc).toMatch(/import \{ SITE_URL \} from '~\/constants\/app'/)
    expect(masterPageSrc).toContain('${SITE_BASE_URL}/')
    expect(masterPageSrc).not.toContain('wbmband.com')
  })

  it('index page derives og:url from SITE_URL, not a literal host', () => {
    expect(indexPageSrc).toMatch(/import \{[^}]*SITE_URL[^}]*\} from '~\/constants\/app'/)
    // The only `wbmband.com` text allowed is inside a comment, never a URL string.
    const codeLines = indexPageSrc
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//'))
      .join('\n')
    expect(codeLines).not.toContain("'https://www.wbmband.com")
    expect(codeLines).not.toContain("'https://wbmband.com")
  })

  it('source-prefixed listen/pre-save pages build canonical hrefs from SITE_URL', () => {
    for (const src of [listenSourcePage, presaveSourcePage]) {
      expect(src).toMatch(/import \{ SITE_URL \} from '~\/constants\/app'/)
      expect(src).toMatch(/rel: 'canonical'[\s\S]*\$\{SITE_URL\}/)
      // canonical must be the clean (non-source-prefixed) URL.
      expect(src).toMatch(/\$\{SITE_URL\}\/(listen|pre-save)\/\$\{slug\}/)
    }
  })
})

describe('reserved prefixes never collide with release slugs (build guard intact)', () => {
  it('the slug-collision guard is exported and the prerender step calls it', () => {
    expect(sourceAttributionSrc).toContain('export function assertNoSlugCollisions')
    const nuxtConfig = read('nuxt.config.ts')
    expect(nuxtConfig).toContain('assertNoSlugCollisions')
  })

  it('no current release slug equals a reserved source prefix', () => {
    const lib = read('data', 'musicLibrary.ts')
    const slugs = [...lib.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1])
    expect(slugs.length).toBeGreaterThan(0)
    const reserved = new Set(Object.keys(SOURCE_PREFIXES))
    for (const slug of slugs) {
      expect(reserved.has(slug)).toBe(false)
    }
  })
})
