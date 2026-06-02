// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProgressiveImage from '~/components/ui/ProgressiveImage.vue'

// ProgressiveImage renders an AVIF → WebP → JPEG <picture>, gated by a load
// trigger (eager loading, or IntersectionObserver hit for lazy). It owns a
// gradient placeholder, a load-in fade (driven by the `imageLoaded` class swap,
// NOT inline opacity — the fade itself lives in scoped CSS), an error fallback,
// and an optional spinner. Behaviour is driven by `useImageLoading()` from
// ~/utils/imageHelpers and source URLs by `generatePictureSources` +
// `useAssetUrl` (baseURL '/' in this env, so paths pass through unchanged).
//
// In the nuxt test env IntersectionObserver is MOCKED (vitest.config.ts:
// mock.intersectionObserver) and does NOT auto-fire — so a default `lazy` mount
// never reaches the intersecting state. We exercise the eager path for full
// render and assert the lazy GATE structurally.

const base = (over: Record<string, unknown> = {}) => ({
  src: '/images/foo.jpg',
  alt: 'cover art',
  preset: 'album',
  loading: 'eager' as const,
  ...over
})

describe('ProgressiveImage', () => {
  describe('shouldLoadImage gate (eager vs lazy)', () => {
    it('eager loading renders the <picture> immediately', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      expect(w.find('picture').exists()).toBe(true)
      expect(w.find('img').exists()).toBe(true)
    })

    it('lazy loading (default) does NOT render <picture> until intersecting', async () => {
      // No `loading` prop → defaults to 'lazy'. The mocked IntersectionObserver
      // never fires, so the load gate stays closed and only the placeholder shows.
      const w = await mountSuspended(ProgressiveImage, {
        props: { src: '/images/foo.jpg', alt: 'cover art', preset: 'album' }
      })
      expect(w.find('picture').exists()).toBe(false)
      expect(w.find('img').exists()).toBe(false)
      // The gradient placeholder is what the user sees while the gate is closed.
      expect(w.find('.gradient-placeholder').exists()).toBe(true)
    })

    it('fetchpriority="high" eager image forwards the priority + loading attrs', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ fetchPriority: 'high', width: 800, height: 800 })
      })
      const img = w.find('img')
      expect(img.attributes('fetchpriority')).toBe('high')
      expect(img.attributes('loading')).toBe('eager')
      expect(img.attributes('width')).toBe('800')
      expect(img.attributes('height')).toBe('800')
      expect(img.attributes('alt')).toBe('cover art')
    })
  })

  describe('picture sources (landscape, responsive vs single-URL)', () => {
    it('emits responsive avif + webp <source>s and a jpeg fallback <img> for a multi-width preset', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      const sources = w.findAll('source')
      // No portrait → exactly two <source> (avif, webp).
      expect(sources).toHaveLength(2)
      expect(sources[0].attributes('type')).toBe('image/avif')
      expect(sources[1].attributes('type')).toBe('image/webp')

      // 'album' preset has widths [200,400,640,800] → width-descriptor srcset,
      // largest width points at the base file (no `-800` suffix).
      const avif = sources[0].attributes('srcset')
      expect(avif).toContain('/images/optimized/foo-200.avif 200w')
      expect(avif).toContain('/images/optimized/foo-400.avif 400w')
      expect(avif).toContain('/images/optimized/foo-640.avif 640w')
      expect(avif).toContain('/images/optimized/foo.avif 800w')

      const img = w.find('img')
      expect(img.attributes('src')).toBe('/images/optimized/foo.jpg')
      expect(img.attributes('srcset')).toContain('/images/optimized/foo-200.jpg 200w')
      expect(img.attributes('srcset')).toContain('/images/optimized/foo.jpg 800w')
    })

    it('emits a single-URL srcset (non-responsive) when no preset is given', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: { src: '/images/foo.jpg', alt: 'x', loading: 'eager' }
      })
      const avif = w.findAll('source')[0].attributes('srcset')
      // No preset → no width descriptors, just the single optimized URL.
      expect(avif).toBe('/images/optimized/foo.avif')
      expect(w.find('img').attributes('src')).toBe('/images/optimized/foo.jpg')
    })

    it('defaults the <img> sizes to 100vw when no sizes prop is set', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      expect(w.find('img').attributes('sizes')).toBe('100vw')
    })

    it('forwards a custom sizes prop to the <img> and every <source>', async () => {
      const sizes = '(max-width: 640px) 60vw, 360px'
      const w = await mountSuspended(ProgressiveImage, { props: base({ sizes }) })
      expect(w.find('img').attributes('sizes')).toBe(sizes)
      for (const s of w.findAll('source')) {
        expect(s.attributes('sizes')).toBe(sizes)
      }
    })
  })

  describe('portrait sources selection', () => {
    it('does NOT emit portrait <source>s when srcPortrait is absent', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      const medias = w.findAll('source').map((s) => s.attributes('media'))
      expect(medias.every((m) => m === undefined)).toBe(true)
    })

    it('emits portrait avif/webp <source>s FIRST (orientation: portrait) when srcPortrait is set', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ srcPortrait: '/images/foo-p.jpg' })
      })
      const sources = w.findAll('source')
      // 2 portrait + 2 landscape.
      expect(sources).toHaveLength(4)
      expect(sources[0].attributes('media')).toBe('(orientation: portrait)')
      expect(sources[0].attributes('type')).toBe('image/avif')
      expect(sources[0].attributes('srcset')).toContain('/images/optimized/foo-p-200.avif 200w')
      expect(sources[1].attributes('media')).toBe('(orientation: portrait)')
      expect(sources[1].attributes('type')).toBe('image/webp')
      // The landscape sources (3rd, 4th) carry no media query.
      expect(sources[2].attributes('media')).toBeUndefined()
      expect(sources[3].attributes('media')).toBeUndefined()
    })

    it('portraitPreset overrides preset for portrait URLs while landscape keeps preset', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({
          src: '/images/foo.jpg',
          srcPortrait: '/images/p.jpg',
          preset: 'thumbnail', // single-width
          portraitPreset: 'album' // multi-width
        })
      })
      const sources = w.findAll('source')
      // Portrait (album preset) → responsive multi-width srcset.
      expect(sources[0].attributes('srcset')).toContain('/images/optimized/p-200.avif 200w')
      expect(sources[0].attributes('srcset')).toContain('/images/optimized/p.avif 800w')
      // Landscape (thumbnail preset) → single-URL srcset.
      expect(sources[2].attributes('srcset')).toBe('/images/optimized/foo.avif')
    })
  })

  describe('@load → loaded state + fade-in', () => {
    it('starts opacity-0 scale-105, flips to opacity-100 scale-100 on load', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      // The fade itself is scoped CSS; we assert the CLASS swap, not literal opacity.
      expect(w.find('img').attributes('class')).toContain('opacity-0')
      expect(w.find('img').attributes('class')).toContain('scale-105')

      await w.find('img').trigger('load')
      await nextTick()

      const cls = w.find('img').attributes('class')
      expect(cls).toContain('opacity-100')
      expect(cls).toContain('scale-100')
      expect(cls).not.toContain('opacity-0')
      expect(cls).not.toContain('scale-105')
    })

    it('fades the gradient placeholder out (opacity-0) once the image has loaded', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      expect(w.find('.gradient-placeholder').attributes('class')).not.toContain('opacity-0')

      await w.find('img').trigger('load')
      await nextTick()

      expect(w.find('.gradient-placeholder').attributes('class')).toContain('opacity-0')
    })

    it('hero-background-image container pins the image to opacity-100 even before load', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ preset: 'hero', containerClass: 'hero-background-image' })
      })
      // Hero images opt out of the fade — the hero slider controls opacity.
      const cls = w.find('img').attributes('class')
      expect(cls).toContain('opacity-100')
      expect(cls).toContain('scale-100')
      expect(cls).not.toContain('opacity-0')
    })
  })

  describe('@error → fallback block + spinner gating', () => {
    it('shows the error fallback with the default text after an image error', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      expect(w.find('.pi-image').exists()).toBe(false)

      await w.find('img').trigger('error')
      await nextTick()

      expect(w.find('.pi-image').exists()).toBe(true)
      expect(w.text()).toContain('Image unavailable')
    })

    it('uses a custom errorText prop in the fallback block', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base({ errorText: 'Boom' }) })
      await w.find('img').trigger('error')
      await nextTick()
      expect(w.text()).toContain('Boom')
    })

    it('blocks the loading spinner once the image errors (isImageLoading false)', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ showLoadingSpinner: true })
      })
      // Spinner is visible while loading (eager, not yet loaded/errored).
      expect(w.find('.animate-spin').exists()).toBe(true)

      await w.find('img').trigger('error')
      await nextTick()

      // error → isImageLoading computes false → spinner gone.
      expect(w.find('.animate-spin').exists()).toBe(false)
    })
  })

  describe('loading spinner', () => {
    it('is hidden by default even while the image is loading', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      expect(w.find('.animate-spin').exists()).toBe(false)
    })

    it('shows while loading and hides after a successful load', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ showLoadingSpinner: true })
      })
      expect(w.find('.animate-spin').exists()).toBe(true)

      await w.find('img').trigger('load')
      await nextTick()

      expect(w.find('.animate-spin').exists()).toBe(false)
    })
  })

  describe('gradient placeholder toggle', () => {
    it('renders the placeholder by default', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      expect(w.find('.gradient-placeholder').exists()).toBe(true)
    })

    it('omits the placeholder when showPlaceholder is false', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ showPlaceholder: false })
      })
      expect(w.find('.gradient-placeholder').exists()).toBe(false)
    })
  })

  describe('overlay slot', () => {
    it('does not render the overlay wrapper when no overlay slot is provided', async () => {
      const w = await mountSuspended(ProgressiveImage, { props: base() })
      expect(w.find('.z-10').exists()).toBe(false)
    })

    it('renders the overlay slot and exposes reactive {loaded, loading, error} scope', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base(),
        slots: {
          overlay: (p: { loaded: boolean; loading: boolean; error: boolean }) =>
            `loaded:${p.loaded} loading:${p.loading} error:${p.error}`
        }
      })
      expect(w.find('.z-10').text()).toBe('loaded:false loading:true error:false')

      await w.find('img').trigger('load')
      await nextTick()

      expect(w.find('.z-10').text()).toBe('loaded:true loading:false error:false')
    })
  })

  describe('container class', () => {
    it('applies the containerClass to the root container', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ containerClass: 'my-frame' })
      })
      const root = w.find('.progressive-image-container')
      expect(root.classes()).toContain('my-frame')
    })

    it('applies imageClass onto the rendered <img>', async () => {
      const w = await mountSuspended(ProgressiveImage, {
        props: base({ imageClass: 'rounded-xl' })
      })
      expect(w.find('img').attributes('class')).toContain('rounded-xl')
    })
  })
})
