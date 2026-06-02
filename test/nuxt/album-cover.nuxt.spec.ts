// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useI18n } from 'vue-i18n'
import AlbumCover from '~/components/ui/AlbumCover.vue'
import type { MusicRelease } from '~/data/musicLibrary'

// AlbumCover renders a release cover via <ProgressiveImage>, an optional
// release-type badge (<AppBadge>), and swaps to a "no image" fallback block when
// the underlying image errors. We exercise three behaviours against the LIVE
// vue-i18n instance shared by the nuxt test runtime:
//   • badgeVariant      → maps releaseType to an AppBadge variant (single/album/ep,
//                          everything else → 'glass'); case-insensitive.
//   • displayTypeName   → uses the music.types.<key> i18n string (key built by
//                          lower-casing + space→underscore), with a raw-key
//                          fallback when no translation exists.
//   • handleImageError  → flips an internal flag, hiding ProgressiveImage and
//                          showing the fallback block.
//
// IMPORTANT — observed runtime locale: in this nuxt Vitest environment the GLOBAL
// vue-i18n composer resolves to ENGLISH by default (a mounted AlbumCover with
// type 'single' renders the badge text "Single", and the fallback copy is
// "No Image"). The component-under-test reads `t`/`locale` from the same global
// composer, so we assert the ENGLISH strings it actually produces and exercise
// the Ukrainian path by explicitly flipping the shared locale (then restoring).
//
// AppBadge (unstyled → renders a <span>) encodes its variant in a stable Tailwind
// background class, so we read the variant off that span. variant → class anchors:
const VARIANT_CLASS = {
  single: 'bg-blue-600/40',
  album: 'bg-purple-600/40',
  ep: 'bg-pink-600/40',
  glass: 'bg-black/70'
} as const

const baseProps = (overrides: Record<string, unknown> = {}) => ({
  imageUrl: '/images/optimized/albums-images/test/cover.avif',
  alt: 'Test cover',
  releaseType: 'single' as MusicRelease['type'],
  ...overrides
})

// useI18n() may only be called inside a component setup in this runtime, so we
// flip the shared global locale through a throwaway component and restore it
// after each test that touches it.
const setGlobalLocale = async (value: 'ua' | 'en') => {
  const Probe = defineComponent({
    setup() {
      const { locale } = useI18n({ useScope: 'global' })
      locale.value = value
      return () => h('span')
    }
  })
  await mountSuspended(Probe)
}

