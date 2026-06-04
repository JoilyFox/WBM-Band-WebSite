// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MusicHeroPill from '~/components/music/HeroPill.vue'

// The shared glass "pill" used for the release-hero actions (Music Video,
// Lyrics, Collapse, Back). It renders as a <button> by default or an <a> when
// `as="a"`, and carries two layout guards that must NOT be removed:
//   - `appearance-none`: neutralizes the native control box. iOS Safari sizes a
//     `-webkit-appearance: button` control with NATIVE metrics that scale with
//     the system / accessibility text size, which inflated the <button> pills to
//     200–300px tall on real devices (the <a> Music Video pill never broke —
//     anchors have no native appearance). appearance:none makes the <button>
//     size purely from CSS, exactly like the working <a>.
//   - `self-center`: pins align-self so the pill can't be cross-axis stretched
//     by a flex parent.
// These two assertions are the regression guard for that fix.

describe('MusicHeroPill', () => {
  it('renders a <button> by default with type="button"', async () => {
    const w = await mountSuspended(MusicHeroPill, { props: { label: 'Collapse' } })
    const btn = w.get('button')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.text()).toContain('Collapse')
  })

  it('renders an <a> with href/target/rel when as="a"', async () => {
    const w = await mountSuspended(MusicHeroPill, {
      props: {
        as: 'a',
        href: 'https://youtu.be/x',
        target: '_blank',
        rel: 'noopener noreferrer',
        label: 'Music Video'
      }
    })
    const a = w.get('a')
    expect(a.attributes('href')).toBe('https://youtu.be/x')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toBe('noopener noreferrer')
    expect(w.find('button').exists()).toBe(false)
  })

  // --- iOS-Safari height-inflation fix: keep these classes ---
  it('keeps appearance-none on the root so the <button> never uses native control sizing', async () => {
    const w = await mountSuspended(MusicHeroPill, { props: { label: 'Lyrics' } })
    expect(w.get('button').classes()).toContain('appearance-none')
  })

  it('keeps self-center so the pill cannot be cross-axis stretched by a flex parent', async () => {
    const w = await mountSuspended(MusicHeroPill, { props: { label: 'Lyrics' } })
    expect(w.get('button').classes()).toContain('self-center')
  })

  it('applies appearance-none to the <a> variant too', async () => {
    const w = await mountSuspended(MusicHeroPill, {
      props: { as: 'a', href: '#', label: 'Music Video' }
    })
    expect(w.get('a').classes()).toContain('appearance-none')
  })

  it('renders the icon <i> with the provided icon class', async () => {
    const w = await mountSuspended(MusicHeroPill, {
      props: { icon: 'pi pi-chevron-up text-base leading-none', label: 'Collapse' }
    })
    const i = w.get('i')
    expect(i.classes()).toContain('pi')
    expect(i.classes()).toContain('pi-chevron-up')
  })

  it("emits 'click' with the native event", async () => {
    const w = await mountSuspended(MusicHeroPill, { props: { label: 'Tap' } })
    await w.get('button').trigger('click')
    const events = w.emitted('click')
    expect(events).toHaveLength(1)
    expect(events?.[0][0]).toBeInstanceOf(Event)
  })

  it('renders both narrow and wide labels (UiResponsiveText) when provided', async () => {
    const w = await mountSuspended(MusicHeroPill, {
      props: { narrowLabel: 'Lyrics', wideLabel: 'Song Lyrics', breakpoint: 440 }
    })
    // Both strings are in the DOM; CSS reveals exactly one per width.
    expect(w.text()).toContain('Lyrics')
    expect(w.text()).toContain('Song Lyrics')
  })
})
