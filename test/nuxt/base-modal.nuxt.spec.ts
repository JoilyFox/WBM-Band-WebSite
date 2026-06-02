// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseModal from '~/components/common/BaseModal.vue'

// BaseModal renders into <Teleport to="body">, so the dialog lives in
// document.body — NOT inside the wrapper's detached container. Focus assertions
// therefore read the live DOM (document.querySelector / document.activeElement),
// and keyboard events are dispatched on `document` (the component attaches its
// keydown listener there in onMounted).
//
// Contract under test (bug #5 a11y fix):
//   • role="dialog", aria-modal="true", tabindex="-1" on .modal-container
//   • :aria-label bound to the ariaLabel prop (default 'Dialog')
//   • Escape (while isVisible) emits 'close'; ignored while hidden
//   • Tab focus trap wraps last→first / first→last and preventDefault()s
//   • focus moves INTO the dialog on open; restored to the opener on close
//   • body scroll is locked while open
//
// IMPORTANT — focusable ORDER inside the dialog is [.modal-close-btn, slot…].
// The close button is rendered before the slot, so it is the FIRST focusable and
// the slot's last <button> is the LAST. The trap therefore wraps:
//   Tab from .last-btn        → .modal-close-btn (first)
//   Shift+Tab from close btn  → .last-btn        (last)
// On open, focusDialog() moves focus to focusable[0] === the close button.
//
// Slot fixture: two real <button>s so the trap has a distinct first/last span
// beyond the always-present close button. Passed as a template STRING so VTU
// compiles it to real DOM (a render fn returning a string yields a text node only).
const SLOT = '<button class="first-btn">First</button><button class="last-btn">Second</button>'

// happy-dom returns `undefined` for HTMLElement.offsetParent (no layout engine),
// and getFocusable() filters on `el.offsetParent !== null || …`. Since
// `undefined !== null` is true, every attached focusable passes the filter here —
// so the trap sees the buttons without any offsetParent stubbing.

// Each BaseModal attaches a document-level keydown listener in onMounted and only
// removes it in onUnmounted. mountSuspended does NOT auto-unmount between tests, so
// without this every prior modal's listener would keep firing on `document` and
// trap/preventDefault later tests' keystrokes. Track + unmount every wrapper.
const mounted: Array<{ unmount: () => void }> = []

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  // Drop any modal/scaffold nodes left in body and reset the lock state so each
  // test starts clean and the file is order-independent.
  document.querySelectorAll('.modal-backdrop, .scaffold').forEach((n) => n.remove())
  document.body.className = ''
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

const dialogEl = () => document.querySelector('.modal-container') as HTMLElement | null
const closeBtn = () => document.querySelector('.modal-close-btn') as HTMLElement | null
const firstBtn = () => document.querySelector('.first-btn') as HTMLElement | null
const lastBtn = () => document.querySelector('.last-btn') as HTMLElement | null

// A focusable button living OUTSIDE the teleported dialog (a fake page element /
// trigger). Tagged `.scaffold` so afterEach cleans it up.
const addOutside = (cls: string) => {
  const el = document.createElement('button')
  el.className = `scaffold ${cls}`
  document.body.appendChild(el)
  return el
}

// Dispatch a real KeyboardEvent on document so the onMounted listener catches it.
// Returns the event so callers can read defaultPrevented.
const fireKey = (key: string, init: KeyboardEventInit = {}) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  document.dispatchEvent(ev)
  return ev
}

const mountModal = async (props: Record<string, unknown>, slot: string = SLOT) => {
  const w = await mountSuspended(BaseModal, { props, slots: { default: slot } })
  mounted.push(w)
  return w
}

