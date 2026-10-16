/** Practical meta-description ceiling: Google truncates around 155-160 characters. */
export const META_DESCRIPTION_MAX = 155

/** Cut `text` to at most `max` chars on a word boundary, dropping dangling punctuation. */
function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const slice = text.slice(0, Math.max(0, max))
  const lastSpace = slice.lastIndexOf(' ')
  const base = lastSpace > 0 ? slice.slice(0, lastSpace) : slice
  return base.replace(/[\s,;:.\-–—]+$/u, '')
}

/**
 * Build a meta description from a release blurb plus a localized, fixed suffix.
 *
 * `render(description)` returns the candidate descriptions from richest to most
 * compact (e.g. "blurb + full band name + platform list", then "blurb + short tag").
 * The richest candidate that fits `max` wins; if even the most compact one is too
 * long, the blurb itself is shortened on a word boundary and ends with "…" so the
 * band/platform suffix is never the part that gets cut off.
 */
export function fitDescription(
  description: string,
  render: (description: string) => string[],
  max: number = META_DESCRIPTION_MAX
): string {
  const variants = render(description)
  const fitting = variants.find((v) => v.length <= max)
  if (fitting) return fitting

  const compact = variants[variants.length - 1]
  const overflow = compact.length - max
  // +1 reserves room for the ellipsis character.
  const trimmed = `${cutAtWord(description, description.length - overflow - 1)}…`
  return render(trimmed)[variants.length - 1]
}
