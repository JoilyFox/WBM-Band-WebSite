// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref, nextTick } from 'vue'
import type { Ref } from 'vue'
import { useHeroSlider } from '~/composables/useHeroSlider'
import type { HeroImage, SliderOptions } from '~/composables/useHeroSlider'
import { useScrollTo } from '~/composables/useScrollTo'

// ---------------------------------------------------------------------------
// Two pure-ish index-math composables share this file.
//
//   useHeroSlider  — next/prev/goToSlide wraparound math over a reactive image
//                    set, plus the reset/clamp behaviour when the set's length
//                    changes. It registers onMounted/onUnmounted, so it MUST be
//                    instantiated inside a real mounted component (a tiny
//                    harness whose setup() calls it and exposes the result).
//
//   useScrollTo    — offset/clamp scroll maths (rect.top + pageYOffset - offset,
//                    clamped >= 0; default offset 64) and the missing-element
//                    warning path. No setup context needed for scrollToElement /
//                    scrollToPosition / scrollToTop. scrollToElementWithNavigation
//                    reaches for useRoute()/useRouter() auto-imports, mocked here.
// ---------------------------------------------------------------------------

// useScrollTo's navigation variant calls useRoute()/useRouter(). A single mutable
// routeState lets tests flip the current path; pushMock captures router.push. The
// routerStub exposes afterEach/beforeEach because the test-utils bootstrap calls
// useRouter().afterEach() during setup and a bare { push } stub would crash the file.
const { routeState, pushMock, routerStub } = vi.hoisted(() => {
  const pushMock = vi.fn(() => Promise.resolve())
  return {
    routeState: { path: '/' as string },
    pushMock,
    routerStub: {
      push: pushMock,
      afterEach: () => () => {},
      beforeEach: () => () => {},
      replace: vi.fn(() => Promise.resolve())
    }
  }
})

mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useRouter', () => () => routerStub)

// Mount a throwaway component whose setup() runs useHeroSlider, so onMounted/
// onUnmounted have a real lifecycle. The source ref is created OUTSIDE and passed
// in, so a test can mutate it and observe the watch() reset. The composable's
// return object is exposed on the component instance for assertions.
type SliderApi = ReturnType<typeof useHeroSlider>
async function mountSlider(source: Ref<HeroImage[]>, options?: SliderOptions) {
  let captured: SliderApi | undefined
  const Harness = defineComponent({
    setup() {
      captured = useHeroSlider(source, options)
      return () => h('div')
    }
  })
  const w = await mountSuspended(Harness)
  return { w, api: captured as SliderApi }
}

const img = (n: number): HeroImage => ({ src: `/img-${n}.jpg`, alt: `image ${n}` })
const makeImages = (count: number) => Array.from({ length: count }, (_, i) => img(i))

