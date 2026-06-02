import { describe, it, expect } from 'vitest'
import { coverColors, getCoverPalette } from '~/data/coverColors.generated'
import type { CoverPalette } from '~/data/coverColors.generated'
import { musicLibrary } from '~/data/musicLibrary'

// Drift-guard tests for the build-time cover-palette data
// (`data/coverColors.generated.ts`, produced by `npm run extract-colors`).
//
// The invariants enforced here:
//   • referential integrity — every release in `musicLibrary` has a palette
//     entry keyed by its slug (catches a forgotten `npm run extract-colors`
//     after adding a release),
//   • every colour field on every palette is a well-formed hex string,
//   • the `palette` array is non-empty, hex-valued and primary-first,
//   • `getCoverPalette()` resolves a known slug and returns `undefined` for an
//     unknown one.
//
// These deliberately iterate over ALL entries / ALL releases so they fail
// loudly if someone later adds a release without a palette, hand-edits a
// malformed colour, or drifts the keying.

// Accept both #RRGGBB and #RGB (the consumer's hexToRgb in
// composables/useReleaseTheme.ts supports the 3-digit shorthand too).
const HEX = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

const HEX_FIELDS = ['primary', 'secondary', 'accent', 'dark', 'light'] as const

const paletteEntries = Object.entries(coverColors)

describe('coverColors (generated palette map)', () => {
  it('is a non-empty object', () => {
    expect(coverColors).toBeTypeOf('object')
    expect(coverColors).not.toBeNull()
    expect(paletteEntries.length).toBeGreaterThan(0)
  })

  it('keys every entry by a non-empty slug string', () => {
    for (const [slug] of paletteEntries) {
      expect(typeof slug).toBe('string')
      expect(slug.length).toBeGreaterThan(0)
    }
  })

  it.each(paletteEntries)('palette "%s" has all five hex colour fields well-formed', (_slug, p) => {
    for (const field of HEX_FIELDS) {
      const value = p[field]
      expect(typeof value).toBe('string')
      expect(value, `${_slug}.${field} = ${value as string}`).toMatch(HEX)
    }
  })

  it.each(paletteEntries)(
    'palette "%s" exposes a non-empty hex-valued palette array',
    (_slug, p) => {
      expect(Array.isArray(p.palette)).toBe(true)
      expect(p.palette.length).toBeGreaterThan(0)
      for (const colour of p.palette) {
        expect(colour, `${_slug} palette colour ${colour}`).toMatch(HEX)
      }
    }
  )

  it.each(paletteEntries)('palette "%s" lists primary first in its palette array', (_slug, p) => {
    expect(p.palette[0]).toBe(p.primary)
  })

  it.each(paletteEntries)('palette "%s" carries boolean isDark / isMuted flags', (_slug, p) => {
    expect(typeof p.isDark).toBe('boolean')
    expect(typeof p.isMuted).toBe('boolean')
  })
})

describe('referential integrity: musicLibrary <-> coverColors', () => {
  it('every release slug has a corresponding palette entry (run npm run extract-colors)', () => {
    const missing = musicLibrary
      .map((r) => r.slug)
      .filter((slug) => coverColors[slug] === undefined)
    expect(missing, `releases missing a generated palette: ${missing.join(', ')}`).toEqual([])
  })

  it.each(musicLibrary.map((r) => [r.slug] as const))(
    'release "%s" resolves to a complete palette',
    (slug) => {
      const p = coverColors[slug]
      expect(p, `no palette for slug "${slug}"`).toBeDefined()
      for (const field of HEX_FIELDS) {
        expect((p as CoverPalette)[field]).toMatch(HEX)
      }
    }
  )
})

describe('getCoverPalette accessor', () => {
  it('returns the exact module-level palette object for a known slug', () => {
    const known = paletteEntries[0][0]
    expect(getCoverPalette(known)).toBe(coverColors[known])
  })

  it('resolves a palette for every release slug', () => {
    for (const release of musicLibrary) {
      const p = getCoverPalette(release.slug)
      expect(p, `getCoverPalette('${release.slug}') was undefined`).toBeDefined()
      expect(p).toBe(coverColors[release.slug])
    }
  })

  it('returns undefined for an unknown slug (sensible fallback)', () => {
    expect(getCoverPalette('does-not-exist')).toBeUndefined()
  })

  it('returns undefined for an empty-string slug', () => {
    expect(getCoverPalette('')).toBeUndefined()
  })

  it('is case-sensitive — does not match a differently-cased slug', () => {
    const known = paletteEntries[0][0]
    expect(getCoverPalette(known.toUpperCase())).toBeUndefined()
  })
})

describe('inline theme overrides in musicLibrary', () => {
  it('every overridden colour field is a well-formed hex string', () => {
    for (const release of musicLibrary) {
      const theme = release.theme
      if (!theme) continue
      for (const field of HEX_FIELDS) {
        const value = theme[field]
        if (value === undefined) continue
        expect(value, `${release.slug} theme.${field} = ${value}`).toMatch(HEX)
      }
      if (theme.palette) {
        for (const colour of theme.palette) {
          expect(colour, `${release.slug} theme palette ${colour}`).toMatch(HEX)
        }
      }
    }
  })
})
