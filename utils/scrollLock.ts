/**
 * Page scroll lock that does not move anything.
 *
 * Hiding the viewport scrollbar (`overflow: hidden`) widens the layout by the
 * scrollbar's width, so centred content and `position: fixed; right: 0` bars jump
 * sideways. Two cases, detected by MEASURING the layout (not by UA sniffing):
 *
 *  1. `scrollbar-gutter: stable` is honoured on <html> (base.scss; Chrome 94+,
 *     Firefox 97+, Safari 18.2+). The gutter stays reserved while the bar is gone,
 *     so the layout width does not change — nothing to compensate. (The empty
 *     strip shows the canvas colour, #000 on this site, and `position: fixed`
 *     overlays cannot paint into it — it is outside the clipped viewport.)
 *  2. No gutter support (older Safari): the layout widens by the scrollbar width.
 *     Pad <body> by it (the Bootstrap/MUI/Radix approach) and expose the same
 *     amount as `--lock-comp` for fixed bars (`right: var(--lock-comp, 0px)`).
 *
 * Overlay scrollbars (touch, macOS trackpad default) take no space → width 0, no-op.
 *
 * CSS variables set on <html> while locked (removed on unlock, so `var(--x, 0px)`
 * fallbacks apply otherwise):
 *   --lock-sb    measured scrollbar width (both cases)
 *   --lock-comp  compensation actually applied (case 2 only, else 0)
 *
 * Reference-counted so stacked locks can't release each other.
 */

let lockCount = 0
// Inline values we overwrote, restored on the last unlock.
let saved: { overflow: string; paddingRight: string } | null = null

const VARS = ['--lock-sb', '--lock-comp'] as const

export function lockPageScroll(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  if (lockCount++ > 0) return

  const html = document.documentElement
  const body = document.body

  // Measure BEFORE hiding the scrollbar. With a stable gutter clientWidth jumps
  // back to innerWidth once overflow is hidden, so it can only be read now.
  const scrollbar = Math.max(0, window.innerWidth - html.clientWidth)
  const layoutBefore = html.getBoundingClientRect().width

  saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
  body.style.overflow = 'hidden'

  let comp = 0
  if (scrollbar > 0) {
    // Forces one layout: did the page widen? (Same task as the change above, so no
    // frame is ever painted in the widened state.)
    const widened = html.getBoundingClientRect().width - layoutBefore
    if (widened >= scrollbar - 0.5) {
      comp = scrollbar
      body.style.paddingRight = `${scrollbar}px`
    }
  }

  html.style.setProperty('--lock-sb', `${scrollbar}px`)
  html.style.setProperty('--lock-comp', `${comp}px`)
  body.classList.add('modal-open')
}

export function unlockPageScroll(): void {
  if (typeof document === 'undefined') return
  if (lockCount === 0) return
  if (--lockCount > 0) return

  const html = document.documentElement
  const body = document.body
  body.style.overflow = saved?.overflow ?? ''
  body.style.paddingRight = saved?.paddingRight ?? ''
  saved = null
  for (const v of VARS) html.style.removeProperty(v)
  body.classList.remove('modal-open')
}

/** Test hook. */
export function __resetPageScrollLock(): void {
  lockCount = 0
  saved = null
}
