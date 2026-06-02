// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CookieConsentToast from '~/components/common/CookieConsentToast.vue'

// useCookieConsent is an EXPLICIT import in the component
// (`import { useCookieConsent } from '~/composables/useCookieConsent'`), so it is
// mocked with vi.mock + hoisted spies. A controllable `isUndecided` ref lets each
// test drive the `visible` computed (delayed && isUndecided) independently of the
// real localStorage-backed singleton.
const { isUndecided, accept, decline, snooze, hydrate } = await vi.hoisted(async () => {
  const { ref: r } = await import('vue')
  return {
    isUndecided: r(true),
    accept: vi.fn(),
    decline: vi.fn(),
    snooze: vi.fn(),
    hydrate: vi.fn()
  }
})

vi.mock('~/composables/useCookieConsent', () => ({
  useCookieConsent: () => ({ isUndecided, accept, decline, snooze, hydrate })
}))

// Build a TouchEvent-like object. happy-dom doesn't ship a usable TouchEvent
// constructor with a populated `touches` list, so we dispatch a plain Event and
// graft the `touches` array the handlers read (`e.touches[0].clientX/Y`,
// `e.touches.length`). `target` defaults to the dispatching element.
function dispatchTouch(
  el: Element,
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  touches: Array<{ clientX: number; clientY: number }>,
  target?: Element
) {
  const ev: any = new Event(type, { bubbles: true, cancelable: true })
  ev.touches = touches
  ev.changedTouches = touches
  if (target) Object.defineProperty(ev, 'target', { value: target })
  el.dispatchEvent(ev)
}