describe('BaseModal', () => {
  describe('ARIA / dialog semantics', () => {
    it('marks the container as a modal dialog (role, aria-modal, tabindex)', async () => {
      await mountModal({ isVisible: true })
      const dialog = dialogEl()
      expect(dialog).not.toBeNull()
      expect(dialog!.getAttribute('role')).toBe('dialog')
      expect(dialog!.getAttribute('aria-modal')).toBe('true')
      expect(dialog!.getAttribute('tabindex')).toBe('-1')
    })

    it('defaults aria-label to "Dialog" when the prop is omitted', async () => {
      await mountModal({ isVisible: true })
      expect(dialogEl()!.getAttribute('aria-label')).toBe('Dialog')
    })

    it('applies a custom ariaLabel prop to the dialog container', async () => {
      await mountModal({ isVisible: true, ariaLabel: 'Track details' })
      expect(dialogEl()!.getAttribute('aria-label')).toBe('Track details')
    })

    it('renders the close button with an accessible label and the slot content', async () => {
      const w = await mountModal({ isVisible: true })
      expect(closeBtn()!.getAttribute('aria-label')).toBe('Close modal')
      // Slot content is teleported into the dialog.
      expect(dialogEl()!.querySelector('.first-btn')).not.toBeNull()
      expect(dialogEl()!.querySelector('.last-btn')).not.toBeNull()
      expect(w.vm).toBeTruthy()
    })
  })

  describe('close emission paths', () => {
    it('emits close when the close button is clicked', async () => {
      const w = await mountModal({ isVisible: true })
      closeBtn()!.click()
      await nextTick()
      expect(w.emitted('close')).toBeTruthy()
      expect(w.emitted('close')!.length).toBe(1)
    })

    it('emits close when the backdrop is clicked', async () => {
      const w = await mountModal({ isVisible: true })
      ;(document.querySelector('.modal-backdrop') as HTMLElement).click()
      await nextTick()
      expect(w.emitted('close')).toBeTruthy()
    })

    it('does NOT emit close when the dialog container itself is clicked (@click.stop)', async () => {
      const w = await mountModal({ isVisible: true })
      dialogEl()!.click()
      await nextTick()
      expect(w.emitted('close')).toBeFalsy()
    })

    it('emits close on Escape while visible', async () => {
      const w = await mountModal({ isVisible: true })
      fireKey('Escape')
      await nextTick()
      expect(w.emitted('close')).toBeTruthy()
      expect(w.emitted('close')!.length).toBe(1)
    })

    it('ignores Escape while NOT visible (guarded by isVisible)', async () => {
      const w = await mountModal({ isVisible: false })
      fireKey('Escape')
      await nextTick()
      expect(w.emitted('close')).toBeFalsy()
    })
  })

  describe('Tab focus trap', () => {
    it('Tab from the last focusable (.last-btn) wraps to the first (close btn) and prevents default', async () => {
      await mountModal({ isVisible: true })
      await nextTick()
      lastBtn()!.focus()
      expect(document.activeElement).toBe(lastBtn())

      const ev = fireKey('Tab')
      await nextTick()
      expect(ev.defaultPrevented).toBe(true)
      // first focusable is the close button (rendered before the slot)
      expect(document.activeElement).toBe(closeBtn())
    })

    it('Shift+Tab from the first focusable (close btn) wraps to the last (.last-btn) and prevents default', async () => {
      await mountModal({ isVisible: true })
      await nextTick()
      closeBtn()!.focus()
      expect(document.activeElement).toBe(closeBtn())

      const ev = fireKey('Tab', { shiftKey: true })
      await nextTick()
      expect(ev.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(lastBtn())
    })

    it('Tab while focus is OUTSIDE the dialog yanks focus to the first focusable', async () => {
      const outside = addOutside('outside-btn')
      await mountModal({ isVisible: true })
      await nextTick()
      outside.focus()
      expect(document.activeElement).toBe(outside)

      const ev = fireKey('Tab')
      await nextTick()
      // inDialog is false → the !shift branch pulls focus to first (close btn).
      expect(ev.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(closeBtn())
    })

    it('Shift+Tab while focus is OUTSIDE the dialog yanks focus to the last focusable', async () => {
      const outside = addOutside('outside-btn')
      await mountModal({ isVisible: true })
      await nextTick()
      outside.focus()

      const ev = fireKey('Tab', { shiftKey: true })
      await nextTick()
      expect(ev.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(lastBtn())
    })

    it('does NOT preventDefault for a mid-list Tab (lets the browser advance focus)', async () => {
      // .first-btn sits between the close button (first) and .last-btn (last), so
      // it is neither boundary and focus stays inside → the trap leaves Tab alone.
      await mountModal({ isVisible: true })
      await nextTick()
      firstBtn()!.focus()

      const ev = fireKey('Tab')
      await nextTick()
      expect(ev.defaultPrevented).toBe(false)
    })

    it('non-Tab, non-Escape keys are ignored by the trap', async () => {
      const w = await mountModal({ isVisible: true })
      await nextTick()
      lastBtn()!.focus()
      const ev = fireKey('ArrowDown')
      await nextTick()
      expect(ev.defaultPrevented).toBe(false)
      expect(w.emitted('close')).toBeFalsy()
      expect(document.activeElement).toBe(lastBtn())
    })

    it('does not trap Tab while the modal is not visible', async () => {
      const outside = addOutside('outside-btn')
      await mountModal({ isVisible: false })
      await nextTick()
      outside.focus()
      const ev = fireKey('Tab')
      await nextTick()
      // handleKeydown returns early when !isVisible → no preventDefault, focus stays.
      expect(ev.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(outside)
    })
  })

  describe('focus management (move in on open, restore on close)', () => {
    it('moves focus into the dialog when mounted already open', async () => {
      const trigger = addOutside('trigger-btn')
      trigger.focus()
      expect(document.activeElement).toBe(trigger)

      await mountModal({ isVisible: true })
      // focusDialog runs through nextTick inside onMounted; it targets focusable[0]
      // which is the close button (the first focusable in the dialog).
      await nextTick()
      await nextTick()
      expect(dialogEl()!.contains(document.activeElement)).toBe(true)
      expect(document.activeElement).toBe(closeBtn())
    })

    it('restores focus to the opener when isVisible flips false', async () => {
      const trigger = addOutside('trigger-btn')
      trigger.focus()

      const w = await mountModal({ isVisible: true })
      await nextTick()
      await nextTick()
      // Focus moved into the dialog on open.
      expect(dialogEl()!.contains(document.activeElement)).toBe(true)

      // Close → the isVisible watcher restores focus to the remembered opener.
      await w.setProps({ isVisible: false })
      await nextTick()
      expect(document.activeElement).toBe(trigger)
    })

    it('re-captures the opener on each open (open → close → reopen with a new trigger)', async () => {
      const triggerA = addOutside('trigger-a')
      triggerA.focus()

      const w = await mountModal({ isVisible: true })
      await nextTick()
      await nextTick()
      expect(dialogEl()!.contains(document.activeElement)).toBe(true)

      await w.setProps({ isVisible: false })
      await nextTick()
      expect(document.activeElement).toBe(triggerA)

      // A different opener focuses, then re-opens → previouslyFocused is re-captured.
      const triggerB = addOutside('trigger-b')
      triggerB.focus()

      await w.setProps({ isVisible: true })
      await nextTick()
      await nextTick()
      expect(dialogEl()!.contains(document.activeElement)).toBe(true)

      await w.setProps({ isVisible: false })
      await nextTick()
      // Restored to the SECOND opener, proving previouslyFocused was refreshed.
      expect(document.activeElement).toBe(triggerB)
    })
  })

  describe('body scroll lock', () => {
    it('locks body scroll while open and releases it on close', async () => {
      const w = await mountModal({ isVisible: true })
      await nextTick()
      expect(document.body.classList.contains('modal-open')).toBe(true)
      expect(document.body.style.overflow).toBe('hidden')

      await w.setProps({ isVisible: false })
      await nextTick()
      expect(document.body.classList.contains('modal-open')).toBe(false)
      expect(document.body.style.overflow).toBe('')
    })

    it('does not lock body scroll when mounted closed', async () => {
      await mountModal({ isVisible: false })
      await nextTick()
      expect(document.body.classList.contains('modal-open')).toBe(false)
    })
  })
})
