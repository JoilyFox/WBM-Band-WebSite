// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppButton from '~/components/ui/AppButton.vue'

// AppButton wraps the (unstyled) PrimeVue Button, which renders a real <button>.
// It exposes label + slot content, a guarded click handler (suppressed while
// disabled OR loading), and two computed class strings:
//   - buttonClasses: base + variant + size
//   - iconClasses:   `pi <icon> <position>` where position is ml-2 (right+label)
//                    else mr-2, and is omitted entirely when there's no label.
// The icon <i> is hidden while loading (`v-if="icon && !loading"`).

describe('AppButton', () => {
  describe('rendering: label + slot + icon', () => {
    it('renders the label prop inside a <button>', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'Click me' } })
      const button = w.get('button')
      expect(button.text()).toContain('Click me')
      expect(button.find('span').text()).toBe('Click me')
    })

    it('renders default slot content alongside the label', async () => {
      const w = await mountSuspended(AppButton, {
        props: { label: 'Label' },
        slots: { default: () => 'SlotText' }
      })
      expect(w.text()).toContain('Label')
      expect(w.text()).toContain('SlotText')
    })

    it('renders slot content even when no label is provided', async () => {
      const w = await mountSuspended(AppButton, { slots: { default: () => 'OnlySlot' } })
      expect(w.text()).toContain('OnlySlot')
      // No label → the label <span>{{ label }}</span> is not rendered. (The only
      // <span> present is PrimeVue's ripple element, which carries no text.)
      const labelSpans = w.findAll('button > span').filter((s) => s.text().trim().length > 0)
      expect(labelSpans).toHaveLength(0)
    })

    it('renders the icon <i> with the pi base + icon class when icon is set', async () => {
      const w = await mountSuspended(AppButton, {
        props: { label: 'Go', icon: 'pi-arrow-right' }
      })
      const i = w.get('i')
      expect(i.classes()).toContain('pi')
      expect(i.classes()).toContain('pi-arrow-right')
    })

    it('does not render an <i> when no icon prop is provided', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'NoIcon' } })
      expect(w.find('i').exists()).toBe(false)
    })
  })

  describe('click emission', () => {
    it("emits 'click' with the native event when enabled", async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'Tap' } })
      await w.get('button').trigger('click')
      const events = w.emitted('click')
      expect(events).toBeTruthy()
      expect(events).toHaveLength(1)
      // handleClick forwards the event object as the payload.
      expect(events?.[0][0]).toBeInstanceOf(Event)
    })

    it('emits once per click', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'Tap' } })
      await w.get('button').trigger('click')
      await w.get('button').trigger('click')
      expect(w.emitted('click')).toHaveLength(2)
    })
  })

  describe('handleClick suppression', () => {
    it("does NOT emit 'click' when disabled", async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X', disabled: true } })
      await w.get('button').trigger('click')
      expect(w.emitted('click')).toBeUndefined()
    })

    it("does NOT emit 'click' when loading", async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X', loading: true } })
      await w.get('button').trigger('click')
      expect(w.emitted('click')).toBeUndefined()
    })

    it("does NOT emit 'click' when both disabled and loading", async () => {
      const w = await mountSuspended(AppButton, {
        props: { label: 'X', disabled: true, loading: true }
      })
      await w.get('button').trigger('click')
      expect(w.emitted('click')).toBeUndefined()
    })

    it('sets the native disabled attribute when the disabled prop is true', async () => {
      const disabledBtn = await mountSuspended(AppButton, {
        props: { label: 'X', disabled: true }
      })
      const btn = disabledBtn.get('button')
      expect(btn.attributes('disabled')).toBeDefined()
      expect(btn.attributes('data-p-disabled')).toBe('true')
    })

    it('marks the button as loading (p-button-loading + data-p-disabled) when loading', async () => {
      // Loading without the disabled prop does NOT add the native `disabled`
      // attribute, but PrimeVue flags it via the loading class + data attr — and
      // AppButton's own handleClick guard is what actually blocks the emit.
      const loadingBtn = await mountSuspended(AppButton, { props: { label: 'X', loading: true } })
      const btn = loadingBtn.get('button')
      expect(btn.classes()).toContain('p-button-loading')
      expect(btn.attributes('data-p-disabled')).toBe('true')
    })
  })

  describe('buttonClasses: variant', () => {
    const base =
      'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

    it('defaults to the primary variant', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X' } })
      const cls = w.get('button').classes()
      expect(cls).toContain('bg-primary-500')
      expect(cls).toContain('text-white')
    })

    it('always includes the base classes regardless of variant', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X' } })
      const html = w.get('button').attributes('class') ?? ''
      for (const token of base.split(' ')) {
        expect(html).toContain(token)
      }
    })

    it('applies the secondary variant classes', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X', variant: 'secondary' } })
      const cls = w.get('button').classes()
      expect(cls).toContain('bg-surface-100')
      expect(cls).toContain('text-surface-900')
      expect(cls).not.toContain('bg-primary-500')
    })

    it('applies the outline variant classes', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X', variant: 'outline' } })
      const cls = w.get('button').classes()
      expect(cls).toContain('border')
      expect(cls).toContain('border-primary-500')
      expect(cls).toContain('text-primary-500')
    })

    it('applies the text variant classes', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X', variant: 'text' } })
      const cls = w.get('button').classes()
      expect(cls).toContain('text-primary-500')
      expect(cls).toContain('hover:bg-primary-50')
      expect(cls).not.toContain('bg-primary-500')
    })
  })

  describe('buttonClasses: size', () => {
    it('defaults to the medium size', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X' } })
      const cls = w.get('button').classes()
      expect(cls).toContain('px-4')
      expect(cls).toContain('py-2')
    })

    it('applies the small size classes', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X', size: 'small' } })
      const cls = w.get('button').classes()
      expect(cls).toContain('px-3')
      expect(cls).toContain('py-1.5')
      expect(cls).toContain('text-sm')
    })

    it('applies the large size classes', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'X', size: 'large' } })
      const cls = w.get('button').classes()
      expect(cls).toContain('px-6')
      expect(cls).toContain('py-3')
      expect(cls).toContain('text-lg')
    })
  })

  describe('iconClasses: position', () => {
    it('uses mr-2 for a left icon (default) with a label', async () => {
      const w = await mountSuspended(AppButton, {
        props: { label: 'Go', icon: 'pi-check', iconPos: 'left' }
      })
      const cls = w.get('i').classes()
      expect(cls).toContain('mr-2')
      expect(cls).not.toContain('ml-2')
    })

    it('uses ml-2 for a right icon with a label', async () => {
      const w = await mountSuspended(AppButton, {
        props: { label: 'Go', icon: 'pi-check', iconPos: 'right' }
      })
      const cls = w.get('i').classes()
      expect(cls).toContain('ml-2')
      expect(cls).not.toContain('mr-2')
    })

    it('omits the position margin when there is no label (left icon)', async () => {
      const w = await mountSuspended(AppButton, {
        props: { icon: 'pi-check', iconPos: 'left' }
      })
      const cls = w.get('i').classes()
      expect(cls).toContain('pi')
      expect(cls).toContain('pi-check')
      expect(cls).not.toContain('mr-2')
      expect(cls).not.toContain('ml-2')
    })

    it('omits the position margin when there is no label (right icon)', async () => {
      const w = await mountSuspended(AppButton, {
        props: { icon: 'pi-check', iconPos: 'right' }
      })
      const cls = w.get('i').classes()
      expect(cls).not.toContain('mr-2')
      expect(cls).not.toContain('ml-2')
    })

    it('defaults iconPos to left (mr-2) when not specified', async () => {
      const w = await mountSuspended(AppButton, { props: { label: 'Go', icon: 'pi-check' } })
      expect(w.get('i').classes()).toContain('mr-2')
    })
  })

  describe('icon hidden while loading', () => {
    it('hides the icon <i> while loading even when an icon is set', async () => {
      const w = await mountSuspended(AppButton, {
        props: { label: 'Go', icon: 'pi-check', loading: true }
      })
      expect(w.find('i').exists()).toBe(false)
    })

    it('shows the icon again once loading is false', async () => {
      const w = await mountSuspended(AppButton, {
        props: { label: 'Go', icon: 'pi-check', loading: false }
      })
      expect(w.find('i').exists()).toBe(true)
    })
  })
})
