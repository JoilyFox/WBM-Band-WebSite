// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useReleaseTheme } from '~/composables/useReleaseTheme'
import { coverColors } from '~/data/coverColors.generated'
import type { MusicRelease } from '~/data/musicLibrary'

// useReleaseTheme resolves a release's cover-driven colour theme field-by-field:
//   override (release.theme) → generated palette (coverColors[slug] or [id]) →
//   deterministic slug-hash fallback. It emits CSS custom properties (`vars`) and
//   `atmosphereClass` hooks. The composable depends on useAssetUrl, which in this
//   nuxt test env resolves against baseURL '/' (paths pass through unchanged), and
//   on the REAL coverColors.generated palette table — both are exercised live here.

// --- local mirror of the source's colour maths, used only to derive EXPECTED
//     values for assertions (the source helpers are not exported). -------------
const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Minimal MusicRelease factory — only the fields useReleaseTheme touches matter.
const makeRelease = (overrides: Partial<MusicRelease> = {}): MusicRelease =>
  ({
    id: 'test-id',
    slug: 'test-slug',
    title: 'Test',
    type: 'single',
    imageUrl: '/images/optimized/albums-images/test/cover.avif',
    musicPlatformLinks: {},
    ...overrides
  }) as MusicRelease

describe('useReleaseTheme', () => {
  describe('generated palette resolution (slug match)', () => {
    it("resolves a release whose slug EXISTS in coverColors.generated ('mania')", () => {
      const gen = coverColors['mania']
      const { theme } = useReleaseTheme(makeRelease({ slug: 'mania' }))
      // No override → palette comes straight from the generated table.
      expect(theme.value.palette.primary).toBe(gen.primary)
      expect(theme.value.palette.secondary).toBe(gen.secondary)
      expect(theme.value.palette.accent).toBe(gen.accent)
      expect(theme.value.palette.dark).toBe(gen.dark)
      expect(theme.value.palette.light).toBe(gen.light)
      expect(theme.value.palette.palette).toEqual(gen.palette)
      expect(theme.value.palette.isDark).toBe(gen.isDark)
      expect(theme.value.palette.isMuted).toBe(gen.isMuted)
    })

    it('derives the accent/bloom/atmo CSS vars from the generated palette', () => {
      const gen = coverColors['mania']
      const { themeVars } = useReleaseTheme(makeRelease({ slug: 'mania' }))
      const v = themeVars.value
      expect(v['--accent1']).toBe(rgba(gen.primary, 0.26))
      expect(v['--accent2']).toBe(rgba(gen.secondary, 0.2))
      expect(v['--accent-edge']).toBe(rgba(gen.accent, 0.38))
      expect(v['--bloom-primary']).toBe(rgba(gen.primary, 0.55))
      expect(v['--bloom-secondary']).toBe(rgba(gen.secondary, 0.5))
      expect(v['--bloom-accent']).toBe(rgba(gen.accent, 0.45))
      // dark is emitted raw (not wrapped in rgba()).
      expect(v['--bloom-dark']).toBe(gen.dark)
      expect(v['--atmo-tint']).toBe(rgba(gen.primary, 0.12))
      expect(v['--title-accent']).toBe(rgba(gen.light, 0.45))
    })

    it('exposes exactly the documented CSS variable keys', () => {
      const { themeVars } = useReleaseTheme(makeRelease({ slug: 'mania' }))
      expect(Object.keys(themeVars.value).sort()).toEqual(
        [
          '--accent-edge',
          '--accent1',
          '--accent2',
          '--atmo-tint',
          '--bloom-accent',
          '--bloom-dark',
          '--bloom-image',
          '--bloom-intensity',
          '--bloom-primary',
          '--bloom-secondary',
          '--title-accent'
        ].sort()
      )
    })

    it("resolves a muted generated cover ('alina', isMuted true) → atmo-muted class", () => {
      const gen = coverColors['alina']
      expect(gen.isMuted).toBe(true)
      const { theme, atmosphereClass } = useReleaseTheme(makeRelease({ slug: 'alina' }))
      expect(theme.value.isMuted).toBe(true)
      expect(atmosphereClass.value).toEqual(['atmo-variant-bloom', 'atmo-muted'])
    })

    it("resolves a vivid generated cover ('mania', isMuted false) → atmo-vivid class", () => {
      expect(coverColors['mania'].isMuted).toBe(false)
      const { theme, atmosphereClass } = useReleaseTheme(makeRelease({ slug: 'mania' }))
      expect(theme.value.isMuted).toBe(false)
      expect(atmosphereClass.value).toEqual(['atmo-variant-bloom', 'atmo-vivid'])
    })
  })

  describe('id-based resolution (slug falls back to id)', () => {
    it('resolves by id when slug is empty and id matches a generated key', () => {
      const gen = coverColors['mania']
      // slug '' is falsy → `r.slug || r.id` selects id 'mania'.
      const { theme } = useReleaseTheme(makeRelease({ slug: '', id: 'mania' }))
      expect(theme.value.palette.primary).toBe(gen.primary)
      expect(theme.value.palette.dark).toBe(gen.dark)
    })

    it('prefers slug over id when both are present', () => {
      const maniaGen = coverColors['mania']
      // slug 'mania' should win over a (would-be) id lookup of 'alina'.
      const { theme } = useReleaseTheme(makeRelease({ slug: 'mania', id: 'alina' }))
      expect(theme.value.palette.primary).toBe(maniaGen.primary)
      expect(theme.value.palette.primary).not.toBe(coverColors['alina'].primary)
    })
  })

  describe('per-release theme override precedence', () => {
    it('lets override colours win over the generated palette, field by field', () => {
      const override = {
        primary: '#112233',
        secondary: '#445566',
        accent: '#778899',
        dark: '#000102',
        light: '#fefdfc'
      }
      const { theme, themeVars } = useReleaseTheme(makeRelease({ slug: 'mania', theme: override }))
      expect(theme.value.palette.primary).toBe('#112233')
      expect(theme.value.palette.secondary).toBe('#445566')
      expect(theme.value.palette.accent).toBe('#778899')
      expect(theme.value.palette.dark).toBe('#000102')
      expect(theme.value.palette.light).toBe('#fefdfc')
      // Vars are derived from the OVERRIDE, not the generated mania palette.
      expect(themeVars.value['--accent1']).toBe(rgba('#112233', 0.26))
      expect(themeVars.value['--bloom-dark']).toBe('#000102')
      expect(themeVars.value['--accent1']).not.toBe(rgba(coverColors['mania'].primary, 0.26))
    })

    it('mixes a PARTIAL override with the generated palette per field', () => {
      const gen = coverColors['mania']
      // Only primary overridden → other fields still come from generated mania.
      const { theme } = useReleaseTheme(
        makeRelease({ slug: 'mania', theme: { primary: '#abcdef' } })
      )
      expect(theme.value.palette.primary).toBe('#abcdef')
      expect(theme.value.palette.secondary).toBe(gen.secondary)
      expect(theme.value.palette.accent).toBe(gen.accent)
      expect(theme.value.palette.dark).toBe(gen.dark)
    })

    it('falls back through override → fallback when the slug is unknown', () => {
      // unknown slug → no generated entry; override fills primary, fallback fills rest.
      const { theme } = useReleaseTheme(
        makeRelease({ slug: 'totally-unknown-slug', theme: { primary: '#a1b2c3' } })
      )
      expect(theme.value.palette.primary).toBe('#a1b2c3')
      // The remaining fields are deterministic fallback hexes (non-empty, derived).
      expect(typeof theme.value.palette.secondary).toBe('string')
      expect(theme.value.palette.secondary.startsWith('#')).toBe(true)
    })

    it('honours an explicit override.palette array (not just [primary,secondary,accent])', () => {
      const customPalette = ['#aaa111', '#bbb222']
      const { theme } = useReleaseTheme(
        makeRelease({ slug: 'mania', theme: { palette: customPalette } })
      )
      expect(theme.value.palette.palette).toEqual(customPalette)
    })

    it('honours override.variant and reflects it in variant + atmosphereClass', () => {
      const { theme, variant, atmosphereClass } = useReleaseTheme(
        makeRelease({ slug: 'mania', theme: { variant: 'liquid' } })
      )
      expect(theme.value.variant).toBe('liquid')
      expect(variant.value).toBe('liquid')
      expect(atmosphereClass.value[0]).toBe('atmo-variant-liquid')
    })

    it('honours override.intensity in the resolved theme and --bloom-intensity var', () => {
      const { theme, themeVars } = useReleaseTheme(
        makeRelease({ slug: 'mania', theme: { intensity: 0.4 } })
      )
      expect(theme.value.intensity).toBe(0.4)
      expect(themeVars.value['--bloom-intensity']).toBe('0.4')
    })

    it('allows intensity 0 (falsy but valid) to override the default of 1', () => {
      const { theme, themeVars } = useReleaseTheme(
        makeRelease({ slug: 'mania', theme: { intensity: 0 } })
      )
      // `??` keeps 0; only null/undefined would fall through to 1.
      expect(theme.value.intensity).toBe(0)
      expect(themeVars.value['--bloom-intensity']).toBe('0')
    })

    it('isDark / isMuted come from GENERATED data, not the override (override has no such fields)', () => {
      const gen = coverColors['mania']
      const { theme } = useReleaseTheme(
        makeRelease({ slug: 'mania', theme: { primary: '#ffffff' } })
      )
      expect(theme.value.palette.isDark).toBe(gen.isDark)
      expect(theme.value.isMuted).toBe(gen.isMuted)
    })
  })

  describe('deterministic fallback (unknown slug, no override)', () => {
    it('produces a complete, deterministic palette for an unknown slug', () => {
      const a = useReleaseTheme(makeRelease({ slug: 'mystery-drop-xyz' }))
      const b = useReleaseTheme(makeRelease({ slug: 'mystery-drop-xyz' }))
      // Same slug → identical palette (pure hash of the slug).
      expect(a.theme.value.palette).toEqual(b.theme.value.palette)
      for (const key of ['primary', 'secondary', 'accent', 'dark', 'light'] as const) {
        expect(typeof a.theme.value.palette[key]).toBe('string')
        // Must be a well-formed #RRGGBB hex — guards the hslHex clamp/normalization
        // fix (previously emitted malformed values like '#10af20d2-1fba').
        expect(a.theme.value.palette[key]).toMatch(/^#[0-9a-f]{6}$/i)
      }
    })

    it('builds palette array as [primary, secondary, accent] when no generated/override list', () => {
      const { theme } = useReleaseTheme(makeRelease({ slug: 'mystery-drop-xyz' }))
      const p = theme.value.palette
      expect(p.palette).toEqual([p.primary, p.secondary, p.accent])
      expect(p.palette).toHaveLength(3)
    })

    it('defaults isDark=true / isMuted=false / variant=bloom / intensity=1 in the fallback', () => {
      const { theme, atmosphereClass } = useReleaseTheme(makeRelease({ slug: 'mystery-drop-xyz' }))
      expect(theme.value.palette.isDark).toBe(true)
      expect(theme.value.isMuted).toBe(false)
      expect(theme.value.variant).toBe('bloom')
      expect(theme.value.intensity).toBe(1)
      expect(atmosphereClass.value).toEqual(['atmo-variant-bloom', 'atmo-vivid'])
    })

    it('different slugs yield different fallback palettes (hash is slug-dependent)', () => {
      const one = useReleaseTheme(makeRelease({ slug: 'aaaaaa' })).theme.value.palette.primary
      const two = useReleaseTheme(makeRelease({ slug: 'zzzzzz' })).theme.value.palette.primary
      expect(one).not.toBe(two)
    })
  })

  describe('--bloom-image url derivation', () => {
    it('rewrites a /cover.avif path to its /thumbs/cover.jpg thumbnail', () => {
      const { themeVars } = useReleaseTheme(
        makeRelease({ slug: 'mania', imageUrl: '/images/albums/mania/cover.avif' })
      )
      // baseURL is '/' in this env, so resolveUrl passes the path through. The
      // /cover.<ext> tail is rewritten to /thumbs/cover.jpg (small bloom thumb).
      expect(themeVars.value['--bloom-image']).toBe('url("/images/albums/mania/thumbs/cover.jpg")')
    })

    it('rewrites .webp / .png covers to the /thumbs/cover.jpg thumb path as well', () => {
      const webp = useReleaseTheme(makeRelease({ slug: 'mania', imageUrl: '/img/x/cover.webp' }))
        .themeVars.value['--bloom-image']
      expect(webp).toBe('url("/img/x/thumbs/cover.jpg")')

      const png = useReleaseTheme(makeRelease({ slug: 'mania', imageUrl: '/img/x/cover.png' }))
        .themeVars.value['--bloom-image']
      expect(png).toBe('url("/img/x/thumbs/cover.jpg")')
    })

    it('downgrades a non-cover image filename to .jpg without the /thumbs/ rewrite', () => {
      // First regex only matches a trailing /cover.<ext>; a different basename only
      // hits the second .(avif|webp|png) → .jpg replacement.
      const { themeVars } = useReleaseTheme(
        makeRelease({ slug: 'mania', imageUrl: '/images/art/banner.png' })
      )
      expect(themeVars.value['--bloom-image']).toBe('url("/images/art/banner.jpg")')
    })

    it('rewrites an already-jpg cover.jpg into the /thumbs/cover.jpg thumb path', () => {
      // The first regex includes jpg/jpeg, so /cover.jpg still maps to /thumbs/cover.jpg.
      const { themeVars } = useReleaseTheme(
        makeRelease({ slug: 'mania', imageUrl: '/images/art/cover.jpg' })
      )
      expect(themeVars.value['--bloom-image']).toBe('url("/images/art/thumbs/cover.jpg")')
    })

    it('leaves a non-cover .jpg basename unchanged (no /thumbs/ rewrite)', () => {
      // Neither regex matches: second only targets avif/webp/png, first only /cover.<ext>.
      const { themeVars } = useReleaseTheme(
        makeRelease({ slug: 'mania', imageUrl: '/images/art/banner.jpg' })
      )
      expect(themeVars.value['--bloom-image']).toBe('url("/images/art/banner.jpg")')
    })
  })

  describe('reactivity (MaybeRefOrGetter input)', () => {
    it('accepts a ref and recomputes when the release ref changes', () => {
      const r = ref(makeRelease({ slug: 'mania' }))
      const { theme } = useReleaseTheme(r)
      expect(theme.value.palette.primary).toBe(coverColors['mania'].primary)
      // Swap to a release with an override → resolved theme tracks the change.
      r.value = makeRelease({ slug: 'mania', theme: { primary: '#010203' } })
      expect(theme.value.palette.primary).toBe('#010203')
    })

    it('accepts a getter function as input', () => {
      const { theme } = useReleaseTheme(() => makeRelease({ slug: 'mania' }))
      expect(theme.value.palette.primary).toBe(coverColors['mania'].primary)
    })
  })

  describe('3-digit hex handling via override', () => {
    it('expands a 3-digit override hex when building rgba() vars', () => {
      const { themeVars } = useReleaseTheme(
        makeRelease({ slug: 'mania', theme: { primary: '#abc' } })
      )
      // #abc → #aabbcc → rgb(170,187,204)
      expect(themeVars.value['--accent1']).toBe('rgba(170, 187, 204, 0.26)')
    })
  })
})
