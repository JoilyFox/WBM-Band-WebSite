import { buildLiquidLensMap, type LiquidLensOptions } from '~/utils/liquidGlassLens'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Lazily create one shared <svg><defs> to hold generated per-element filters. */
function getPhysicsDefs(): SVGDefsElement {
  let svg = document.getElementById('lg-physics-defs') as SVGSVGElement | null
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('id', 'lg-physics-defs')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.setAttribute('aria-hidden', 'true')
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none'
    document.body.appendChild(svg)
  }
  let defs = svg.querySelector('defs')
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs')
    svg.appendChild(defs)
  }
  return defs
}

/** Chromium is the only engine that applies SVG filters to a backdrop. */
function canPhysics(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean((navigator as { userAgentData?: unknown }).userAgentData)
  )
}

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
 * v-lg-physics — true physics refraction lens (docs/liquid-glass.md).
 * Generates a per-element Snell's-law displacement map (utils/liquidGlassLens)
 * sized to the element's real geometry, wires it into a private SVG filter, and
 * points the element's --lg-lens at it — overriding the static gradient lens
 * with backdrop refraction derived from the actual rounded-rect edge profile.
 * Recomputes on resize. Chromium-only (canPhysics); elsewhere it no-ops and the
 * CSS fallback (static lens / faux-bend) stands. Binding value tunes strength:
 * `v-lg-physics` (default) or `v-lg-physics="{ strength, edge, curve }"`.
 *
 * Registered universally (not .client) so SSR can resolve the directives;
 * the hooks below only ever run in the browser.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const cleanups = new WeakMap<HTMLElement, () => void>()
  const physicsCleanups = new WeakMap<HTMLElement, () => void>()
  const viewportCleanups = new WeakMap<HTMLElement, () => void>()
  let filterSeq = 0

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

  nuxtApp.vueApp.directive('lg-physics', {
    getSSRProps: () => ({}),

    mounted(el: HTMLElement, binding) {
      if (!canPhysics()) return

      const opts: LiquidLensOptions & { strength?: number } =
        typeof binding.value === 'number'
          ? { strength: binding.value }
          : { ...(binding.value || {}) }
      const strength = opts.strength ?? 52

      const id = `lg-phys-${++filterSeq}`
      const defs = getPhysicsDefs()
      const filter = document.createElementNS(SVG_NS, 'filter')
      filter.setAttribute('id', id)
      filter.setAttribute('x', '-20%')
      filter.setAttribute('y', '-20%')
      filter.setAttribute('width', '140%')
      filter.setAttribute('height', '140%')
      filter.setAttribute('color-interpolation-filters', 'sRGB')
      const feImage = document.createElementNS(SVG_NS, 'feImage')
      feImage.setAttribute('preserveAspectRatio', 'none')
      feImage.setAttribute('result', 'lgmap')
      const feDisp = document.createElementNS(SVG_NS, 'feDisplacementMap')
      feDisp.setAttribute('in', 'SourceGraphic')
      feDisp.setAttribute('in2', 'lgmap')
      feDisp.setAttribute('xChannelSelector', 'R')
      feDisp.setAttribute('yChannelSelector', 'G')
      filter.appendChild(feImage)
      filter.appendChild(feDisp)
      defs.appendChild(filter)

      let raf = 0
      let lastKey = ''

      const update = () => {
        raf = 0
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        // Low tier renders flat glass (CSS handles it); don't waste a map there.
        const low = document.body.classList.contains('lg-tier-low')
        const cs = getComputedStyle(el)
        // Read each corner so the lens follows a partially-rounded element (e.g.
        // the header rounded on its bottom corners only).
        const radii = {
          tl: parseFloat(cs.borderTopLeftRadius) || 0,
          tr: parseFloat(cs.borderTopRightRadius) || 0,
          br: parseFloat(cs.borderBottomRightRadius) || 0,
          bl: parseFloat(cs.borderBottomLeftRadius) || 0
        }
        // Key folds in geometry + flat/lens state, so a resize or corner-radius
        // change rebuilds, but unrelated body-class churn (modal-open) is a no-op.
        const key = `${Math.round(rect.width)}x${Math.round(rect.height)}|${radii.tl},${radii.tr},${radii.br},${radii.bl}|${low ? 'flat' : 'lens'}`
        if (key === lastKey) return
        lastKey = key
        if (low) {
          el.style.removeProperty('--lg-lens')
          return
        }
        const map = buildLiquidLensMap(rect.width, rect.height, strength, {
          radii,
          edge: opts.edge,
          curve: opts.curve
        })
        if (!map) {
          lastKey = ''
          return
        }
        feImage.setAttribute('href', map.url)
        feDisp.setAttribute('scale', String(map.scale))
        el.style.setProperty('--lg-lens', `url(#${id})`)
      }

      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(update)
      }

      // Defer the first build so layout + the async body tier class are settled.
      schedule()
      const ro = new ResizeObserver(schedule)
      ro.observe(el)
      // The body tier class arrives after client detection; re-check when <body>
      // class changes (update() itself no-ops if nothing relevant changed).
      const tierObserver = new MutationObserver(schedule)
      tierObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })

      physicsCleanups.set(el, () => {
        if (raf) cancelAnimationFrame(raf)
        ro.disconnect()
        tierObserver.disconnect()
        filter.remove()
        el.style.removeProperty('--lg-lens')
      })
    },

    unmounted(el: HTMLElement) {
      physicsCleanups.get(el)?.()
      physicsCleanups.delete(el)
    }
  })

  /**
   * v-lg-viewport-follow — in in-app webviews (body.lg-inapp), translate the
   * element to stay pinned to the top of the VISUAL viewport as the native
   * browser chrome (Telegram/IG/FB URL bar) collapses/expands on scroll, so the
   * floating logo + burger shift up with it. Uses the Visual Viewport API
   * (offsetTop) on an rAF-coalesced resize/scroll listener.
   *
   * STRICTLY gated to lg-inapp: elsewhere the header carries the glass frost,
   * and ANY transform on it would create a backdrop root and kill the frost —
   * so outside in-app we clear the transform entirely (never set translateY(0)).
   * Known iOS caveat: visualViewport events are coalesced/late in webviews, so a
   * little lag/jump during the chrome animation is expected (accepted trade-off).
   */
  nuxtApp.vueApp.directive('lg-viewport-follow', {
    getSSRProps: () => ({}),

    mounted(el: HTMLElement) {
      const vv = window.visualViewport
      if (!vv) return

      let raf = 0
      const sync = () => {
        raf = 0
        if (!document.body.classList.contains('lg-inapp')) {
          // No transform in a normal browser (would break the header frost).
          if (el.style.transform) el.style.transform = ''
          return
        }
        el.style.transform = `translateY(${vv.offsetTop.toFixed(1)}px)`
      }
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(sync)
      }

      vv.addEventListener('resize', schedule, { passive: true })
      vv.addEventListener('scroll', schedule, { passive: true })
      // Reset on return-to-page to dodge the iOS stuck-offsetTop bug.
      window.addEventListener('pageshow', schedule, { passive: true })
      schedule()

      viewportCleanups.set(el, () => {
        if (raf) cancelAnimationFrame(raf)
        vv.removeEventListener('resize', schedule)
        vv.removeEventListener('scroll', schedule)
        window.removeEventListener('pageshow', schedule)
      })
    },

    unmounted(el: HTMLElement) {
      viewportCleanups.get(el)?.()
      viewportCleanups.delete(el)
    }
  })
})
