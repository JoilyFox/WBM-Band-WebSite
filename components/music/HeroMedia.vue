<template>
  <div
    v-if="media"
    ref="rootEl"
    class="hero-media"
    :class="{
      'is-ready': ready,
      'is-settled': settled,
      'is-filled': filled,
      'is-translucent': translucent
    }"
    :style="{ '--hm-focus': media.focus }"
    aria-hidden="true"
  >
    <!-- Where the hero is taller than the clip (the expanded phone hero, a portrait
         tablet), a blurred copy of the clip fills the rest: a tiny canvas the video
         draws itself into (no second decode), or the still itself. -->
    <canvas v-if="mode === 'video'" ref="fillEl" class="hero-media__fill" width="32" height="18" />
    <picture v-else-if="mode === 'still' && stillBase" class="hero-media__fill">
      <source :srcset="`${stillBase}.poster.avif`" type="image/avif" />
      <source :srcset="`${stillBase}.poster.webp`" type="image/webp" />
      <img :src="`${stillBase}.poster.jpg`" alt="" decoding="async" />
    </picture>

    <div ref="boxEl" class="hero-media__box">
      <video
        v-if="mode === 'video'"
        ref="videoEl"
        class="hero-media__el"
        muted
        loop
        playsinline
        disablepictureinpicture
        disableremoteplayback
        preload="auto"
        tabindex="-1"
        @playing="onPlaying"
        @error="mode = 'off'"
      />
      <picture v-else-if="mode === 'still' && stillBase">
        <source :srcset="`${stillBase}.poster.avif`" type="image/avif" />
        <source :srcset="`${stillBase}.poster.webp`" type="image/webp" />
        <img
          class="hero-media__el"
          :src="`${stillBase}.poster.jpg`"
          alt=""
          decoding="async"
          @load="ready = true"
        />
      </picture>
    </div>
  </div>
</template>

<script setup lang="ts">
  // Background media of the release hero (a muted looping clip, or a still). It never
  // competes with the page's first paint: nothing renders on the server, the clip starts
  // loading once the page has loaded and the main thread is idle, and it fades in only
  // when its first frame is on screen. Until then (and when it can't play) the hero looks
  // exactly as it does without media. See docs/hero-media.md.
  import type { ReleaseHeroMedia } from '~/data/musicLibrary'

  const props = defineProps<{
    media?: ReleaseHeroMedia
    /** Over a glass surface (the desktop release modal): the clip is see-through, so
     *  what is behind the glass still shows through it. */
    translucent?: boolean
  }>()

  const rootEl = ref<HTMLElement | null>(null)
  const boxEl = ref<HTMLElement | null>(null)
  const videoEl = ref<HTMLVideoElement | null>(null)
  const fillEl = ref<HTMLCanvasElement | null>(null)
  // off = the hero as without media; still = the poster frame; video = the clip
  const mode = ref<'off' | 'video' | 'still'>('off')
  const ready = ref(false)
  // the box only animates after its first placement (no slide-in on load)
  const settled = ref(false)
  // the hero is taller than the clip: the blurred copy shows above and below it
  const filled = ref(false)
  // the rendition (path prefix) in use
  const stillBase = ref('')

  const AV1 = 'video/mp4; codecs="av01.0.05M.08"'

  // AV1 is about half the bytes of H.264, but only where it decodes in hardware: in
  // software it costs a phone's CPU (and battery) for the whole visit. MediaCapabilities
  // says which; anything uncertain gets H.264, which every device decodes in hardware.
  async function pickSource(base: string, width: number, height: number) {
    try {
      if (document.createElement('video').canPlayType(AV1) && navigator.mediaCapabilities) {
        const info = await navigator.mediaCapabilities.decodingInfo({
          type: 'file',
          video: { contentType: AV1, width, height, bitrate: 400_000, framerate: 24 }
        })
        if (info.supported && info.powerEfficient) return `${base}.av1.mp4`
      }
    } catch {
      // older engines throw on the query: H.264
    }
    return `${base}.h264.mp4`
  }

  let visible = true
  let io: IntersectionObserver | null = null
  let ro: ResizeObserver | null = null

  function play() {
    const v = videoEl.value
    if (!v || !visible || document.hidden) return
    // Low Power Mode (iOS) and some data savers refuse autoplay: show the still instead
    v.play().catch(() => {
      if (mode.value === 'video') mode.value = 'still'
    })
  }

  type FrameVideo = HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: () => void) => number
  }

  function onPlaying() {
    const v = videoEl.value as FrameVideo | null
    // fade in once a frame is actually painted (no black first frame)
    if (v?.requestVideoFrameCallback) v.requestVideoFrameCallback(() => (ready.value = true))
    else ready.value = true
    fillLoop()
  }

  // The blurred copy: each new video frame is drawn into a 32×18 canvas, which CSS scales
  // up and blurs. Runs only while the copy is visible (`filled`), once per decoded frame;
  // a paused clip draws nothing.
  let filling = false
  function fillFrame() {
    const v = videoEl.value as FrameVideo | null
    const c = fillEl.value
    if (!filled.value || !v || !c || mode.value !== 'video') {
      filling = false
      return
    }
    if (v.readyState >= 2) c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height)
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(fillFrame)
    else requestAnimationFrame(fillFrame)
  }
  function fillLoop() {
    if (filling || !filled.value) return
    filling = true
    fillFrame()
  }
  watch(filled, fillLoop)

  async function start() {
    const media = props.media
    if (!media || !rootEl.value) return
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection
    // the user asked for less data, or the network can't carry it: the hero stays as is
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return
    const wide = window.matchMedia('(min-width: 768px)').matches
    stillBase.value = wide ? media.wide : media.small
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowTier = !!rootEl.value.closest('.perf-low')
    if (media.kind === 'image' || reduced || lowTier) {
      mode.value = 'still'
      return
    }
    const src = await pickSource(stillBase.value, wide ? 1280 : 640, wide ? 720 : 360)
    mode.value = 'video'
    await nextTick()
    const v = videoEl.value
    if (!v) return
    v.muted = true // the attribute alone is not always reflected, and autoplay needs it
    v.src = src
    play()
  }

  // The clip is shown whole-width at its own 16:9 shape, never stretched. Its anchor
  // point is kept at the hero's centre without uncovering an edge while it is taller
  // than the hero (the collapsed phone hero, desktop); a shorter one sits inside the hero
  // over its blurred copy. The box keeps its size when the phone hero collapses or
  // expands, so it only slides (a compositor `translate` transition).
  function place() {
    const root = rootEl.value
    const box = boxEl.value
    if (!root || !box) return
    const h = root.offsetHeight
    const boxH = box.offsetHeight
    const want = h / 2 - (props.media?.anchor ?? 0.5) * boxH
    const shift = Math.min(Math.max(0, h - boxH), Math.max(Math.min(0, h - boxH), want))
    root.style.setProperty('--hm-shift', `${Math.round(shift)}px`)
    filled.value = boxH < h - 1
    if (!settled.value) requestAnimationFrame(() => (settled.value = true))
  }

  function onVisibility() {
    if (document.hidden) videoEl.value?.pause()
    else play()
  }

  onMounted(() => {
    const root = rootEl.value
    if (!root) return
    place()
    ro = new ResizeObserver(place)
    ro.observe(root)
    // paused while the hero is off screen: no decoding nobody sees
    io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting
      if (visible) play()
      else videoEl.value?.pause()
    })
    io.observe(root)
    document.addEventListener('visibilitychange', onVisibility)

    const idle = (cb: () => void) =>
      'requestIdleCallback' in window
        ? window.requestIdleCallback(cb, { timeout: 2500 })
        : setTimeout(cb, 300)
    if (document.readyState === 'complete') idle(start)
    else window.addEventListener('load', () => idle(start), { once: true })
  })

  onBeforeUnmount(() => {
    ro?.disconnect()
    io?.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    filled.value = false
    const v = videoEl.value
    if (v) {
      v.pause()
      v.removeAttribute('src')
      v.load() // release the decoder and the download
    }
  })
