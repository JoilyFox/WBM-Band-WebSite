/**
 * One clock for the release page's links ⇄ lyrics switch.
 *
 * Every moving part of that switch (the hero quick-action pills, the two
 * cross-sliding panes and the swap container's height) is animated with these
 * exact timing options, created in the same task. They therefore share a start
 * frame, a duration and an easing curve, and finish on the same frame.
 *
 * The pills and panes only animate `translate` and `opacity`, which browsers run
 * on the compositor (Core Animation on iOS). The motion keeps the display's full
 * refresh rate (120 Hz on ProMotion iPhones) even while the page's main thread
 * is busy. The old `--hqa-p` custom-property morph ran on the main thread, so
 * every busy frame dropped a step.
 */
export const LYRICS_MORPH_MS = 420
export const LYRICS_MORPH_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

export const lyricsMorphTiming = (): KeyframeAnimationOptions => ({
  duration: LYRICS_MORPH_MS,
  easing: LYRICS_MORPH_EASING,
  fill: 'none'
})

/** Computed `translate` → a keyframe value (`none` is not interpolable everywhere). */
export const toTranslate = (value: string): string => (value && value !== 'none' ? value : '0px')

/**
 * Opacity keyframes for a fade inside the shared clock. The fades use two
 * overlapping windows of the eased progress, so the outgoing and incoming
 * labels never sit on top of each other at half opacity. The outgoing element
 * fades over p 0→0.6 and the incoming one over p 0.4→1. The offsets are in
 * eased progress because the easing is set on the whole effect.
 */
export const fadeKeyframes = (from: number, to: number): Keyframe[] =>
  to < from
    ? [
        { opacity: from, offset: 0 },
        { opacity: to, offset: 0.6 },
        { opacity: to, offset: 1 }
      ]
    : [
        { opacity: from, offset: 0 },
        { opacity: from, offset: 0.4 },
        { opacity: to, offset: 1 }
      ]