describe('useHeroSlider', () => {
  // autoPlay defaults to true and onMounted starts a real setInterval; fake timers
  // keep the file deterministic and prevent leaked intervals between tests.
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts at index 0 with sensible derived state', async () => {
      const source = ref(makeImages(3))
      const { api } = await mountSlider(source, { autoPlay: false })
      expect(api.currentIndex.value).toBe(0)
      expect(api.totalImages.value).toBe(3)
      expect(api.canSlide.value).toBe(true)
      expect(api.currentImage.value).toEqual(img(0))
      expect(api.isPaused.value).toBe(false)
      expect(api.isTransitioning.value).toBe(false)
    })

    it('isPlaying mirrors the autoPlay option', async () => {
      const on = await mountSlider(ref(makeImages(3)), { autoPlay: true })
      expect(on.api.isPlaying.value).toBe(true)
      const off = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      expect(off.api.isPlaying.value).toBe(false)
    })

    it('canSlide is false for a single-image set', async () => {
      const { api } = await mountSlider(ref(makeImages(1)), { autoPlay: false })
      expect(api.canSlide.value).toBe(false)
      expect(api.totalImages.value).toBe(1)
    })

    it('exposes transition + interval config straight through', async () => {
      const { api } = await mountSlider(ref(makeImages(2)), {
        autoPlay: false,
        transition: 'zoom',
        interval: 1234
      })
      expect(api.transition).toBe('zoom')
      expect(api.interval).toBe(1234)
    })
  })

  describe('nextSlide / previousSlide wraparound', () => {
    it('nextSlide advances by one', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      api.nextSlide()
      expect(api.currentIndex.value).toBe(1)
      api.nextSlide()
      expect(api.currentIndex.value).toBe(2)
    })

    it('nextSlide wraps from the last index back to 0', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      api.goToSlide(2)
      expect(api.currentIndex.value).toBe(2)
      api.nextSlide()
      expect(api.currentIndex.value).toBe(0)
    })

    it('previousSlide wraps from index 0 to the last index', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      expect(api.currentIndex.value).toBe(0)
      api.previousSlide()
      expect(api.currentIndex.value).toBe(2)
    })

    it('previousSlide steps back by one in the middle of the set', async () => {
      const { api } = await mountSlider(ref(makeImages(4)), { autoPlay: false })
      api.goToSlide(2)
      api.previousSlide()
      expect(api.currentIndex.value).toBe(1)
    })

    it('next then previous returns to the original index (round trip)', async () => {
      const { api } = await mountSlider(ref(makeImages(5)), { autoPlay: false })
      api.goToSlide(3)
      api.nextSlide() // 3 -> 4
      api.previousSlide() // 4 -> 3
      expect(api.currentIndex.value).toBe(3)
    })

    it('a full forward lap returns to index 0', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      api.nextSlide() // 0 -> 1
      api.nextSlide() // 1 -> 2
      api.nextSlide() // 2 -> 0 (wrap)
      expect(api.currentIndex.value).toBe(0)
    })
  })

  describe('goToSlide guards', () => {
    it('jumps to a valid in-range index', async () => {
      const { api } = await mountSlider(ref(makeImages(4)), { autoPlay: false })
      api.goToSlide(3)
      expect(api.currentIndex.value).toBe(3)
    })

    it('ignores a negative index', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      api.goToSlide(-1)
      expect(api.currentIndex.value).toBe(0)
    })

    it('ignores an index >= length', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      api.goToSlide(3)
      expect(api.currentIndex.value).toBe(0)
      api.goToSlide(99)
      expect(api.currentIndex.value).toBe(0)
    })

    it('is a no-op (no progressKey bump) when targeting the current index', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      const before = api.progressKey.value
      api.goToSlide(0)
      expect(api.currentIndex.value).toBe(0)
      expect(api.progressKey.value).toBe(before)
    })

    it('bumps progressKey when it actually changes slides', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      const before = api.progressKey.value
      api.goToSlide(2)
      expect(api.progressKey.value).toBe(before + 1)
    })

    it('sets isTransitioning true, then clears it after transitionDuration', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), {
        autoPlay: false,
        transitionDuration: 500
      })
      api.goToSlide(1)
      expect(api.isTransitioning.value).toBe(true)
      vi.advanceTimersByTime(499)
      expect(api.isTransitioning.value).toBe(true)
      vi.advanceTimersByTime(1)
      expect(api.isTransitioning.value).toBe(false)
    })
  })

  describe('currentImage / nextImage / previousImage computeds', () => {
    it('reflect the wraparound neighbours at index 0', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      expect(api.currentImage.value).toEqual(img(0))
      expect(api.nextImage.value).toEqual(img(1))
      expect(api.previousImage.value).toEqual(img(2)) // wraps to last
    })

    it('reflect the wraparound neighbours at the last index', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      api.goToSlide(2)
      expect(api.currentImage.value).toEqual(img(2))
      expect(api.nextImage.value).toEqual(img(0)) // wraps to first
      expect(api.previousImage.value).toEqual(img(1))
    })
  })

  describe('autoplay timer advances slides', () => {
    it('advances to the next slide each interval tick', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), {
        autoPlay: true,
        interval: 1000
      })
      expect(api.currentIndex.value).toBe(0)
      vi.advanceTimersByTime(1000)
      expect(api.currentIndex.value).toBe(1)
      vi.advanceTimersByTime(1000)
      expect(api.currentIndex.value).toBe(2)
      vi.advanceTimersByTime(1000)
      expect(api.currentIndex.value).toBe(0) // wraps
    })

    it('does NOT start a timer when canSlide is false (single image)', async () => {
      const { api } = await mountSlider(ref(makeImages(1)), {
        autoPlay: true,
        interval: 1000
      })
      vi.advanceTimersByTime(5000)
      expect(api.currentIndex.value).toBe(0)
    })

    it('stopAutoPlay halts further automatic advancement', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), {
        autoPlay: true,
        interval: 1000
      })
      vi.advanceTimersByTime(1000)
      expect(api.currentIndex.value).toBe(1)
      api.stopAutoPlay()
      vi.advanceTimersByTime(5000)
      expect(api.currentIndex.value).toBe(1)
    })
  })

  describe('toggleAutoPlay', () => {
    it('toggles isPlaying off then back on', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), {
        autoPlay: true,
        interval: 1000
      })
      api.toggleAutoPlay()
      expect(api.isPlaying.value).toBe(false)
      vi.advanceTimersByTime(3000)
      expect(api.currentIndex.value).toBe(0) // paused, no advance

      api.toggleAutoPlay()
      expect(api.isPlaying.value).toBe(true)
      vi.advanceTimersByTime(1000)
      expect(api.currentIndex.value).toBe(1) // resumed
    })
  })

  describe('pause / resume flags', () => {
    it('pauseAutoPlay flips isPaused without stopping isPlaying', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: true })
      api.pauseAutoPlay()
      expect(api.isPaused.value).toBe(true)
      expect(api.isPlaying.value).toBe(true)
    })

    it('resumeAutoPlay clears isPaused and bumps progressKey while playing', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: true })
      api.pauseAutoPlay()
      const key = api.progressKey.value
      api.resumeAutoPlay()
      expect(api.isPaused.value).toBe(false)
      expect(api.progressKey.value).toBe(key + 1)
    })
  })

  describe('getSlideProgress', () => {
    it('returns 100 for the active slide while playing and not paused', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: true })
      expect(api.getSlideProgress(0)).toBe(100)
      expect(api.getSlideProgress(1)).toBe(0)
    })

    it('returns 0 for every slide when paused', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: true })
      api.pauseAutoPlay()
      expect(api.getSlideProgress(0)).toBe(0)
    })

    it('returns 0 for every slide when not playing', async () => {
      const { api } = await mountSlider(ref(makeImages(3)), { autoPlay: false })
      expect(api.getSlideProgress(0)).toBe(0)
    })
  })

  describe('reset/clamp when the image set length changes', () => {
    it('resets currentIndex to 0 when the set shrinks below the current index', async () => {
      const source = ref(makeImages(5))
      const { api } = await mountSlider(source, { autoPlay: false })
      api.goToSlide(4)
      expect(api.currentIndex.value).toBe(4)

      // Swap to a shorter set (e.g. horizontal -> vertical rotation). The watch on
      // images.value.length resets the index so it can never dangle out of range.
      source.value = makeImages(2)
      await nextTick()
      expect(api.currentIndex.value).toBe(0)
      expect(api.totalImages.value).toBe(2)
    })

    it('bumps progressKey when the length changes', async () => {
      const source = ref(makeImages(3))
      const { api } = await mountSlider(source, { autoPlay: false })
      const key = api.progressKey.value
      source.value = makeImages(4)
      await nextTick()
      expect(api.progressKey.value).toBe(key + 1)
    })

    it('does NOT reset when the set is swapped for an equal-length set', async () => {
      const source = ref(makeImages(4))
      const { api } = await mountSlider(source, { autoPlay: false })
      api.goToSlide(3)
      // Same length (4) → the watch key (length) is unchanged → no reset fires.
      source.value = makeImages(4).map((i) => ({ ...i, alt: `${i.alt}-v2` }))
      await nextTick()
      expect(api.currentIndex.value).toBe(3)
    })

    it('tracks the live image content after a swap (computeds follow the source)', async () => {
      const source = ref(makeImages(3))
      const { api } = await mountSlider(source, { autoPlay: false })
      const replacement: HeroImage[] = [
        { src: '/x.jpg', alt: 'x' },
        { src: '/y.jpg', alt: 'y' }
      ]
      source.value = replacement
      await nextTick()
      expect(api.currentImage.value).toEqual(replacement[0])
      expect(api.nextImage.value).toEqual(replacement[1])
    })

    it('restarts autoplay against the new set after a length change while playing', async () => {
      const source = ref(makeImages(3))
      const { api } = await mountSlider(source, { autoPlay: true, interval: 1000 })
      api.goToSlide(2)
      source.value = makeImages(5)
      await nextTick()
      expect(api.currentIndex.value).toBe(0) // reset by the watch
      vi.advanceTimersByTime(1000)
      expect(api.currentIndex.value).toBe(1) // timer restarted on the new set
    })
  })

  describe('cleanup', () => {
    it('clears the autoplay interval on unmount', async () => {
      const { w, api } = await mountSlider(ref(makeImages(3)), {
        autoPlay: true,
        interval: 1000
      })
      vi.advanceTimersByTime(1000)
      expect(api.currentIndex.value).toBe(1)
      w.unmount()
      vi.advanceTimersByTime(5000)
      // onUnmounted -> stopAutoPlay; the timer no longer fires.
      expect(api.currentIndex.value).toBe(1)
    })
  })
})

