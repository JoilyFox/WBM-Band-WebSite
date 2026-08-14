// @vitest-environment nuxt
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TeamMemberCard from '~/components/team/TeamMemberCard.vue'
import type { TeamMember } from '~/data/teamMembers'
import {
  HOVER_DEBOUNCE_MS,
  TRANSITION_DURATION_MS,
  AUTO_ROTATION_INTERVAL_MS
} from '~/constants/teamConfig'
import { setTestLocale } from './helpers/i18n'

// TeamMemberCard renders a square portrait with a hover/role overlay. It is a
// role="button" tabindex="0" element so it must be operable by keyboard: Enter
// AND Space both emit 'click', and Space additionally preventDefault()s so the
// page doesn't scroll. A click obviously also emits 'click'. Beyond activation
// it owns image state: an initial portrait that fades in on @load, a crossfade
// to a random hover image on (debounced) mouse enter that excludes the last
// hover image shown, a return-to-base on mouse leave, and a mobile-only
// auto-rotate cycle exposed via startAutoRotation / pauseAutoRotation /
// resumeAutoRotation.
//
// i18n is LIVE in the nuxt env and resolves to ENGLISH by default, so $t() on
// the member name/role keys returns the English strings from locales/en.json
// (e.g. team.members.bohdan.name === 'Bohdan'). resolveUrl() comes from
// useAssetUrl(); under the test runtime baseURL is '/', so absolute '/images/…'
// paths pass through unchanged and external https URLs are returned verbatim.

const makeMember = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  id: 1,
  nameKey: 'team.members.bohdan.name',
  roleKey: 'team.members.bohdan.role',
  mainImages: ['/images/optimized/our-team/bohdan/main-1.jpg'],
  hoverImages: [
    '/images/optimized/our-team/bohdan/hover-1.jpg',
    '/images/optimized/our-team/bohdan/hover-2.jpg',
    '/images/optimized/our-team/bohdan/hover-3.jpg'
  ],
  ...overrides
})

// Default mount props for a desktop (hover-capable) card. The component decides
// mobile vs desktop from window.matchMedia('(hover: none) and (pointer: coarse)')
// at onMounted; we stub matchMedia per test to drive that branch.
const mountCard = (memberOverrides: Partial<TeamMember> = {}, extraProps = {}) =>
  mountSuspended(TeamMemberCard, {
    props: {
      member: makeMember(memberOverrides),
      index: 0,
      initialImage: '/images/optimized/our-team/bohdan/main-1.jpg',
      ...extraProps
    }
  })

// Force the matchMedia(...).matches result the component reads in detectMobile().
// hover:none/pointer:coarse → mobile=true; anything else → mobile=false.
const stubMatchMedia = (isMobile: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('hover: none') ? isMobile : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia
}

// This file asserts the ENGLISH copy, so it states the locale explicitly and
// loads that bundle ONCE, before any test installs fake timers. It used to
// inherit English by accident via browser-language detection — the same
// mechanism that made Googlebot render the English home at `/`, now switched
// off (docs/search-console.md). The app's real default locale is 'ua'.
beforeAll(async () => {
  await setTestLocale('en')
})

