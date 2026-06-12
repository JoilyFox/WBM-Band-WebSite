/**
 * v-lg-pointer — pointer-reactive specular highlight for Liquid Glass
 * surfaces (docs/liquid-glass.md).
 *
 * Updates --lg-px/--lg-py (sheen position, % of the element) on an
 * rAF-throttled pointermove, and --lg-press-x/--lg-press-y (press-glow
 * origin) on pointerdown. Attaches only on fine-pointer devices without
 * reduced motion; the CSS consumes the vars regardless of tier, but moves
 * are skipped unless <body> carries lg-tier-high. Never touches
 * backdrop-filter — only gradient positions repaint.
 *
 * Registered universally (not .client) so SSR can resolve the directive;
 * the hooks below only ever run in the browser.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const cleanups = new WeakMap<HTMLElement, () => void>()

  nuxtApp.vueApp.directive('lg-pointer', {
    getSSRProps: () => ({}),

    mounted(el: HTMLElement) {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      let raf = 0
      let lastEvent: PointerEvent | null = null

      const applyMove = () => {
        raf = 0
        if (!lastEvent) return
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const x = ((lastEvent.clientX - rect.left) / rect.width) * 100
        const y = ((lastEvent.clientY - rect.top) / rect.height) * 100
        el.style.setProperty('--lg-px', `${x.toFixed(1)}%`)
        el.style.setProperty('--lg-py', `${y.toFixed(1)}%`)
      }

      const onMove = (event: PointerEvent) => {
        if (!document.body.classList.contains('lg-tier-high')) return
        lastEvent = event
        if (!raf) raf = requestAnimationFrame(applyMove)
      }

      const onDown = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const x = ((event.clientX - rect.left) / rect.width) * 100
        const y = ((event.clientY - rect.top) / rect.height) * 100
        el.style.setProperty('--lg-press-x', `${x.toFixed(1)}%`)
        el.style.setProperty('--lg-press-y', `${y.toFixed(1)}%`)
      }

      const onLeave = () => {
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
        lastEvent = null
        el.style.removeProperty('--lg-px')
        el.style.removeProperty('--lg-py')
      }

      el.addEventListener('pointermove', onMove, { passive: true })
      el.addEventListener('pointerdown', onDown, { passive: true })
      el.addEventListener('pointerleave', onLeave, { passive: true })

      cleanups.set(el, () => {
        if (raf) cancelAnimationFrame(raf)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerdown', onDown)
        el.removeEventListener('pointerleave', onLeave)
      })
    },

    unmounted(el: HTMLElement) {
      cleanups.get(el)?.()
      cleanups.delete(el)
    }
  })
})
