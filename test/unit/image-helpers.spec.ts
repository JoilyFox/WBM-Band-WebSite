import { describe, it, expect } from 'vitest'
import {
  getOptimizedImageUrl,
  generatePictureSources,
  getResponsiveImageSrcSet,
  IMAGE_SIZES
} from '~/utils/imageHelpers'
import imagePresets from '~/constants/imagePresets.json'

// Pure-function coverage for utils/imageHelpers.ts. We deliberately SKIP the
// composables (useImageLoading / useAdvancedImageLoading) and the browser-only
// helpers (checkImageFormatSupport / generateBlurPlaceholder / preloadImage)
// because they need a DOM / IntersectionObserver, which the `node` unit project
// does not provide. The responsive srcset behaviour is driven entirely by
// constants/imagePresets.json — these tests read the widths straight from that
// file so they track the single source of truth and can't silently drift.

describe('getOptimizedImageUrl', () => {
  it('rewrites a /images/ source into /images/optimized/ for every format', () => {
    const urls = getOptimizedImageUrl('/images/cover.jpg')
    expect(urls.avif).toBe('/images/optimized/cover.avif')
    expect(urls.webp).toBe('/images/optimized/cover.webp')
    expect(urls.jpg).toBe('/images/optimized/cover.jpg')
  })

  it('mirrors the same optimized URLs into the srcSet object', () => {
    const urls = getOptimizedImageUrl('/images/cover.png')
    expect(urls.srcSet).toEqual({
      avif: '/images/optimized/cover.avif',
      webp: '/images/optimized/cover.webp',
      jpg: '/images/optimized/cover.jpg'
    })
  })

  it('strips the original extension regardless of input format', () => {
    expect(getOptimizedImageUrl('/images/photo.webp').jpg).toBe('/images/optimized/photo.jpg')
    expect(getOptimizedImageUrl('/images/photo.JPEG').avif).toBe('/images/optimized/photo.avif')
  })

  it('handles nested image directories', () => {
    const urls = getOptimizedImageUrl('/images/albums/2024/cover.jpg')
    expect(urls.avif).toBe('/images/optimized/albums/2024/cover.avif')
    expect(urls.webp).toBe('/images/optimized/albums/2024/cover.webp')
    expect(urls.jpg).toBe('/images/optimized/albums/2024/cover.jpg')
  })

  it('early-returns unchanged when the path is already optimized', () => {
    const urls = getOptimizedImageUrl('/images/optimized/cover.jpg')
    // No double /optimized/ segment is injected — base path is reused as-is.
    expect(urls.avif).toBe('/images/optimized/cover.avif')
    expect(urls.webp).toBe('/images/optimized/cover.webp')
    expect(urls.jpg).toBe('/images/optimized/cover.jpg')
    expect(urls.avif).not.toContain('optimized/optimized')
  })

  it('does NOT change the URL based on width, height or quality args', () => {
    const base = getOptimizedImageUrl('/images/cover.jpg')
    const withDims = getOptimizedImageUrl('/images/cover.jpg', 400, 400, 50)
    expect(withDims.avif).toBe(base.avif)
    expect(withDims.webp).toBe(base.webp)
    expect(withDims.jpg).toBe(base.jpg)
  })

  it('does NOT change the URL based on a preset (preset only affects internal dims)', () => {
    const base = getOptimizedImageUrl('/images/cover.jpg')
    const withPreset = getOptimizedImageUrl('/images/cover.jpg', undefined, undefined, 80, 'hero')
    expect(withPreset.jpg).toBe(base.jpg)
    expect(withPreset.avif).toBe(base.avif)
  })
})

