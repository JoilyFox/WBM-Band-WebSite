// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MusicHeroPill from '~/components/music/HeroPill.vue'

// The shared glass "pill" used for the release-hero actions (Music Video,
// Lyrics, Collapse, Back). It renders as a NATIVE <button> by default or a
// native <a> when `as="a"`.
//
// REGRESSION GUARD — the pill must render NATIVE elements, never a PrimeVue
// Button. PrimeVue globally registers a `Button` component, so a
// `<component :is="'button'">` resolved 'button' → PrimeVue Button (+ Ripple).
// In unstyled mode the ripple's <span class="p-ink"> is not position:absolute,
// so a real pointer-down made it a static block and inflated the pill to ~200px
// tall (the <a> Music Video pill never broke — no component is registered for
// 'a'). The component now renders explicit <a>/<button>. The `p-button` / no-
// `data-p` assertions below lock that in. `appearance-none` + `self-center` are
// kept as defensive hygiene (native control sizing / flex stretch).

describe('MusicHeroPill', () => {
  it('renders a <button> by default with type="button"', async () => {
    const w = await mountSuspended(MusicHeroPill, { props: { label: 'Collapse' } })
    const btn = w.get('button')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.text()).toContain('Collapse')
  })

  it('renders a NATIVE <button>, not a PrimeVue Button (no p-button / no Ripple)', async () => {
    const w = await mountSuspended(MusicHeroPill, { props: { label: 'Lyrics' } })
    const btn = w.get('button')
    expect(btn.classes()).not.toContain('p-button')
    expect(btn.classes()).not.toContain('p-component')
    // PrimeVue marks its host with data-p; a native element never carries it.
    expect(btn.attributes('data-p')).toBeUndefined()
    // Ripple appends a <span class="p-ink"> — there must be none.
    expect(w.find('.p-ink').exists()).toBe(false)
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