describe('useScrollTo', () => {
  // happy-dom provides window.scrollTo / document, but we stub scrollTo to capture
  // its argument and getElementById to inject elements with a known rect/top.
  let scrollToSpy: ReturnType<typeof vi.fn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  // Build a fake element whose getBoundingClientRect().top is a controllable value.
  const fakeEl = (top: number) =>
    ({
      getBoundingClientRect: () => ({ top }) as DOMRect
    }) as unknown as HTMLElement

  beforeEach(() => {
    scrollToSpy = vi.fn()
    vi.stubGlobal('scrollTo', scrollToSpy)
    // window.scrollTo and the global scrollTo are the same binding under happy-dom,
    // but stub the window property too for belt-and-braces.
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
    // pageYOffset is read-only-ish; define it fresh per test.
    Object.defineProperty(window, 'pageYOffset', {
      value: 0,
      configurable: true,
      writable: true
    })
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    pushMock.mockClear()
    routeState.path = '/'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    warnSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe('scrollToElement — offset math', () => {
    it('scrolls to rect.top + pageYOffset - default offset (64), smooth', () => {
      const { scrollToElement } = useScrollTo()
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl(500))
      ;(window as { pageYOffset: number }).pageYOffset = 100

      scrollToElement('target')

      // 500 (rect.top) + 100 (pageYOffset) - 64 (default offset) = 536
      expect(scrollToSpy).toHaveBeenCalledTimes(1)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 536, behavior: 'smooth' })
      getSpy.mockRestore()
    })

    it('honours a custom offset', () => {
      const { scrollToElement } = useScrollTo()
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl(500))
      ;(window as { pageYOffset: number }).pageYOffset = 0

      scrollToElement('target', 20)

      // 500 + 0 - 20 = 480
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 480, behavior: 'smooth' })
      getSpy.mockRestore()
    })

    it('treats a custom offset of 0 as a real offset (not the 64 default)', () => {
      const { scrollToElement } = useScrollTo()
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl(300))
      ;(window as { pageYOffset: number }).pageYOffset = 0

      scrollToElement('target', 0)

      // customOffset ?? 64 keeps 0 (only null/undefined falls through). 300 + 0 - 0 = 300
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 300, behavior: 'smooth' })
      getSpy.mockRestore()
    })

    it('clamps a negative computed position to 0', () => {
      const { scrollToElement } = useScrollTo()
      // Element near the very top: rect.top 10, no scroll, default offset 64 → -54 → 0.
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl(10))
      ;(window as { pageYOffset: number }).pageYOffset = 0

      scrollToElement('target')

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      getSpy.mockRestore()
    })

    it('handles a negative rect.top (element above the viewport) with the page offset', () => {
      const { scrollToElement } = useScrollTo()
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl(-200))
      ;(window as { pageYOffset: number }).pageYOffset = 1000

      scrollToElement('target')

      // -200 + 1000 - 64 = 736
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 736, behavior: 'smooth' })
      getSpy.mockRestore()
    })
  })

  describe('scrollToElement — missing element', () => {
    it('warns and does not scroll when the element is absent', () => {
      const { scrollToElement } = useScrollTo()
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(null)

      scrollToElement('nope')

      expect(scrollToSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith('Element with ID "nope" not found')
      getSpy.mockRestore()
    })
  })

  describe('scrollToPosition / scrollToTop', () => {
    it('scrollToPosition scrolls to the exact position, smooth', () => {
      const { scrollToPosition } = useScrollTo()
      scrollToPosition(420)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 420, behavior: 'smooth' })
    })

    it('scrollToPosition does NOT clamp (passes a negative through verbatim)', () => {
      const { scrollToPosition } = useScrollTo()
      scrollToPosition(-50)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: -50, behavior: 'smooth' })
    })

    it('scrollToTop scrolls to 0', () => {
      const { scrollToTop } = useScrollTo()
      scrollToTop()
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })

  describe('scrollToElementWithNavigation', () => {
    it('scrolls directly without navigating when already on the index page', async () => {
      routeState.path = '/'
      const { scrollToElementWithNavigation } = useScrollTo()
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl(200))
      ;(window as { pageYOffset: number }).pageYOffset = 0

      await scrollToElementWithNavigation('target')

      expect(pushMock).not.toHaveBeenCalled()
      // 200 + 0 - 64 = 136
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 136, behavior: 'smooth' })
      getSpy.mockRestore()
    })

    it('navigates to / first, then scrolls after the post-nav delay', async () => {
      routeState.path = '/listen/some-slug'
      const { scrollToElementWithNavigation } = useScrollTo()
      const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl(300))
      ;(window as { pageYOffset: number }).pageYOffset = 0

      vi.useFakeTimers()
      try {
        await scrollToElementWithNavigation('target')
        expect(pushMock).toHaveBeenCalledWith('/')
        // The scroll is deferred behind a 100ms setTimeout.
        expect(scrollToSpy).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(100)
        // 300 + 0 - 64 = 236
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 236, behavior: 'smooth' })
      } finally {
        vi.useRealTimers()
      }
      getSpy.mockRestore()
    })
  })
})
