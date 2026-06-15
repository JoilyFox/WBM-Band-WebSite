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
        { 'lang-switch--big': size === 'big', 'lang-switch--animating': animating }
      ]"
      :aria-label="t('lang.switch_label')"
      :aria-pressed="true"
      @click="toggleLocale"
    >
      <!-- Overlay pill — hidden at rest; only shown while sliding between labels.
           The RESTING pill is each label's own ::before (CSS, so it's correct from
           the first server paint with zero JS measuring). -->
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
  // The active label paints its own white pill via CSS (.lang-btn.active::before)
  // — perfectly rounded, auto-sized to the text, present from the first paint, no
  // JS measuring. On a switch we hide that static pill and slide an absolutely-
  // positioned overlay (the "thumb") from the old label to the new one with a
  // WIDTH-based morph (never scaleX, which would distort the radius). The labels
  // never move, so we can measure their boxes any time. Reduced-motion / low tier
  // skip the slide and let the CSS pill switch instantly.
  const btnEl = ref<HTMLButtonElement | null>(null)
  const thumbEl = ref<HTMLSpanElement | null>(null)
  const enEl = ref<HTMLSpanElement | null>(null)
  const uaEl = ref<HTMLSpanElement | null>(null)

  const animating = ref(false)
  let running: Animation | null = null

  const wantsMotion = () => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (document.body.classList.contains('lg-tier-low')) return false
    return true
  }

  watch(locale, (newLoc, oldLoc) => {
    const thumb = thumbEl.value
    const btn = btnEl.value
    const oldEl = oldLoc === 'en' ? enEl.value : uaEl.value
    const newEl = newLoc === 'en' ? enEl.value : uaEl.value
    if (!thumb || !btn || !oldEl || !newEl || !wantsMotion()) return

    const c = btn.getBoundingClientRect()
    const o = oldEl.getBoundingClientRect()
    const n = newEl.getBoundingClientRect()

    // Park the overlay on the NEW label (its resting end); the morph plays FROM
    // the old label's box back to here, so the final frame matches the static
    // pill that takes over when `animating` ends — a seamless handoff.
    thumb.style.left = `${n.left - c.left}px`
    thumb.style.top = `${n.top - c.top}px`
    thumb.style.height = `${n.height}px`

    const dx = o.left - n.left
    const oldW = o.width
    const newW = n.width
    // Stretch a touch wider than either end mid-travel + a slight vertical squash
    // — the gooey "liquid" beat — then settle with the soft overshoot easing.
    const midW = Math.max(oldW, newW) * 1.16

    running?.cancel()
    animating.value = true
    running = thumb.animate(
      [
        { width: `${oldW}px`, transform: `translateX(${dx}px) scaleY(1)` },
        { width: `${midW}px`, transform: `translateX(${dx * 0.5}px) scaleY(0.88)`, offset: 0.5 },
        { width: `${newW}px`, transform: `translateX(0px) scaleY(1)` }
      ],
      { duration: 440, easing: 'cubic-bezier(0.34, 1.32, 0.46, 1)', fill: 'none' }
    )
    const done = () => {
      animating.value = false
    }
    running.onfinish = done
    running.oncancel = done
  })

  onBeforeUnmount(() => {
    running?.cancel()
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

  /* RESTING pill — the active label's own background. Perfect pill (radius is a
     full capsule, so it's round at any text width) and present from the first
     server-rendered paint, so the button loads complete with no flash. */
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
  /* While sliding, the static pill steps aside so the overlay carries the motion. */
  .lang-switch--animating .lang-btn.active::before {
    opacity: 0;
  }

  /* OVERLAY pill — only visible during a switch; slides + morphs (width-based) from
     the old label to the new one. transform-origin keeps the vertical squash
     centred; width grows from the left edge so the slide reads naturally. */
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
  .lang-switch--animating .lang-thumb {
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
