// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import UiIcon from '~/components/ui/Icon.vue'
import { ICON_GLYPHS } from '~/utils/icons'

// UiIcon replaced the Font Awesome webfont: every platform / UI icon the site
// used must have a glyph, render as an inline currentColor SVG, and be
// decorative (aria-hidden) unless a title is supplied.
describe('UiIcon', () => {
  it('has a glyph for every icon the site used to load from Font Awesome', () => {
    for (const name of [
      'spotify',
      'apple',
      'youtube',
      'soundcloud',
      'bandcamp',
      'amazon',
      'google-play',
      'itunes',
      'circle-play',
      'music',
      'water',
      'radio',
      'house'
    ]) {
      expect(ICON_GLYPHS, name).toHaveProperty(name)
    }
  })

  it('renders an aria-hidden currentColor svg with the glyph path', async () => {
    const w = await mountSuspended(UiIcon, { props: { name: 'spotify' } })
    const svg = w.get('svg')
    expect(svg.attributes('fill')).toBe('currentColor')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('viewBox')).toBe(ICON_GLYPHS.spotify.viewBox)
    expect(w.get('path').attributes('d')).toBe(ICON_GLYPHS.spotify.d)
  })

  it('exposes a label when a title is given', async () => {
    const w = await mountSuspended(UiIcon, { props: { name: 'house', title: 'Home' } })
    expect(w.get('svg').attributes('role')).toBe('img')
    expect(w.get('svg').attributes('aria-label')).toBe('Home')
    expect(w.get('svg').attributes('aria-hidden')).toBeUndefined()
  })

  it('falls back to the music glyph for an unknown name', async () => {
    const w = await mountSuspended(UiIcon, { props: { name: 'nope' } })
    expect(w.get('path').attributes('d')).toBe(ICON_GLYPHS.music.d)
  })
})
