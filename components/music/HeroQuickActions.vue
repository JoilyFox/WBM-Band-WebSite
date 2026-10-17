<template>
  <!--
    Mobile/tablet hero quick actions: optional Music Video + Lyrics pills.

    The Lyrics pill is also the "Back to Music" control. Opening the lyrics
    shrinks the Music Video pill (to icon-only on phones) and grows the Lyrics
    pill into the freed space, while its label slides Lyrics → Back.

    Compositor-only morph. Nothing here changes size during the animation. Each
    pill's box is laid out at its LARGEST extent, and the visible pill is the
    intersection of two rounded shapes:
      • the pill itself (`overflow: hidden`, rounded), which never moves, and
      • `.hqa-clip`, a rounded clip of the same size that slides sideways.
    Their overlap is again a perfect pill whose width changes as the clip slides.
    Its fixed end comes from the pill and its moving end from the clip. The
    content (`.hqa-body`) is counter-slid inside the clip, so it stays put while
    being clipped. Every motion is a `translate`, every fade an `opacity`, and all
    of them run on the compositor; see utils/lyricsMorph.ts for the shared clock.

    Render NATIVE <a>/<button>, never <component :is>: PrimeVue's global `Button`
    would hijack a dynamic 'button' (see HeroPill.vue).
  -->
  <div
    ref="rowEl"
    class="hqa flex text-sm font-medium leading-5 text-primary-200/70"
    :class="{
      'is-lyrics': active,
      'hqa--pair': Boolean(videoUrl) && lyricsAvailable,
      'hqa--solo': !videoUrl && lyricsAvailable,
      'hqa--video-only': Boolean(videoUrl) && !lyricsAvailable
    }"
  >
    <a
      v-if="videoUrl"
      class="hqa-pill hqa-pill--video"
      :href="videoUrl"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('music.buttons.watch_video')"
      @click="emit('video-click', $event)"
    >
      <span class="hqa-clip" data-hqa>
        <span class="hqa-body" data-hqa>
          <span class="hqa-glow" data-hqa aria-hidden="true"></span>
          <span class="hqa-content" data-hqa>
            <UiIcon name="youtube" class="text-base leading-none" />
            <!-- Short label below 360px: "Дивитись Кліп" cannot fit half of a 320px row. -->
            <span class="hqa-label" data-hqa>
              <UiResponsiveText
                :narrow="t('music.buttons.music_video_short')"
                :wide="t('music.buttons.music_video')"
                :breakpoint="360"
              />
            </span>
          </span>
        </span>
        <span class="hqa-cap" aria-hidden="true"></span>
      </span>
    </a>

    <template v-if="lyricsAvailable">
      <a
        v-if="lyricsHref"
        class="hqa-pill hqa-pill--lyrics"
        :href="lyricsHref"
        :aria-label="lyricsAriaLabel"
        @click="emit('lyrics-click', $event)"
        @pointerdown="emit('lyrics-intent')"
      >
        <span class="hqa-clip" data-hqa>
          <span class="hqa-body" data-hqa>
            <span class="hqa-face hqa-face--lyrics" data-hqa aria-hidden="true">
              <i class="pi pi-align-left text-base leading-none"></i>
              <UiResponsiveText
                :narrow="t('music.buttons.lyrics')"
                :wide="t('music.buttons.song_lyrics')"
                :breakpoint="440"
              />
            </span>
            <span class="hqa-face hqa-face--back" data-hqa aria-hidden="true">
              <i class="text-base leading-none" :class="backIcon"></i>
              <span>{{ backLabel }}</span>
            </span>
          </span>
          <span class="hqa-cap" aria-hidden="true"></span>
        </span>
      </a>
      <button
        v-else
        type="button"
        class="hqa-pill hqa-pill--lyrics"
        :aria-label="lyricsAriaLabel"
        @click="emit('lyrics-click', $event)"
        @pointerdown="emit('lyrics-intent')"
      >
        <span class="hqa-clip" data-hqa>
          <span class="hqa-body" data-hqa>
            <span class="hqa-face hqa-face--lyrics" data-hqa aria-hidden="true">
              <i class="pi pi-align-left text-base leading-none"></i>
              <UiResponsiveText
                :narrow="t('music.buttons.lyrics')"
                :wide="t('music.buttons.song_lyrics')"
                :breakpoint="440"
              />
            </span>
            <span class="hqa-face hqa-face--back" data-hqa aria-hidden="true">
              <i class="text-base leading-none" :class="backIcon"></i>
              <span>{{ backLabel }}</span>
            </span>
          </span>
          <span class="hqa-cap" aria-hidden="true"></span>
        </span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { fadeKeyframes, lyricsMorphTiming, toTranslate } from '~/utils/lyricsMorph'

  interface Props {
    /** Music Video URL; empty → no video pill. */
    videoUrl?: string
    lyricsAvailable?: boolean
    /** True on the lyrics view (the pill reads "Back"). */
    active?: boolean
    /** Crawlable /lyrics ⇄ /listen href; empty → the pill is a <button>. */
    lyricsHref?: string
    backLabel: string
    /** Warm visitors get a back arrow, cold ones (no prior context) a play glyph. */
    backIsArrow?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    videoUrl: '',
    lyricsAvailable: false,
    active: false,
    lyricsHref: '',
    backIsArrow: false
  })

  const emit = defineEmits<{
    'video-click': [MouseEvent]
    'lyrics-click': [MouseEvent]
    /** Pointer went down on the Lyrics pill: a click is ~100 ms away. */
    'lyrics-intent': []
  }>()

  const { t, locale } = useI18n({ useScope: 'global' })

  const backIcon = computed(() => (props.backIsArrow ? 'pi pi-arrow-left' : 'pi pi-play'))
  const lyricsAriaLabel = computed(() =>
    props.active ? props.backLabel : t('music.a11y.show_lyrics')
  )

  const rowEl = ref<HTMLElement | null>(null)

  // Geometry CSS cannot derive on its own, written to the row as custom props:
  //  • --mv-label-w: the label's natural width. Above 450px the Music Video pill
  //    keeps its label on the lyrics view and ends right after it. Measured with
  //    a Range (fractional px). Until then the CSS falls back to 7rem, and the
  //    links view does not depend on it.
  //  • --hqa-glow-k: how much the YouTube glow (45% of the half-row pill)
  //    shrinks on the lyrics view. A length ratio, which calc() cannot divide.
  const measure = () => {
    const row = rowEl.value
    if (!row) return
    const label = row.querySelector<HTMLElement>('.hqa-label')
    let labelW = 0
    if (label) {
      const range = document.createRange()
      range.selectNodeContents(label)
      labelW = range.getBoundingClientRect().width
      if (labelW > 0) row.style.setProperty('--mv-label-w', `${labelW}px`)
    }
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const half = (row.clientWidth - 0.75 * rem) / 2
    const phone = window.matchMedia('(max-width: 450px)').matches
    const glowEnd = phone ? 3 * rem : 0.6 * (3.5 * rem + labelW)
    if (half > 0) row.style.setProperty('--hqa-glow-k', String(glowEnd / (0.45 * half)))
  }

  let resizeObserver: ResizeObserver | null = null
  onMounted(() => {
    measure()
    // Web fonts swap in after first paint and change the label's width.
    document.fonts?.ready.then(measure).catch(() => {})
    if (rowEl.value && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => measure())
      resizeObserver.observe(rowEl.value)
    }
  })
  onBeforeUnmount(() => resizeObserver?.disconnect())
  watch(locale, () => nextTick(measure))

  // --- Morph -----------------------------------------------------------------
  // FLIP-style: the resting geometry of both views lives in CSS (`.is-lyrics`),
  // so SSR and every resting frame are pure CSS. To animate, the parent calls
  // `capture()` before flipping `active`, then `animate(snapshot)` after the DOM
  // has updated. Each part animates from its captured value to its new computed
  // value. Reversing mid-flight is the parent's job (it reverses the animations).
  type Snapshot = Map<HTMLElement, { translate: string; scale: string; opacity: number }>

  const parts = () => Array.from(rowEl.value?.querySelectorAll<HTMLElement>('[data-hqa]') ?? [])

  const read = (el: HTMLElement) => {
    const cs = getComputedStyle(el)
    return {
      translate: toTranslate(cs.translate),
      scale: cs.scale && cs.scale !== 'none' ? cs.scale : '1',
      opacity: Number(cs.opacity)
    }
  }

  const capture = (): Snapshot => new Map(parts().map((el) => [el, read(el)]))

  const animate = (from: Snapshot): Animation[] => {
    const timing = lyricsMorphTiming()
    const out: Animation[] = []
    for (const [el, a] of from) {
      if (!el.isConnected) continue
      const b = read(el)
      if (a.translate !== b.translate) {
        out.push(el.animate([{ translate: a.translate }, { translate: b.translate }], timing))
      }
      if (a.opacity !== b.opacity) out.push(el.animate(fadeKeyframes(a.opacity, b.opacity), timing))
      if (a.scale !== b.scale)
        out.push(el.animate([{ scale: a.scale }, { scale: b.scale }], timing))
    }
    return out
  }

  defineExpose({ capture, animate })