</script>

<style scoped>
  .hero-media {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
    transition: opacity 1.6s cubic-bezier(0.2, 0, 0, 1);
    /* the clip melts into the page instead of ending on a hard line */
    -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 62%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0, #000 62%, transparent 100%);
  }
  .hero-media.is-ready {
    opacity: 1;
  }
  .hero-media.is-translucent.is-ready {
    opacity: 0.38;
  }

  /* the clip at its own 16:9 shape, full width */
  .hero-media__box {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    aspect-ratio: 16 / 9;
    translate: 0 var(--hm-shift, 0px);
  }
  /* phones: at least the collapsed hero's height (228px), so on narrow phones the clip
     covers it with a slight zoom (390px: 219 → 240, +10 %) instead of showing the
     blurred copy above and below a 9px-short strip */
  @media (max-width: 767px) {
    .hero-media__box {
      /* width stays the hero's (= the viewport on phones); `cover` trims the sides */
      aspect-ratio: auto;
      height: max(56.25vw, 240px);
    }
  }
  .hero-media.is-settled .hero-media__box {
    /* the curve and length of the hero content's own expand animation */
    transition: translate 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  /* over its blurred copy the clip's top and bottom edges feather into it */
  .hero-media.is-filled .hero-media__box {
    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent);
    mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent);
  }

  .hero-media__el {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: var(--hm-focus, 50% 50%);
  }

  /* the blurred copy, oversized so the blur has no soft transparent rim */
  .hero-media__fill {
    position: absolute;
    inset: -12%;
    width: 124%;
    height: 124%;
    opacity: 0;
    filter: blur(18px) saturate(1.15);
    transition: opacity 0.6s ease;
  }
  .hero-media__fill img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  canvas.hero-media__fill {
    object-fit: cover;
  }
  .hero-media.is-filled .hero-media__fill {
    opacity: 1;
  }

  /* darkened so the cover, title and buttons keep their contrast: heavier at the
     edges and under the text column, lighter around the clip's centre */
  .hero-media::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 90% at 50% 45%, rgb(0 0 0 / 0.32), rgb(0 0 0 / 0.72) 75%),
      linear-gradient(to bottom, rgb(0 0 0 / 0.45), rgb(0 0 0 / 0.38) 40%, rgb(0 0 0 / 0.6));
  }
  /* on glass the scrim only shades: a dark one would turn the glass opaque again */
  .hero-media.is-translucent::after {
    background: radial-gradient(120% 90% at 50% 45%, rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.36) 75%);
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-media,
    .hero-media.is-settled .hero-media__box,
    .hero-media__fill {
      transition-duration: 0.01s;
    }
  }
</style>