describe('generatePictureSources — responsive multi-width preset (bug #1 fixed)', () => {
  const heroWidths = imagePresets.hero.widths
  const heroMax = Math.max(...heroWidths)

  it('emits genuinely DIFFERENT URLs per width descriptor', () => {
    const { avifSource } = generatePictureSources('/images/hero.jpg', undefined, 'hero')
    const urls = avifSource.srcset.split(', ').map((entry) => entry.split(' ')[0])
    const unique = new Set(urls)
    // One URL per width, all distinct (the pre-fix bug pointed them all at one file).
    expect(urls).toHaveLength(heroWidths.length)
    expect(unique.size).toBe(heroWidths.length)
  })

  it('points the largest width at the base name.ext and smaller widths at name-<w>.ext', () => {
    const { avifSource } = generatePictureSources('/images/hero.jpg', undefined, 'hero')
    const entries = avifSource.srcset.split(', ')
    for (const w of heroWidths) {
      const expectedUrl =
        w === heroMax ? '/images/optimized/hero.avif' : `/images/optimized/hero-${w}.avif`
      expect(entries).toContain(`${expectedUrl} ${w}w`)
    }
  })

  it('uses the width descriptors straight from imagePresets.json for that preset', () => {
    const { webpSource } = generatePictureSources('/images/hero.jpg', undefined, 'hero')
    const descriptors = webpSource.srcset.split(', ').map((entry) => entry.split(' ')[1])
    expect(descriptors).toEqual(heroWidths.map((w) => `${w}w`))
  })

  it('builds the webp srcset with the .webp extension and -<w> suffixes', () => {
    const { webpSource } = generatePictureSources('/images/hero.jpg', undefined, 'hero')
    expect(webpSource.srcset).toContain('/images/optimized/hero.webp ' + heroMax + 'w')
    const smaller = heroWidths.find((w) => w !== heroMax)
    expect(webpSource.srcset).toContain(`/images/optimized/hero-${smaller}.webp ${smaller}w`)
  })

  it('builds the jpg fallbackSrcset the same responsive way', () => {
    const { fallbackSrc, fallbackSrcset } = generatePictureSources(
      '/images/hero.jpg',
      undefined,
      'hero'
    )
    expect(fallbackSrc).toBe('/images/optimized/hero.jpg')
    expect(fallbackSrcset).toContain('/images/optimized/hero.jpg ' + heroMax + 'w')
    expect(fallbackSrcset.split(', ')).toHaveLength(heroWidths.length)
  })

  it('exposes the correct MIME type strings on each <source>', () => {
    const sources = generatePictureSources('/images/hero.jpg', undefined, 'hero')
    expect(sources.avifSource.type).toBe('image/avif')
    expect(sources.webpSource.type).toBe('image/webp')
  })

  it('defaults sizes to 100vw and propagates a supplied sizes value', () => {
    const def = generatePictureSources('/images/hero.jpg', undefined, 'hero')
    expect(def.sizes).toBe('100vw')
    expect(def.avifSource.sizes).toBe('100vw')
    expect(def.webpSource.sizes).toBe('100vw')

    const custom = generatePictureSources('/images/hero.jpg', '50vw', 'hero')
    expect(custom.sizes).toBe('50vw')
    expect(custom.avifSource.sizes).toBe('50vw')
    expect(custom.webpSource.sizes).toBe('50vw')
  })

  it('honours the album preset width set from imagePresets.json', () => {
    const albumWidths = imagePresets.album.widths
    const albumMax = Math.max(...albumWidths)
    const { avifSource } = generatePictureSources('/images/album.jpg', undefined, 'album')
    const descriptors = avifSource.srcset.split(', ').map((entry) => entry.split(' ')[1])
    expect(descriptors).toEqual(albumWidths.map((w) => `${w}w`))
    expect(avifSource.srcset).toContain('/images/optimized/album.avif ' + albumMax + 'w')
  })
})

