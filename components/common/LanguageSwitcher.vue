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
        { 'lang-switch--big': size === 'big' }
      ]"
      :aria-label="t('lang.switch_label')"
      :aria-pressed="true"
      @click="toggleLocale"
    >
      <!-- Liquid thumb: a white pill that morphs (slides + stretches) between
           the two labels. Sits behind the text; driven by transform only. -->
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

  // --- Liquid thumb morph -------------------------------------------------
  // A single white pill is positioned over the active label and animated to
  // the other label on change. We animate ONLY `transform` (translateX +
  // scaleX/scaleY), so every frame is GPU-composited — no layout or paint.
  // The thumb's base width = the wider label; each state fits its label via
  // scaleX, so the pill naturally stretches/shrinks as it travels (the
  // "liquid" morph). Reduced-motion / low-perf tier snap instantly.
  const btnEl = ref<HTMLButtonElement | null>(null)
  const thumbEl = ref<HTMLSpanElement | null>(null)
  const enEl = ref<HTMLSpanElement | null>(null)
  const uaEl = ref<HTMLSpanElement | null>(null)

  type Geo = { tx: number; sx: number }
  const geo = { en: { tx: 0, sx: 1 }, ua: { tx: 0, sx: 1 } }
  let current: Geo = { tx: 0, sx: 1 }
  let baseW = 0
  let running: Animation | null = null

  const stateFor = () => (locale.value === 'en' ? geo.en : geo.ua)

  const wantsMotion = () => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (document.body.classList.contains('lg-tier-low')) return false
    return true
  }

  const setTransform = (g: Geo) => {
    if (thumbEl.value) thumbEl.value.style.transform = `translateX(${g.tx}px) scaleX(${g.sx})`
  }

  const measure = () => {
    const thumb = thumbEl.value
    const en = enEl.value
    const ua = uaEl.value
    if (!thumb || !en || !ua) return
    const enW = en.offsetWidth
    const uaW = ua.offsetWidth
    baseW = Math.max(enW, uaW)
    if (!baseW) return
    // Pin the thumb's box to the labels' vertical band; width = the wider one.
    thumb.style.width = `${baseW}px`
    thumb.style.height = `${en.offsetHeight}px`
    thumb.style.top = `${en.offsetTop}px`
    thumb.style.left = '0px'
    geo.en = { tx: en.offsetLeft, sx: enW / baseW }
    geo.ua = { tx: ua.offsetLeft, sx: uaW / baseW }
    current = { ...stateFor() }
    setTransform(current)
    thumb.style.opacity = '1'
  }

  const morphTo = (target: Geo) => {
    const thumb = thumbEl.value
    if (!thumb) return
    running?.cancel()
    // Persist the destination as the base value first, then play the morph
    // over it, so the animation can drop its fill cleanly with no end-jump.
    setTransform(target)
    if (!wantsMotion()) {
      current = { ...target }
      return
    }
    const from = current
    const midTx = (from.tx + target.tx) / 2
    // Stretch wider than either endpoint mid-travel, with a slight vertical
    // squash — the gooey "liquid" beat — then settle with a soft overshoot.
    const midSx = Math.max(from.sx, target.sx) * 1.16
    running = thumb.animate(
      [
        { transform: `translateX(${from.tx}px) scaleX(${from.sx}) scaleY(1)` },
        {
          transform: `translateX(${midTx}px) scaleX(${midSx}) scaleY(0.88)`,
          offset: 0.5
        },
        { transform: `translateX(${target.tx}px) scaleX(${target.sx}) scaleY(1)` }
      ],
      { duration: 440, easing: 'cubic-bezier(0.34, 1.32, 0.46, 1)' }
    )
    current = { ...target }
  }

  let ro: ResizeObserver | null = null

  onMounted(() => {
    // Wait a frame so layout (and webfont metrics) settle before measuring.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        measure()
        ro = new ResizeObserver(() => {
          // Re-measure geometry, then re-pin the thumb to the current state
          // without a morph (a resize isn't a user toggle).
          measure()
        })
        if (btnEl.value) ro.observe(btnEl.value)
      })
    )
  })

  onBeforeUnmount(() => {
    running?.cancel()
    ro?.disconnect()
  })

  watch(locale, () => {
    if (!baseW) {
      measure()
      return
    }
    morphTo(stateFor())
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
  /* The morphing white pill. Hidden until JS measures it (first frame), then
     positioned/animated purely via transform. transform-origin: left so scaleX
     fits each label from its left edge with no extra offset math. */
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
    will-change: transform;
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
  /* Reduced motion: the thumb still moves (it's instant via JS), but kill the
     will-change hint and let the color swap be immediate. */
  @media (prefers-reduced-transparency: reduce) {
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
