// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import Snackbar from '~/components/common/Snackbar.vue'
import { useSnackbarStore } from '~/store/snackbar'

// Snackbar.vue is a presentation layer driven entirely by store/snackbar.ts. It
// renders one `.snackbar-item` per VISIBLE snackbar (getter filters on `show`),
// stamps a per-type CSS class via three parallel mappers (item / icon / progress)
// that all default to the `info` variant on an unknown type, renders an optional
// subtitle, gates the progress bar on `timeout > 0`, and wires the close button to
// `store.hideSnackbar`. mountSuspended provides a real Pinia, so we drive the store
// directly and assert the rendered DOM. Timers are faked because the store arms a
// real setTimeout auto-hide and a 500ms array-splice on hide.

describe('common/Snackbar.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  // Mount, then reset the store to a clean slate so a fresh Pinia per test is
  // guaranteed regardless of mount order, and return both wrapper and store.
  const setup = async () => {
    const w = await mountSuspended(Snackbar)
    const store = useSnackbarStore()
    store.$reset()
    await nextTick()
    return { w, store }
  }

  describe('rendering visible snackbars', () => {
    it('renders nothing when the store is empty', async () => {
      const { w } = await setup()
      expect(w.findAll('.snackbar-item')).toHaveLength(0)
    })

    it('renders one item per visible snackbar with its message', async () => {
      const { w, store } = await setup()
      store.showSnackbar({ message: 'Hello there', type: 'info', timeout: 0 })
      store.showSnackbar({ message: 'Second one', type: 'success', timeout: 0 })
      await nextTick()

      const items = w.findAll('.snackbar-item')
      expect(items).toHaveLength(2)
      const text = w.text()
      expect(text).toContain('Hello there')
      expect(text).toContain('Second one')
    })

    it('renders the subtitle only when one is provided', async () => {
      const { w, store } = await setup()
      store.showSnackbar({ message: 'With sub', subtitle: 'extra detail', timeout: 0 })
      store.showSnackbar({ message: 'No sub', timeout: 0 })
      await nextTick()

      const subtitles = w.findAll('.snackbar-subtitle')
      // Exactly one of the two items carries a subtitle.
      expect(subtitles).toHaveLength(1)
      expect(subtitles[0].text()).toBe('extra detail')
    })

    it('hidden snackbars (show=false) are filtered out of the rendered list', async () => {
      const { w, store } = await setup()
      const id = store.showSnackbar({ message: 'Will hide', timeout: 0 })
      await nextTick()
      expect(w.findAll('.snackbar-item')).toHaveLength(1)

      // hideSnackbar flips `show` to false synchronously → getter drops it.
      store.hideSnackbar(id)
      await nextTick()
      expect(w.findAll('.snackbar-item')).toHaveLength(0)
    })
  })

  describe('per-type item class mapper (getSnackbarClasses)', () => {
    const cases = [
      ['success', 'snackbar-success'],
      ['error', 'snackbar-error'],
      ['warning', 'snackbar-warning'],
      ['info', 'snackbar-info']
    ] as const

    it.each(cases)('type %s → applies snackbar-base + %s', async (type, expected) => {
      const { w, store } = await setup()
      store.showSnackbar({ message: 'x', type: type as never, timeout: 0 })
      await nextTick()

      const item = w.get('.snackbar-item')
      expect(item.classes()).toContain('snackbar-base')
      expect(item.classes()).toContain(expected)
    })
  })

  describe('per-type icon class mapper (getIconClass)', () => {
    const cases = [
      ['success', 'pi-check-circle'],
      ['error', 'pi-times-circle'],
      ['warning', 'pi-exclamation-triangle'],
      ['info', 'pi-info-circle']
    ] as const

    it.each(cases)('type %s → icon %s', async (type, expectedIcon) => {
      const { w, store } = await setup()
      store.showSnackbar({ message: 'x', type: type as never, timeout: 0 })
      await nextTick()

      const icon = w.get('.snackbar-icon i')
      expect(icon.classes()).toContain('pi')
      expect(icon.classes()).toContain(expectedIcon)
    })
  })

  describe('per-type progress class mapper (getProgressClasses)', () => {
    const cases = [
      ['success', 'progress-success'],
      ['error', 'progress-error'],
      ['warning', 'progress-warning'],
      ['info', 'progress-info']
    ] as const

    it.each(cases)('type %s → progress %s', async (type, expectedProgress) => {
      const { w, store } = await setup()
      // timeout > 0 so the progress bar renders.
      store.showSnackbar({ message: 'x', type: type as never, timeout: 4000 })
      await nextTick()

      const progress = w.get('.snackbar-progress')
      expect(progress.classes()).toContain(expectedProgress)
    })
  })

  describe('unknown type falls back to the info variant across all three mappers', () => {
    it('applies info item/icon/progress classes for an unrecognised type', async () => {
      const { w, store } = await setup()
      // Push a malformed snackbar straight into state to exercise the `|| info`
      // default branch of every mapper (the typed action would not allow this).
      store.snackbars.push({
        id: 999,
        message: 'mystery',
        type: 'mystery' as never,
        timeout: 4000,
        show: true
      })
      await nextTick()

      const item = w.get('.snackbar-item')
      expect(item.classes()).toContain('snackbar-info')
      expect(item.classes()).not.toContain('snackbar-success')

      expect(w.get('.snackbar-icon i').classes()).toContain('pi-info-circle')
      expect(w.get('.snackbar-progress').classes()).toContain('progress-info')
    })
  })

  describe('progress bar gating (timeout > 0)', () => {
    it('renders a progress bar when timeout > 0 and sets animationDuration', async () => {
      const { w, store } = await setup()
      store.showSnackbar({ message: 'timed', type: 'info', timeout: 3000 })
      await nextTick()

      const progress = w.get('.snackbar-progress')
      // The inline style mirrors the snackbar timeout.
      expect(progress.attributes('style')).toContain('animation-duration: 3000ms')
      // data attribute is the per-snackbar handle the component uses to pause/resume.
      expect(progress.attributes('data-snackbar-id')).toBeTruthy()
    })

    it('omits the progress bar entirely when timeout is 0', async () => {
      const { w, store } = await setup()
      store.showSnackbar({ message: 'sticky', type: 'info', timeout: 0 })
      await nextTick()

      expect(w.findAll('.snackbar-item')).toHaveLength(1)
      expect(w.find('.snackbar-progress').exists()).toBe(false)
    })
  })

  describe('close button', () => {
    it('clicking the close button hides that snackbar via the store', async () => {
      const { w, store } = await setup()
      store.showSnackbar({ message: 'closable', timeout: 0 })
      await nextTick()
      expect(w.findAll('.snackbar-item')).toHaveLength(1)

      const hideSpy = vi.spyOn(store, 'hideSnackbar')
      await w.get('.snackbar-close').trigger('click')
      await nextTick()

      expect(hideSpy).toHaveBeenCalledTimes(1)
      // The targeted snackbar is gone from the visible list.
      expect(w.findAll('.snackbar-item')).toHaveLength(0)
    })

    it('only the clicked snackbar is removed; others remain', async () => {
      const { w, store } = await setup()
      const keepId = store.showSnackbar({ message: 'keep me', type: 'success', timeout: 0 })
      store.showSnackbar({ message: 'remove me', type: 'error', timeout: 0 })
      await nextTick()
      expect(w.findAll('.snackbar-item')).toHaveLength(2)

      // The second item in the list is "remove me" — click its close button.
      const closeButtons = w.findAll('.snackbar-close')
      await closeButtons[1].trigger('click')
      await nextTick()

      const items = w.findAll('.snackbar-item')
      expect(items).toHaveLength(1)
      expect(w.text()).toContain('keep me')
      expect(w.text()).not.toContain('remove me')
      // The surviving snackbar is the one we intended to keep.
      expect(store.visibleSnackbars[0].id).toBe(keepId)
    })
  })

  describe('hover pause/resume timer hooks', () => {
    it('mouseenter pauses the store timer; mouseleave resumes it', async () => {
      const { w, store } = await setup()
      const id = store.showSnackbar({ message: 'hoverable', type: 'info', timeout: 4000 })
      await nextTick()

      const pauseSpy = vi.spyOn(store, 'pauseTimer')
      const resumeSpy = vi.spyOn(store, 'resumeTimer')

      const item = w.get('.snackbar-item')
      await item.trigger('mouseenter')
      expect(pauseSpy).toHaveBeenCalledWith(id)

      await item.trigger('mouseleave')
      expect(resumeSpy).toHaveBeenCalledWith(id)
    })
  })

  describe('convenience type methods drive the right rendered variant', () => {
    it('showSuccess → success variant rendered', async () => {
      const { w, store } = await setup()
      store.showSuccess('done', undefined, 0)
      await nextTick()
      expect(w.get('.snackbar-item').classes()).toContain('snackbar-success')
      expect(w.get('.snackbar-icon i').classes()).toContain('pi-check-circle')
    })

    it('showError → error variant rendered', async () => {
      const { w, store } = await setup()
      store.showError('oops', undefined, 0)
      await nextTick()
      expect(w.get('.snackbar-item').classes()).toContain('snackbar-error')
      expect(w.get('.snackbar-icon i').classes()).toContain('pi-times-circle')
    })

    it('showWarning → warning variant rendered', async () => {
      const { w, store } = await setup()
      store.showWarning('careful', undefined, 0)
      await nextTick()
      expect(w.get('.snackbar-item').classes()).toContain('snackbar-warning')
      expect(w.get('.snackbar-icon i').classes()).toContain('pi-exclamation-triangle')
    })

    it('showInfo → info variant rendered', async () => {
      const { w, store } = await setup()
      store.showInfo('fyi', undefined, 0)
      await nextTick()
      expect(w.get('.snackbar-item').classes()).toContain('snackbar-info')
      expect(w.get('.snackbar-icon i').classes()).toContain('pi-info-circle')
    })
  })
})
