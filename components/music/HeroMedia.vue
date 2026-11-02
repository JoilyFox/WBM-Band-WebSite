<template>
  <div
    v-if="media"
    ref="rootEl"
    class="hero-media"
    :class="{ 'is-ready': ready, 'is-settled': settled, 'is-translucent': translucent }"
    :style="{ '--hm-focus': media.focus }"
    aria-hidden="true"
  >
    <div class="hero-media__box">
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
      <picture v-else-if="mode === 'still'">
        <source
          media="(min-width: 768px)"
          :srcset="`${media.wide}.poster.avif`"
          type="image/avif"
        />
        <source
          media="(min-width: 768px)"
          :srcset="`${media.wide}.poster.webp`"
          type="image/webp"
        />
        <source :srcset="`${media.tall}.poster.avif`" type="image/avif" />
        <source :srcset="`${media.tall}.poster.webp`" type="image/webp" />
        <img
          class="hero-media__el"
          :src="`${media.tall}.poster.jpg`"
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
  const videoEl = ref<HTMLVideoElement | null>(null)
  // off = the hero as without media; still = the poster frame; video = the clip
  const mode = ref<'off' | 'video' | 'still'>('off')
  const ready = ref(false)
  // the box only animates after its first placement (no slide-in on load)
  const settled = ref(false)

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

  function onPlaying() {
    const v = videoEl.value as
      | (HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => void })
      | null
    // fade in once a frame is actually painted (no black first frame)
    if (v?.requestVideoFrameCallback) v.requestVideoFrameCallback(() => (ready.value = true))
    else ready.value = true
  }

  async function start() {
    const media = props.media
    if (!media || !rootEl.value) return
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection
    // the user asked for less data, or the network can't carry it: the hero stays as is
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowTier = !!rootEl.value.closest('.perf-low')
    if (media.kind === 'image' || reduced || lowTier) {
      mode.value = 'still'
      return
    }
    const wide = window.matchMedia('(min-width: 768px)').matches
    const src = await pickSource(
      wide ? media.wide : media.tall,
      wide ? 1280 : 540,
      wide ? 720 : 960
    )
    mode.value = 'video'
    await nextTick()
    const v = videoEl.value
    if (!v) return
    v.muted = true // the attribute alone is not always reflected, and autoplay needs it
    v.src = src
    play()
  }

  // Keep the box's anchor point at the centre of the hero, never uncovering an edge. The
  // box keeps its own height (at least --hm-min-h), so when the phone hero collapses or
  // expands the picture is never rescaled: it slides (a compositor `translate`
  // transition) while the hero crops more or less of it.
  function place() {
    const root = rootEl.value
    const box = root?.firstElementChild as HTMLElement | null
    if (!root || !box) return
    const h = root.offsetHeight
    const boxH = box.offsetHeight
    const want = h / 2 - (props.media?.anchor ?? 0.5) * boxH
    const shift = Math.min(0, Math.max(h - boxH, want))
    root.style.setProperty('--hm-shift', `${Math.round(shift)}px`)
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
    /* phones: the box is at least this tall, so collapsing / expanding the hero
       crops the clip instead of rescaling it */
    --hm-min-h: 0px;
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
  @media (max-width: 767px) {
    .hero-media {
      --hm-min-h: 760px;
    }
  }
  .hero-media.is-ready {
    opacity: 1;
  }
  .hero-media.is-translucent.is-ready {
    opacity: 0.5;
  }

  .hero-media__box {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: max(100%, var(--hm-min-h));
    translate: 0 var(--hm-shift, 0px);
    /* soft lower edge: while the expanding hero is still sliding it into place the
       not-yet-covered strip reads as a fade, not a gap */
    -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 80%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0, #000 80%, transparent 100%);
  }
  .hero-media.is-settled .hero-media__box {
    /* the curve and length of the hero content's own expand animation */
    transition: translate 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .hero-media__el {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: var(--hm-focus, 50% 50%);
  }

  /* darkened so the cover, title and buttons keep their contrast: heavier at the
     edges and under the text column, lighter around the clip's centre */
  .hero-media__box::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 90% at 50% 45%, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.8) 75%),
      linear-gradient(to bottom, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.48) 40%, rgb(0 0 0 / 0.68));
  }

  /* on glass the scrim only shades: a dark one would turn the glass opaque again */
  .hero-media.is-translucent .hero-media__box::after {
    background: radial-gradient(120% 90% at 50% 45%, transparent, rgb(0 0 0 / 0.3) 75%);
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-media,
    .hero-media.is-settled .hero-media__box {
      transition-duration: 0.01s;
    }
  }
</style>