beforeEach(() => {
  isUndecided.value = true
  accept.mockClear()
  decline.mockClear()
  snooze.mockClear()
  hydrate.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CookieConsentToast', () => {
  describe('visibility (delayed && isUndecided)', () => {
    it('is hidden immediately on mount before the 1.2s delay elapses', async () => {
      vi.useFakeTimers()
      const w = await mountSuspended(CookieConsentToast)
      // delayed has not flipped yet → v-if false
      expect(w.find('.cookie-toast').exists()).toBe(false)
    })

    it('calls hydrate() on mount', async () => {
      vi.useFakeTimers()
      await mountSuspended(CookieConsentToast)
      expect(hydrate).toHaveBeenCalledTimes(1)
    })

    it('becomes visible after the delay elapses while undecided', async () => {
      vi.useFakeTimers()
      const w = await mountSuspended(CookieConsentToast)
      expect(w.find('.cookie-toast').exists()).toBe(false)
      vi.advanceTimersByTime(1200)
      await nextTick()
      expect(w.find('.cookie-toast').exists()).toBe(true)
    })

    it('never schedules the reveal when already decided at mount (stays hidden)', async () => {
      vi.useFakeTimers()
      isUndecided.value = false
      const w = await mountSuspended(CookieConsentToast)
      vi.advanceTimersByTime(5000)
      await nextTick()
      // onMounted returns early before setTimeout, so delayed never flips and
      // the toast is never shown.
      expect(w.find('.cookie-toast').exists()).toBe(false)
    })

    it('hides again if isUndecided flips to false after being shown', async () => {
      vi.useFakeTimers()
      const w = await mountSuspended(CookieConsentToast)
      vi.advanceTimersByTime(1200)
      await nextTick()
      expect(w.find('.cookie-toast').exists()).toBe(true)
      isUndecided.value = false
      await nextTick()
      expect(w.find('.cookie-toast').exists()).toBe(false)
    })
  })

  describe('rendered structure & i18n', () => {
    async function mountVisible() {
      vi.useFakeTimers()
      const w = await mountSuspended(CookieConsentToast)
      vi.advanceTimersByTime(1200)
      await nextTick()
      return w
    }

    it('renders dialog role with the consent message and both buttons + details link', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast')
      expect(root.attributes('role')).toBe('dialog')
      expect(root.find('.cookie-toast__message').exists()).toBe(true)
      expect(w.find('.cookie-toast__btn--accept').exists()).toBe(true)
      expect(w.find('.cookie-toast__btn--decline').exists()).toBe(true)
      expect(w.find('.cookie-toast__link').exists()).toBe(true)
    })

    it('renders real localized banner copy (not raw i18n keys)', async () => {
      const w = await mountVisible()
      // The active i18n locale in the bare test runtime can resolve to either
      // bundled locale, so assert against the known valid strings per key rather
      // than hardcoding one language. The key point: real copy is rendered, never
      // a raw `cookies.banner.*` key.
      const acceptText = w.find('.cookie-toast__btn--accept').text()
      const declineText = w.find('.cookie-toast__btn--decline').text()
      const aria = w.get('.cookie-toast').attributes('aria-label')
      expect(['Прийняти', 'Accept']).toContain(acceptText)
      expect(['Відмовитися', 'Decline']).toContain(declineText)
      expect(['Згода на куки', 'Cookie consent']).toContain(aria)
      expect(acceptText).not.toContain('cookies.banner')
    })

    it('details link points to the localized cookies-policy route', async () => {
      const w = await mountVisible()
      const href = w.find('.cookie-toast__link').attributes('href') || ''
      expect(href).toContain('/cookies-policy')
    })
  })

  describe('accept / decline delegation', () => {
    async function mountVisible() {
      vi.useFakeTimers()
      const w = await mountSuspended(CookieConsentToast)
      vi.advanceTimersByTime(1200)
      await nextTick()
      return w
    }

    it('accept button delegates to useCookieConsent.accept (and not decline)', async () => {
      const w = await mountVisible()
      await w.get('.cookie-toast__btn--accept').trigger('click')
      expect(accept).toHaveBeenCalledTimes(1)
      expect(decline).not.toHaveBeenCalled()
    })

    it('decline button delegates to useCookieConsent.decline (and not accept)', async () => {
      const w = await mountVisible()
      await w.get('.cookie-toast__btn--decline').trigger('click')
      expect(decline).toHaveBeenCalledTimes(1)
      expect(accept).not.toHaveBeenCalled()
    })
  })

  describe('swipe-to-snooze gesture', () => {
    async function mountVisible() {
      vi.useFakeTimers()
      const w = await mountSuspended(CookieConsentToast)
      vi.advanceTimersByTime(1200)
      await nextTick()
      return w
    }

    it('a horizontal drag past 80px then release snoozes', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      dispatchTouch(root, 'touchstart', [{ clientX: 100, clientY: 100 }])
      // clears the 8px lock threshold horizontally → axis locks horizontal
      dispatchTouch(root, 'touchmove', [{ clientX: 200, clientY: 102 }])
      await nextTick()
      // dragX = 100 (>= SWIPE_DISMISS_PX 80)
      dispatchTouch(root, 'touchend', [])
      // onTouchEnd schedules snooze() ~260ms after release
      vi.advanceTimersByTime(300)
      expect(snooze).toHaveBeenCalledTimes(1)
    })

    it('a horizontal drag short of 80px springs back without snoozing', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      dispatchTouch(root, 'touchstart', [{ clientX: 100, clientY: 100 }])
      // 40px horizontal: clears the lock (8px) but not the dismiss (80px)
      dispatchTouch(root, 'touchmove', [{ clientX: 140, clientY: 101 }])
      await nextTick()
      dispatchTouch(root, 'touchend', [])
      vi.advanceTimersByTime(400)
      expect(snooze).not.toHaveBeenCalled()
    })

    it('applies a translateX transform while dragging horizontally', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      dispatchTouch(root, 'touchstart', [{ clientX: 100, clientY: 100 }])
      dispatchTouch(root, 'touchmove', [{ clientX: 160, clientY: 100 }])
      await nextTick()
      const style = w.get('.cookie-toast').attributes('style') || ''
      expect(style).toContain('translateX(60px)')
    })

    it('a vertical drag locks to the vertical axis and never snoozes', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      dispatchTouch(root, 'touchstart', [{ clientX: 100, clientY: 100 }])
      // dy dominates and exceeds the lock threshold → axis = vertical
      dispatchTouch(root, 'touchmove', [{ clientX: 102, clientY: 200 }])
      // even a later large horizontal move is ignored once vertical-locked
      dispatchTouch(root, 'touchmove', [{ clientX: 300, clientY: 260 }])
      await nextTick()
      // no transform applied because dragX stays 0 and isDragging is false
      const style = w.get('.cookie-toast').attributes('style')
      expect(style === undefined || !/translateX/.test(style)).toBe(true)
      dispatchTouch(root, 'touchend', [])
      vi.advanceTimersByTime(400)
      expect(snooze).not.toHaveBeenCalled()
    })

    it('a touch with no movement (tap) does not snooze on release', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      dispatchTouch(root, 'touchstart', [{ clientX: 100, clientY: 100 }])
      // never moves past the 8px lock → isDragging stays false
      dispatchTouch(root, 'touchend', [])
      vi.advanceTimersByTime(400)
      expect(snooze).not.toHaveBeenCalled()
    })

    it('a touchstart that begins on a button does not arm a drag (tap stays a tap)', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      const btn = w.get('.cookie-toast__btn--accept').element
      // target is the button → onTouchStart returns early. With no subsequent
      // move, isDragging is never set, so releasing must not snooze and the
      // button click still delegates to accept().
      dispatchTouch(root, 'touchstart', [{ clientX: 100, clientY: 100 }], btn)
      dispatchTouch(root, 'touchend', [])
      vi.advanceTimersByTime(400)
      expect(snooze).not.toHaveBeenCalled()
      await w.get('.cookie-toast__btn--accept').trigger('click')
      expect(accept).toHaveBeenCalledTimes(1)
    })

    it('ignores multi-touch gestures (more than one finger)', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      // two fingers down → onTouchStart bails (e.touches.length !== 1)
      dispatchTouch(root, 'touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 150, clientY: 100 }
      ])
      dispatchTouch(root, 'touchmove', [
        { clientX: 300, clientY: 100 },
        { clientX: 350, clientY: 100 }
      ])
      await nextTick()
      dispatchTouch(root, 'touchend', [])
      vi.advanceTimersByTime(400)
      expect(snooze).not.toHaveBeenCalled()
    })

    it('a leftward drag past threshold also snoozes (direction-agnostic distance)', async () => {
      const w = await mountVisible()
      const root = w.get('.cookie-toast').element
      dispatchTouch(root, 'touchstart', [{ clientX: 200, clientY: 100 }])
      // dx = -100, |dx| >= 80
      dispatchTouch(root, 'touchmove', [{ clientX: 100, clientY: 100 }])
      await nextTick()
      const style = w.get('.cookie-toast').attributes('style') || ''
      expect(style).toContain('translateX(-100px)')
      dispatchTouch(root, 'touchend', [])
      vi.advanceTimersByTime(300)
      expect(snooze).toHaveBeenCalledTimes(1)
    })
  })
})