</script>

<style scoped>
  /* Geometry. 100cqw is the row's width (the row is the size container), so the
     resting offsets are pure CSS and correct from the first SSR paint. */
  .hqa {
    container-type: inline-size;
    position: relative;
    align-items: center;
    height: 1.75rem;
    --hqa-gap: 0.75rem;
    --hqa-half: calc((100cqw - var(--hqa-gap)) / 2);
    --hqa-slide: 1.25rem; /* filmstrip step between the Lyrics and Back labels */
    /* Music Video on the lyrics view: icon-only (pad + icon + pad) on phones. */
    --mv-end: 3rem;
    /* How far the moving end of the pills travels. */
    --hqa-d: calc(var(--hqa-half) - var(--mv-end));
  }

  /* >450px there is room for both labels: the video pill keeps its label and
     settles at its natural width (pad + icon + gap + label + pad). */
  @media (min-width: 451px) {
    .hqa {
      --mv-end: calc(3rem + 0.5rem + var(--mv-label-w, 7rem));
    }
  }

  /* Lone Lyrics pill: half the row (right-aligned) → the full row. */
  .hqa--solo {
    --hqa-d: calc(var(--hqa-half) + var(--hqa-gap));
  }

  /* --- Pill: fixed box at its largest extent ------------------------------ */
  .hqa-pill {
    position: relative;
    display: block;
    height: 1.75rem;
    border-radius: 9999px;
    overflow: hidden;
    /* Only the visible part (.hqa-body, clipped) takes taps: the boxes of the
       two pills overlap where one is invisible. */
    pointer-events: none;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    transition: scale 0.1s ease-in-out;
    outline: none;
  }

  .hqa-pill:active {
    scale: 0.98;
  }

  .hqa--pair .hqa-pill--video {
    flex: none;
    width: var(--hqa-half);
  }

  .hqa--pair .hqa-pill--lyrics {
    position: absolute;
    top: 0;
    right: 0;
    width: calc(100% - var(--hqa-gap) - var(--mv-end));
  }

  .hqa--solo .hqa-pill--lyrics {
    position: absolute;
    inset: 0;
  }

  /* --- Layers -------------------------------------------------------------- */
  /* The sliding rounded clip. Paints nothing itself except its moving-end rim
     (.hqa-cap) and the focus ring. */
  .hqa-clip {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
  }

  /* The glass: fill, top sheen, rim, content. Counter-slid → static on screen. */
  .hqa-body {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 0.875rem;
    pointer-events: auto;
    cursor: pointer;
    background-color: rgb(255 255 255 / 0.05);
    background-image: linear-gradient(
      to bottom,
      rgb(255 255 255 / 0.1) 0%,
      rgb(255 255 255 / 0) 45%
    );
    transition: background-color 0.1s ease-in-out;
  }

  /* YouTube glow from the left edge: 45% of the pill on the links view, the whole
     icon-only button (phones) or 60% of the labelled pill on the lyrics view.
     Its box never changes. The lyrics view squeezes it with `scale`, using a
     factor measured in JS (--hqa-glow-k), so the morph stays a compositor
     animation and reverses cleanly. */
  .hqa-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 45%;
    height: 100%;
    transform-origin: left center;
    pointer-events: none;
    background: radial-gradient(circle at 0% 50%, rgba(255, 0, 0, 0.2) 0%, transparent 100%);
  }

  .hqa--pair.is-lyrics .hqa-glow {
    scale: var(--hqa-glow-k, 0.62) 1;
  }

  @media (hover: hover) and (pointer: fine) {
    .hqa-pill:hover .hqa-body {
      background-color: rgb(255 255 255 / 0.1);
    }
  }

  .hqa-pill:active .hqa-body {
    background-color: rgb(255 255 255 / 0.15);
  }

  /* Rim (the HeroPill specular edge), split between the two shapes so the
     outline is always the outline of the VISIBLE pill:
       • .hqa-body::after draws it everywhere except the moving end, and
       • .hqa-cap (rides on the clip) draws only the moving end.
     The masks cross-fade over the last 3px of the cap curve before it meets
     the straight edge, where the straight rim (clipped by the curve) and the
     curved rim coincide. At rest
     the two masks are complementary, so the rim is the original one. */
  .hqa-body::after,
  .hqa-cap {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    box-shadow:
      inset 1.5px 1.5px 1px -1px rgb(255 255 255 / 0.45),
      inset -1px -1px 1px -1px rgb(255 255 255 / 0.12),
      inset 0 0 0 1px rgb(255 255 255 / 0.04);
  }

  /* Video pill: the moving end is the RIGHT one. */
  .hqa-pill--video .hqa-body::after {
    -webkit-mask-image: linear-gradient(
      to right,
      #000 calc(100% - 14px),
      transparent calc(100% - 11px)
    );
    mask-image: linear-gradient(to right, #000 calc(100% - 14px), transparent calc(100% - 11px));
  }

  .hqa-pill--video .hqa-cap {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent calc(100% - 14px),
      #000 calc(100% - 11px)
    );
    mask-image: linear-gradient(to right, transparent calc(100% - 14px), #000 calc(100% - 11px));
  }

  /* Lyrics pill: the moving end is the LEFT one. */
  .hqa-pill--lyrics .hqa-body::after {
    -webkit-mask-image: linear-gradient(
      to left,
      #000 calc(100% - 14px),
      transparent calc(100% - 11px)
    );
    mask-image: linear-gradient(to left, #000 calc(100% - 14px), transparent calc(100% - 11px));
  }

  .hqa-pill--lyrics .hqa-cap {
    -webkit-mask-image: linear-gradient(
      to left,
      transparent calc(100% - 14px),
      #000 calc(100% - 11px)
    );
    mask-image: linear-gradient(to left, transparent calc(100% - 14px), #000 calc(100% - 11px));
  }

  /* A lone video pill never morphs: one plain rim, natural width. */
  .hqa--video-only .hqa-pill--video {
    width: max-content;
  }

  .hqa--video-only .hqa-clip,
  .hqa--video-only .hqa-body {
    position: relative;
    height: 100%;
  }

  .hqa--video-only .hqa-body::after {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .hqa--video-only .hqa-cap {
    display: none;
  }

  /* Keyboard focus: ring both shapes (they overlap only along the edges). */
  .hqa-pill:focus-visible .hqa-body,
  .hqa-pill:focus-visible .hqa-clip {
    box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.3);
  }

  /* Content sits above the rim. */
  .hqa-content,
  .hqa-face {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .hqa-label {
    display: inline-block;
  }

  /* Faces: grid-stacked, centred in the pill's full (lyrics-view) width. */
  .hqa-pill--lyrics .hqa-body {
    display: grid;
    place-items: center;
  }

  .hqa-face {
    grid-area: 1 / 1;
  }

  /* --- Resting state: links view ------------------------------------------- */
  /* Lyrics pill: clip slid toward the fixed end so only the right part shows. */
  .hqa-pill--lyrics .hqa-clip {
    translate: var(--hqa-d) 0;
  }

  .hqa-pill--lyrics .hqa-body {
    translate: calc(var(--hqa-d) * -1) 0;
  }

  /* Faces centred on the VISIBLE part (which is offset by --hqa-d). */
  .hqa-face--lyrics {
    translate: calc(var(--hqa-d) / 2) 0;
  }

  .hqa-face--back {
    translate: calc(var(--hqa-d) / 2 + var(--hqa-slide)) 0;
    opacity: 0;
  }

  /* --- Resting state: lyrics view ------------------------------------------ */
  .hqa--pair.is-lyrics .hqa-pill--video .hqa-clip {
    translate: calc(var(--hqa-d) * -1) 0;
  }

  .hqa--pair.is-lyrics .hqa-pill--video .hqa-body {
    translate: var(--hqa-d) 0;
  }

  /* Content leaves the centre of the half-row pill for the start of the
     shrunk one (icon at the padding). 50% is half the content's own width. */
  .hqa--pair.is-lyrics .hqa-content {
    translate: calc(50% + 0.875rem - var(--hqa-half) / 2) 0;
  }

  .is-lyrics .hqa-pill--lyrics .hqa-clip,
  .is-lyrics .hqa-pill--lyrics .hqa-body {
    translate: 0 0;
  }

  .is-lyrics .hqa-face--lyrics {
    translate: calc(var(--hqa-slide) * -1) 0;
    opacity: 0;
  }

  .is-lyrics .hqa-face--back {
    translate: 0 0;
    opacity: 1;
  }

  /* Phones: the lyrics view keeps only the video icon. */
  @media (max-width: 450px) {
    .hqa--pair.is-lyrics .hqa-label {
      opacity: 0;
    }
  }
</style>
