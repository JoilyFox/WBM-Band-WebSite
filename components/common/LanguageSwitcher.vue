<template>
  <div>
    <label v-if="showLabel" class="sr-only">{{ t('lang.switch_label') }}</label>
    <button
      ref="btnEl"
      type="button"
      :class="[
        'lang-switch',
        'liquid-glass',
        'liquid-glass--pill',
        'liquid-glass-interactive',
        { 'lang-switch--big': size === 'big', 'lang-switch--js': jsReady }
      ]"
      :aria-label="t('lang.switch_label')"
      :aria-pressed="true"
      @click="toggleLocale"
    >
      <!-- The pill. Until JS has measured the labels it's the active label's CSS
           ::before (present from the first server paint — no flash). After mount
           the persistent JS thumb takes over (same spot, seamless) so it can
           SLIDE between labels. -->
      <span ref="thumbEl" class="lang-thumb" aria-hidden="true" />
      <span
        ref="enEl"
        class="lang-btn"
        :class="[{ active: locale === 'en' }, size === 'big' ? 'lang-btn--big' : '']"
      >
        EN
      </span>
      <span
        ref="uaEl"
        class="lang-btn"
        :class="[{ active: locale === 'ua' }, size === 'big' ? 'lang-btn--big' : '']"
      >
        УКР
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
  // Reusable language switcher using @nuxtjs/i18n composables
  import { useI18n } from 'vue-i18n'

  const props = withDefaults(
    defineProps<{
      showLabel?: boolean
      size?: 'normal' | 'big'
    }>(),
    {
      showLabel: false,
      size: 'normal'
    }
  )

  const { locale, setLocale, t } = useI18n()

  const toggleLocale = async () => {
    const next = locale.value === 'en' ? 'ua' : 'en'
    await setLocale(next)
  }

  // --- Liquid slide -------------------------------------------------------
  // A single PERSISTENT white pill (the thumb) sits over the active label and
  // slides to the other on change. We animate WIDTH (+ translateX), never scaleX
  // — scaling a rounded rect warps its corners; a real width change keeps the
  // border-radius:9999px capsule perfect at any text width. Before JS measures,
  // the active label's CSS ::before is the pill (so the button is complete on the
  // first server-rendered paint, no flash); on mount the thumb takes over in the
  // same spot. Reduced-motion / low tier snap instantly.
  const btnEl = ref<HTMLButtonElement | null>(null)
  const thumbEl = ref<HTMLSpanElement | null>(null)
  const enEl = ref<HTMLSpanElement | null>(null)
  const uaEl = ref<HTMLSpanElement | null>(null)

  const jsReady = ref(false)
  let running: Animation | null = null
  let ro: ResizeObserver | null = null

  type Box = { left: number; top: number; w: number; h: number }
  const boxFor = (loc: string): Box | null => {
    const el = loc === 'en' ? enEl.value : uaEl.value
    if (!el) return null
    return { left: el.offsetLeft, top: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
  }

  // Pin the thumb to a label box (its resting state — explicit size, no transform).
  const placeThumb = (b: Box) => {
    const t = thumbEl.value
    if (!t) return
    t.style.left = `${b.left}px`
    t.style.top = `${b.top}px`
    t.style.width = `${b.w}px`
    t.style.height = `${b.h}px`
    t.style.transform = 'none'
  }

  const wantsMotion = () => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (document.body.classList.contains('lg-tier-low')) return false
    return true
  }

  onMounted(() => {
    // Wait a frame so layout (and webfont metrics) settle before measuring, then
    // hand the pill off from the CSS ::before to the persistent JS thumb.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const b = boxFor(locale.value)
        if (!b) return
        placeThumb(b)
        jsReady.value = true
        ro = new ResizeObserver(() => {
          // Re-fit (font load / container resize) without a morph.
          const cur = boxFor(locale.value)
          if (cur && !running) placeThumb(cur)
        })
        if (btnEl.value) ro.observe(btnEl.value)
      })
    )
  })

  watch(locale, (newLoc, oldLoc) => {
    const t = thumbEl.value
    if (!t || !jsReady.value) return
    const from = boxFor(oldLoc)
    const to = boxFor(newLoc)
    if (!from || !to) return

    // Settle on the destination first so the animation can drop its fill cleanly.
    placeThumb(to)
    if (!wantsMotion()) return

    const dx = from.left - to.left
    // Stretch a touch wider than either end mid-travel + a slight vertical squash
    // — the gooey "liquid" beat — then settle with the soft overshoot easing.
    const midW = Math.max(from.w, to.w) * 1.16

    running?.cancel()
    running = t.animate(
      [
        { width: `${from.w}px`, transform: `translateX(${dx}px) scaleY(1)` },
        { width: `${midW}px`, transform: `translateX(${dx * 0.5}px) scaleY(0.88)`, offset: 0.5 },
        { width: `${to.w}px`, transform: `translateX(0px) scaleY(1)` }
      ],
      { duration: 440, easing: 'cubic-bezier(0.34, 1.32, 0.46, 1)', fill: 'none' }
    )
    const clear = () => {
      if (running) running = null
    }
    running.onfinish = clear
    running.oncancel = clear
  })

  onBeforeUnmount(() => {
    running?.cancel()
    ro?.disconnect()
  })
</script>

<style scoped>
  .lang-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 2px;
    gap: 2px;
    /* Lightish control: keep the frost subtle so the header chrome stays light */
    --lg-tint: rgb(255 255 255 / 0.06);
    --lg-rim: rgb(255 255 255 / 0.4);
  }
  .lang-switch--big {
    padding: 2px; /* keep container compact */
    gap: 3px;
  }

  .lang-btn {
    position: relative;
    z-index: 1;
    font-size: 0.75rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.8);
    padding: 6px 10px;
    border-radius: 9999px;
    transition: color 0.28s ease;
  }
  .lang-btn--big {
    font-size: 0.8125rem; /* ~13px */
    padding: 8px 12px; /* ~1.33x height, ~1.2x width */
  }
  @media (hover: hover) and (pointer: fine) {
    .lang-btn:not(.active):hover {
      color: #fff;
    }
  }
  .lang-btn.active {
    color: #000;
  }

  /* First-paint pill — the active label's own background. Perfect capsule (round
     at any text width) and present from the server-rendered HTML, so the button
     loads complete with no flash. Handed off to the JS thumb once it's ready. */
  .lang-btn.active::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: #fff;
    border-radius: 9999px;
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.18),
      inset 0 0 0 0.5px rgb(255 255 255 / 0.6);
  }
  .lang-switch--js .lang-btn.active::before {
    display: none;
  }

  /* The persistent sliding pill. Hidden until JS pins it (jsReady); then it's the
     pill and slides on switch. Width-animated, so border-radius stays perfect. */
  .lang-thumb {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    border-radius: 9999px;
    background: #fff;
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.18),
      inset 0 0 0 0.5px rgb(255 255 255 / 0.6);
    transform-origin: 0 50%;
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    will-change: transform, width;
  }
  .lang-switch--js .lang-thumb {
    opacity: 1;
  }

  @media (prefers-reduced-transparency: reduce) {
    .lang-btn.active::before,
    .lang-thumb {
      box-shadow: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .lang-thumb {
      will-change: auto;
    }
    .lang-btn {
      transition: none;
    }
  }
</style>
