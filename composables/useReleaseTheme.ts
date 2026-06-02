/**
 * useReleaseTheme
 *
 * Resolves a release's cover-driven colour theme and exposes the CSS custom
 * properties that paint the "Ambient Bloom" atmosphere on the release pages
 * (see components/music/MusicDetailContent.vue).
 *
 * Resolution is field-by-field, override-wins:
 *   1. release.theme.*               — manual override in data/musicLibrary.ts
 *   2. coverColors[slug].*           — auto-extracted (npm run extract-colors)
 *   3. deterministic hash fallback   — derived from the slug so nothing breaks
 *
 * Everything is computed (SSR-safe, zero runtime image work) — the site is
 * fully static and the palettes are baked at build time.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { coverColors, type CoverPalette } from '~/data/coverColors.generated'
import type { MusicRelease } from '~/data/musicLibrary'
import { useAssetUrl } from '~/composables/useAssetUrl'

// --- small colour helpers (hex → rgb/rgba) ---------------------------------

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

// Deterministic hue from the slug — the safety net when a release has neither an
// override nor an extracted palette (mirrors the old stringToHue behaviour).
const stringToHue = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % 360
}

const hslHex = (h: number, s: number, l: number) => {
  // minimal HSL→hex for the fallback path (s and l given in 0–100)
  const sN = s / 100
  const lN = l / 100
  const a = sN * Math.min(lN, 1 - lN)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = lN - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    // Clamp the channel to [0,255] so toString(16) always yields exactly 2 hex digits.
    return Math.round(255 * Math.max(0, Math.min(1, c)))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const fallbackPalette = (slug: string): CoverPalette => {
  const hue = stringToHue(slug)
  return {
    primary: hslHex(hue, 60, 55),
    secondary: hslHex((hue + 40) % 360, 55, 52),
    accent: hslHex((hue + 20) % 360, 65, 58),
    dark: hslHex(hue, 30, 6),
    light: hslHex(hue, 30, 86),
    palette: [
      hslHex(hue, 60, 55),
      hslHex((hue + 40) % 360, 55, 52),
      hslHex((hue + 20) % 360, 65, 58)
    ],
    isDark: true,
    isMuted: false
  }
}

export interface ResolvedReleaseTheme {
  palette: CoverPalette
  variant: 'bloom' | 'liquid'
  intensity: number
  isMuted: boolean
  /** CSS custom properties to spread onto the page root element. */
  vars: Record<string, string>
  /** Class hooks for the atmosphere variant / state. */
  atmosphereClass: string[]
}

export const useReleaseTheme = (release: MaybeRefOrGetter<MusicRelease>) => {
  const { resolveUrl } = useAssetUrl()

  // Path to the small blurred-friendly cover thumbnail used as the bloom layer.
  const bloomImageUrl = (imageUrl: string) => {
    const thumb = imageUrl
      .replace(/\/cover\.(avif|webp|png|jpg|jpeg)$/i, '/thumbs/cover.jpg')
      .replace(/\.(avif|webp|png)$/i, '.jpg')
    return resolveUrl(thumb)
  }

  const resolved = computed<ResolvedReleaseTheme>(() => {
    const r = toValue(release)
    const slug = r.slug || r.id
    const generated = coverColors[slug]
    const override = r.theme
    const fb = fallbackPalette(slug)

    // Field-by-field merge: override → generated → fallback.
    const pick = (key: keyof CoverPalette): string =>
      (override?.[key as keyof typeof override] as string | undefined) ??
      (generated?.[key] as string | undefined) ??
      (fb[key] as string)

    const palette: CoverPalette = {
      primary: pick('primary'),
      secondary: pick('secondary'),
      accent: pick('accent'),
      dark: pick('dark'),
      light: pick('light'),
      palette: override?.palette ??
        generated?.palette ?? [pick('primary'), pick('secondary'), pick('accent')],
      isDark: generated?.isDark ?? fb.isDark,
      isMuted: generated?.isMuted ?? fb.isMuted
    }

    const variant = override?.variant ?? 'bloom'
    const intensity = override?.intensity ?? 1

    const vars: Record<string, string> = {
      // Hero accent layers (drop-in replacement for the old slug-hash vars).
      '--accent1': rgba(palette.primary, 0.26),
      '--accent2': rgba(palette.secondary, 0.2),
      '--accent-edge': rgba(palette.accent, 0.38),

      // Whole-page "Ambient Bloom" atmosphere.
      '--bloom-image': `url("${bloomImageUrl(r.imageUrl)}")`,
      '--bloom-primary': rgba(palette.primary, 0.55),
      '--bloom-secondary': rgba(palette.secondary, 0.5),
      '--bloom-accent': rgba(palette.accent, 0.45),
      '--bloom-dark': palette.dark,
      '--bloom-intensity': String(intensity),

      // Subtle tints carried into the rest of the page + title glow.
      '--atmo-tint': rgba(palette.primary, 0.12),
      '--title-accent': rgba(palette.light, 0.45)
    }

    return {
      palette,
      variant,
      intensity,
      isMuted: palette.isMuted,
      vars,
      atmosphereClass: [`atmo-variant-${variant}`, palette.isMuted ? 'atmo-muted' : 'atmo-vivid']
    }
  })

  return {
    theme: resolved,
    themeVars: computed(() => resolved.value.vars),
    atmosphereClass: computed(() => resolved.value.atmosphereClass),
    variant: computed(() => resolved.value.variant)
  }
}