describe('TeamMemberCard.vue', () => {
  beforeEach(() => {
    // Desktop by default; mobile-specific tests override this before mounting.
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders the localized name and role (locale pinned to en)', async () => {
      const w = await mountCard()
      expect(w.get('.member-name').text()).toBe('Bohdan')
      expect(w.get('.member-role').text()).toBe('Solo Guitarist')
    })

    it('is an operable button: role="button" and tabindex="0"', async () => {
      const w = await mountCard()
      const root = w.get('.team-member-card')
      expect(root.attributes('role')).toBe('button')
      expect(root.attributes('tabindex')).toBe('0')
    })

    it('renders the initial portrait with src = initialImage and the name as alt', async () => {
      const w = await mountCard()
      const img = w.get('img.member-image')
      expect(img.attributes('src')).toBe('/images/optimized/our-team/bohdan/main-1.jpg')
      expect(img.attributes('alt')).toBe('Bohdan')
      expect(img.attributes('loading')).toBe('lazy')
    })

    it('does not render the crossfade (next) image initially', async () => {
      const w = await mountCard()
      // nextImage starts null → the v-if'd second <img> is absent.
      expect(w.findAll('img.member-image-next')).toHaveLength(0)
      expect(w.findAll('img.member-image')).toHaveLength(1)
    })
  })

  describe('initial portrait fade-in', () => {
    it('starts hidden and becomes visible after the image @load fires', async () => {
      const w = await mountCard()
      const img = w.get('img.member-image')
      // initialLoaded is false until @load → the image-visible class is absent.
      expect(img.classes()).not.toContain('image-visible')

      await img.trigger('load')

      expect(w.get('img.member-image').classes()).toContain('image-visible')
    })
  })

  describe('click activation', () => {
    it('emits a single "click" carrying the member on a real click', async () => {
      const member = makeMember({ id: 99 })
      const w = await mountSuspended(TeamMemberCard, {
        props: {
          member,
          index: 0,
          initialImage: '/images/optimized/our-team/bohdan/main-1.jpg'
        }
      })
      await w.get('.team-member-card').trigger('click')
      const events = w.emitted('click')
      expect(events).toHaveLength(1)
      // Payload is the exact member prop reference.
      expect(events![0][0]).toBe(member)
    })
  })

  describe('keyboard accessibility', () => {
    it('emits "click" with the member when Enter is pressed', async () => {
      const member = makeMember({ id: 7 })
      const w = await mountSuspended(TeamMemberCard, {
        props: {
          member,
          index: 0,
          initialImage: '/images/optimized/our-team/bohdan/main-1.jpg'
        }
      })
      await w.get('.team-member-card').trigger('keydown', { key: 'Enter' })
      const events = w.emitted('click')
      expect(events).toHaveLength(1)
      expect(events![0][0]).toBe(member)
    })

    it('emits "click" with the member when Space is pressed', async () => {
      const member = makeMember({ id: 8 })
      const w = await mountSuspended(TeamMemberCard, {
        props: {
          member,
          index: 0,
          initialImage: '/images/optimized/our-team/bohdan/main-1.jpg'
        }
      })
      await w.get('.team-member-card').trigger('keydown', { key: ' ' })
      const events = w.emitted('click')
      expect(events).toHaveLength(1)
      expect(events![0][0]).toBe(member)
    })

    it('preventDefault()s on Space so the page does not scroll', async () => {
      const w = await mountCard()
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
      const preventSpy = vi.spyOn(event, 'preventDefault')
      w.get('.team-member-card').element.dispatchEvent(event)
      expect(preventSpy).toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(true)
    })

    it('preventDefault()s on Enter (consistent .prevent modifier)', async () => {
      const w = await mountCard()
      const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
      const preventSpy = vi.spyOn(event, 'preventDefault')
      w.get('.team-member-card').element.dispatchEvent(event)
      expect(preventSpy).toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(true)
    })

    it('does NOT emit "click" for an unrelated key (e.g. Tab)', async () => {
      const w = await mountCard()
      await w.get('.team-member-card').trigger('keydown', { key: 'Tab' })
      expect(w.emitted('click')).toBeUndefined()
    })
  })

  describe('hover crossfade (desktop)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    // changeImage() stages nextImage, kicks off a crossfade across a
    // double-rAF, then after TRANSITION_DURATION_MS commits nextImage as
    // currentImage and tears the crossfade layer down. The mid-flight
    // `member-image-next` element is transient and fragile to catch under fake
    // timers (flushing pending timers also fires the commit), so these tests
    // assert the STABLE committed `member-image` src after the transition.

    it('crossfades to a hover image after the debounce delay and commits it', async () => {
      // Deterministic randomness: Math.random() === 0 → first eligible image.
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard()

      await w.get('.team-member-card').trigger('mouseenter')
      // Nothing changes until the hover debounce elapses.
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/main-1.jpg'
      )

      // Debounce → changeImage → double-rAF → commit timeout. Flushing all
      // pending timers drives it to the committed end state.
      await vi.advanceTimersByTimeAsync(HOVER_DEBOUNCE_MS)
      await vi.runOnlyPendingTimersAsync()
      await nextTick()

      // The committed portrait is now hover-1 and no crossfade layer remains.
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/hover-1.jpg'
      )
      expect(w.findAll('img.member-image-next')).toHaveLength(0)
    })

    it('does nothing on hover when the member has no hoverImages', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard({ hoverImages: undefined })

      await w.get('.team-member-card').trigger('mouseenter')
      await vi.advanceTimersByTimeAsync(HOVER_DEBOUNCE_MS)
      await vi.runOnlyPendingTimersAsync()
      await nextTick()

      // No hover images → handler returns early; portrait is unchanged.
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/main-1.jpg'
      )
      expect(w.findAll('img.member-image-next')).toHaveLength(0)
    })

    it('cancels the pending hover when the mouse leaves before the debounce fires', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard()

      await w.get('.team-member-card').trigger('mouseenter')
      // Leave before HOVER_DEBOUNCE_MS elapses → debounce timer is cleared.
      await w.get('.team-member-card').trigger('mouseleave')

      await vi.advanceTimersByTimeAsync(HOVER_DEBOUNCE_MS)
      await vi.runOnlyPendingTimersAsync()
      await nextTick()

      // The hover image change never started — still the base portrait.
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/main-1.jpg'
      )
      expect(w.findAll('img.member-image-next')).toHaveLength(0)
    })

    it('selectRandomImage excludes the previously shown hover image', async () => {
      const w = await mountCard()

      // --- first hover: random index 0 of [hover-1, hover-2, hover-3] → hover-1
      vi.spyOn(Math, 'random').mockReturnValue(0)
      await w.get('.team-member-card').trigger('mouseenter')
      await vi.advanceTimersByTimeAsync(HOVER_DEBOUNCE_MS)
      await vi.runOnlyPendingTimersAsync()
      await nextTick()
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/hover-1.jpg'
      )

      // Leave back to base so isHovering resets and lastHoverImage stays hover-1.
      await w.get('.team-member-card').trigger('mouseleave')
      await vi.runOnlyPendingTimersAsync()
      await nextTick()
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/main-1.jpg'
      )

      // --- second hover: lastHoverImage is hover-1, so the candidate pool is
      // filtered to [hover-2, hover-3]. random 0 → the FIRST of the filtered
      // list, which is hover-2 (proves hover-1 was excluded, not just index 0).
      await w.get('.team-member-card').trigger('mouseenter')
      await vi.advanceTimersByTimeAsync(HOVER_DEBOUNCE_MS)
      await vi.runOnlyPendingTimersAsync()
      await nextTick()
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/hover-2.jpg'
      )
    })

    it('returns to the base portrait on mouse leave after a hover change', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard()

      await w.get('.team-member-card').trigger('mouseenter')
      await vi.advanceTimersByTimeAsync(HOVER_DEBOUNCE_MS)
      await vi.runOnlyPendingTimersAsync()
      await nextTick()
      // Now showing hover-1.
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/hover-1.jpg'
      )

      await w.get('.team-member-card').trigger('mouseleave')
      await vi.runOnlyPendingTimersAsync()
      await nextTick()
      // Back to the base main image.
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/main-1.jpg'
      )
    })
  })

  describe('mobile behavior', () => {
    beforeEach(() => {
      stubMatchMedia(true)
      vi.useFakeTimers()
    })

    it('ignores mouse enter on mobile (no hover crossfade)', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard()

      await w.get('.team-member-card').trigger('mouseenter')
      await vi.advanceTimersByTimeAsync(HOVER_DEBOUNCE_MS)
      await vi.runOnlyPendingTimersAsync()

      // handleMouseEnter early-returns when isMobile → no crossfade.
      expect(w.findAll('img.member-image-next')).toHaveLength(0)
    })

    // NOTE: once the rotation setInterval is live, vi.runOnlyPendingTimersAsync()
    // would loop firing tick after tick. These tests therefore advance time by
    // EXACT amounts (one interval, then one transition to commit) and flush Vue
    // reactivity with nextTick, never runOnlyPendingTimers.

    it('auto-rotates through main+hover images on mobile after the start delay', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      // main-1 + hover-1/2/3 → 4 resolved images, so rotation actually runs.
      const w = await mountCard()
      const exposed = w.vm as unknown as {
        startAutoRotation: (d: number) => void
      }

      // startAutoRotation defers the setInterval setup by `delay` (0) ms.
      exposed.startAutoRotation(0)
      await vi.advanceTimersByTimeAsync(0)

      // First interval tick: currentIndex 0 → 1 = allImages[1] = hover-1.
      await vi.advanceTimersByTimeAsync(AUTO_ROTATION_INTERVAL_MS)
      // changeImage commits after the transition window.
      await vi.advanceTimersByTimeAsync(TRANSITION_DURATION_MS)
      await nextTick()

      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/hover-1.jpg'
      )
    })

    it('does not auto-rotate when there is only a single image', async () => {
      // initialImage must match the lone main image so we assert the true
      // starting portrait, not the unrelated default prop.
      const w = await mountCard(
        { mainImages: ['/images/solo.jpg'], hoverImages: undefined },
        { initialImage: '/images/solo.jpg' }
      )
      const exposed = w.vm as unknown as { startAutoRotation: (d: number) => void }

      exposed.startAutoRotation(0)
      await vi.advanceTimersByTimeAsync(0)
      // Advancing well past several intervals must not change anything because
      // allImages.length <= 1 → the setInterval is never scheduled.
      await vi.advanceTimersByTimeAsync(AUTO_ROTATION_INTERVAL_MS * 3)
      await nextTick()

      expect(w.get('img.member-image').attributes('src')).toBe('/images/solo.jpg')
      expect(w.findAll('img.member-image-next')).toHaveLength(0)
    })

    it('pauseAutoRotation stops the rotation cycle', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard()
      const exposed = w.vm as unknown as {
        startAutoRotation: (d: number) => void
        pauseAutoRotation: () => void
      }

      exposed.startAutoRotation(0)
      await vi.advanceTimersByTimeAsync(0)

      // Pause before any interval tick fires.
      exposed.pauseAutoRotation()
      // Advancing well past several intervals must not change the image.
      await vi.advanceTimersByTimeAsync(AUTO_ROTATION_INTERVAL_MS * 3)
      await nextTick()

      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/main-1.jpg'
      )
    })

    it('resumeAutoRotation restarts rotation immediately (no start delay)', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard()
      const exposed = w.vm as unknown as { resumeAutoRotation: () => void }

      // resume calls startAutoRotation(0) → setInterval registers after the 0ms
      // start hop.
      exposed.resumeAutoRotation()
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(AUTO_ROTATION_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(TRANSITION_DURATION_MS)
      await nextTick()

      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/hover-1.jpg'
      )
    })
  })

  describe('exposed control on desktop', () => {
    it('resumeAutoRotation is a no-op on desktop (rotation is mobile-only)', async () => {
      vi.useFakeTimers()
      stubMatchMedia(false)
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const w = await mountCard()
      const exposed = w.vm as unknown as { resumeAutoRotation: () => void }

      exposed.resumeAutoRotation()
      await vi.advanceTimersByTimeAsync(AUTO_ROTATION_INTERVAL_MS * 2)
      await vi.runOnlyPendingTimersAsync()

      // !isMobile → startAutoRotation returns early → portrait unchanged.
      expect(w.get('img.member-image').attributes('src')).toBe(
        '/images/optimized/our-team/bohdan/main-1.jpg'
      )
    })
  })
})