describe('generatePictureSources — non-responsive cases', () => {
  it('falls back to a single-URL srcset for a single-width preset (team)', () => {
    // imagePresets.team has exactly one width → responsive === false branch.
    expect(imagePresets.team.widths).toHaveLength(1)
    const sources = generatePictureSources('/images/band.jpg', undefined, 'team')
    expect(sources.avifSource.srcset).toBe('/images/optimized/band.avif')
    expect(sources.webpSource.srcset).toBe('/images/optimized/band.webp')
    expect(sources.fallbackSrcset).toBe('/images/optimized/band.jpg')
    // No width descriptor (no trailing " <n>w") on the single-URL form.
    expect(sources.avifSource.srcset).not.toContain('w')
  })

  it('falls back to a single-URL srcset for the single-width thumbnail preset', () => {
    expect(imagePresets.thumbnail.widths).toHaveLength(1)
    const sources = generatePictureSources('/images/thumb.jpg', undefined, 'thumbnail')
    expect(sources.avifSource.srcset).toBe('/images/optimized/thumb.avif')
    expect(sources.fallbackSrcset).toBe('/images/optimized/thumb.jpg')
  })

  it('falls back to a single-URL srcset when no preset is supplied', () => {
    const sources = generatePictureSources('/images/plain.jpg')
    expect(sources.avifSource.srcset).toBe('/images/optimized/plain.avif')
    expect(sources.webpSource.srcset).toBe('/images/optimized/plain.webp')
    expect(sources.fallbackSrcset).toBe('/images/optimized/plain.jpg')
    expect(sources.sizes).toBe('100vw')
  })

  it('falls back to a single-URL srcset for an unknown preset name', () => {
    const sources = generatePictureSources('/images/plain.jpg', undefined, 'doesNotExist')
    expect(sources.avifSource.srcset).toBe('/images/optimized/plain.avif')
    expect(sources.fallbackSrcset).toBe('/images/optimized/plain.jpg')
  })

  it('still defaults sizes to 100vw in the non-responsive path', () => {
    const sources = generatePictureSources('/images/band.jpg', undefined, 'team')
    expect(sources.sizes).toBe('100vw')
    expect(sources.avifSource.sizes).toBe('100vw')
  })
})

describe('getResponsiveImageSrcSet', () => {
  const heroWidths = imagePresets.hero.widths
  const heroMax = Math.max(...heroWidths)

  it('returns the jpg srcset by default', () => {
    const srcset = getResponsiveImageSrcSet('/images/hero.jpg', 'hero')
    expect(srcset).toBe(
      generatePictureSources('/images/hero.jpg', undefined, 'hero').fallbackSrcset
    )
    expect(srcset).toContain('/images/optimized/hero.jpg ' + heroMax + 'w')
  })

  it('returns the avif srcset when asked', () => {
    const srcset = getResponsiveImageSrcSet('/images/hero.jpg', 'hero', 'avif')
    expect(srcset).toContain('/images/optimized/hero.avif ' + heroMax + 'w')
    const smaller = heroWidths.find((w) => w !== heroMax)
    expect(srcset).toContain(`/images/optimized/hero-${smaller}.avif ${smaller}w`)
  })

  it('returns the webp srcset when asked', () => {
    const srcset = getResponsiveImageSrcSet('/images/hero.jpg', 'hero', 'webp')
    expect(srcset).toContain('/images/optimized/hero.webp ' + heroMax + 'w')
  })

  it('returns a single URL (no descriptors) for a single-width preset', () => {
    const srcset = getResponsiveImageSrcSet('/images/band.jpg', 'team', 'jpg')
    expect(srcset).toBe('/images/optimized/band.jpg')
    expect(srcset).not.toContain('w')
  })
})

describe('IMAGE_SIZES', () => {
  it('exposes hero, album and about keys with the documented values', () => {
    expect(IMAGE_SIZES).toEqual({
      hero: '100vw',
      album: '(max-width: 640px) 60vw, (max-width: 1024px) 40vw, 360px',
      about: '(min-width: 1024px) 960px, 92vw'
    })
  })

  it('has exactly those three keys', () => {
    expect(Object.keys(IMAGE_SIZES).sort()).toEqual(['about', 'album', 'hero'])
  })
})