describe('AlbumCover', () => {
  afterEach(async () => {
    // Tests share one global i18n composer; keep the suite order-independent.
    await setGlobalLocale('en')
  })

  describe('badgeVariant mapping', () => {
    it("maps releaseType 'single' to the single badge variant", async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'single' }) })
      expect(w.get('.top-2.left-2 span').classes()).toContain(VARIANT_CLASS.single)
    })

    it("maps releaseType 'album' to the album badge variant", async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'album' }) })
      expect(w.get('.top-2.left-2 span').classes()).toContain(VARIANT_CLASS.album)
    })

    it("maps releaseType 'ep' to the ep badge variant", async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'ep' }) })
      expect(w.get('.top-2.left-2 span').classes()).toContain(VARIANT_CLASS.ep)
    })

    it("falls back to the 'glass' variant for a multi-word type ('new release')", async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ releaseType: 'new release' })
      })
      const classes = w.get('.top-2.left-2 span').classes()
      expect(classes).toContain(VARIANT_CLASS.glass)
      expect(classes).not.toContain(VARIANT_CLASS.single)
    })

    it("falls back to the 'glass' variant for an unknown type ('mixtape')", async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ releaseType: 'mixtape' as unknown as MusicRelease['type'] })
      })
      expect(w.get('.top-2.left-2 span').classes()).toContain(VARIANT_CLASS.glass)
    })

    it('lower-cases the type before matching (case-insensitive)', async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ releaseType: 'Single' as unknown as MusicRelease['type'] })
      })
      expect(w.get('.top-2.left-2 span').classes()).toContain(VARIANT_CLASS.single)
    })

    it("falls back to 'glass' when releaseType is empty", async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ releaseType: '' as unknown as MusicRelease['type'] })
      })
      expect(w.get('.top-2.left-2 span').classes()).toContain(VARIANT_CLASS.glass)
    })
  })

  describe('displayTypeName (i18n key + fallback)', () => {
    it("renders the i18n label for 'single' (English in this runtime)", async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'single' }) })
      expect(w.get('.top-2.left-2 span').text()).toBe('Single')
    })

    it("renders the i18n label for 'album'", async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'album' }) })
      expect(w.get('.top-2.left-2 span').text()).toBe('Album')
    })

    it("renders 'EP' for the ep type", async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'ep' }) })
      expect(w.get('.top-2.left-2 span').text()).toBe('EP')
    })

    it("normalises spaces to underscores → resolves 'new release' to music.types.new_release", async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ releaseType: 'new release' })
      })
      // The space→underscore key is what makes this an i18n HIT ('New release')
      // rather than the raw-key fallback ('new release').
      expect(w.get('.top-2.left-2 span').text()).toBe('New release')
    })

    it('falls back to the raw normalised key for a type with no translation', async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ releaseType: 'mixtape' as unknown as MusicRelease['type'] })
      })
      // i18n miss → no map entry → returns the raw lower-cased key.
      expect(w.get('.top-2.left-2 span').text()).toBe('mixtape')
    })

    it("normalises an unknown multi-word type's spaces in the raw fallback", async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ releaseType: 'live session' as unknown as MusicRelease['type'] })
      })
      expect(w.get('.top-2.left-2 span').text()).toBe('live_session')
    })

    it("renders the Ukrainian i18n label when the global locale is 'ua'", async () => {
      await setGlobalLocale('ua')
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'album' }) })
      // music.types.album in locales/uk.json
      expect(w.get('.top-2.left-2 span').text()).toBe('Альбом')
    })

    it("renders 'Сингл' for single under the 'ua' locale", async () => {
      await setGlobalLocale('ua')
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'single' }) })
      expect(w.get('.top-2.left-2 span').text()).toBe('Сингл')
    })
  })

  describe('showBadge prop', () => {
    it('renders the badge by default (showBadge defaults to true)', async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps() })
      expect(w.find('.top-2.left-2 span').exists()).toBe(true)
    })

    it('hides the badge when showBadge is false', async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ showBadge: false }) })
      expect(w.find('.top-2.left-2').exists()).toBe(false)
    })
  })

  describe('handleImageError → fallback swap', () => {
    it('shows ProgressiveImage and no fallback on a healthy mount', async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps() })
      // The "no image" fallback uses a pi-image icon; absent until an error fires.
      expect(w.find('.pi-image').exists()).toBe(false)
      expect(w.findComponent({ name: 'ProgressiveImage' }).exists()).toBe(true)
    })

    it('swaps to the fallback block (with no_image label) when the image errors', async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps() })
      // ProgressiveImage's @error bubbles to AlbumCover's handleImageError, which
      // flips imageError → the v-else fallback renders.
      w.findComponent({ name: 'ProgressiveImage' }).vm.$emit('error')
      await w.vm.$nextTick()

      expect(w.find('.pi-image').exists()).toBe(true)
      // English fallback copy from music.album_cover.no_image
      expect(w.text()).toContain('No Image')
      // ProgressiveImage is gone (v-if="!imageError")
      expect(w.findComponent({ name: 'ProgressiveImage' }).exists()).toBe(false)
    })

    it('keeps the badge visible after the image errors', async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps({ releaseType: 'album' }) })
      w.findComponent({ name: 'ProgressiveImage' }).vm.$emit('error')
      await w.vm.$nextTick()
      // Badge lives outside the image v-if/v-else, so it survives the swap.
      expect(w.get('.top-2.left-2 span').text()).toBe('Album')
      expect(w.get('.top-2.left-2 span').classes()).toContain(VARIANT_CLASS.album)
    })
  })

  describe('prop pass-through to ProgressiveImage', () => {
    it('forwards imageUrl as src and alt to the underlying ProgressiveImage', async () => {
      const w = await mountSuspended(AlbumCover, {
        props: baseProps({ imageUrl: '/images/x/cover.avif', alt: 'My cover alt' })
      })
      const img = w.findComponent({ name: 'ProgressiveImage' })
      expect(img.props('src')).toBe('/images/x/cover.avif')
      expect(img.props('alt')).toBe('My cover alt')
    })

    it('passes the album sizes preset string to ProgressiveImage', async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps() })
      const img = w.findComponent({ name: 'ProgressiveImage' })
      // IMAGE_SIZES.album from utils/imageHelpers
      expect(img.props('sizes')).toBe('(max-width: 640px) 60vw, (max-width: 1024px) 40vw, 360px')
    })

    it("uses lazy loading and the 'album' preset on the cover image", async () => {
      const w = await mountSuspended(AlbumCover, { props: baseProps() })
      const img = w.findComponent({ name: 'ProgressiveImage' })
      expect(img.props('loading')).toBe('lazy')
      expect(img.props('preset')).toBe('album')
    })
  })
})
