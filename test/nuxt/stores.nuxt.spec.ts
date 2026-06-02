// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSnackbarStore } from '~/store/snackbar'
import { useGlobalLoadingStore } from '~/store/globalLoading'
import { useGlobalLoading } from '~/composables/useGlobalLoading'

// Store-layer characterization tests. The component layer for the snackbar lives
// in snackbar.nuxt.spec.ts; this file drives the Pinia stores and the
// useGlobalLoading composable DIRECTLY (no component mount) to pin their action
// logic: id generation, per-type default timeouts, the setTimeout auto-hide /
// pause / resume / splice machinery (faked timers), progress clamping, and the
// finally-block contract of withLoading. A fresh Pinia is installed per test so
// the file is order-independent; timers are faked because every store arms real
// setTimeout calls (auto-hide, 500ms splice, 300ms progress reset).

describe('store/snackbar.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('id generation (nextId monotonic)', () => {
    it('starts at 1 and increments by one per snackbar', () => {
      const store = useSnackbarStore()
      const a = store.showSnackbar({ message: 'a', timeout: 0 })
      const b = store.showSnackbar({ message: 'b', timeout: 0 })
      const c = store.showSnackbar({ message: 'c', timeout: 0 })
      expect(a).toBe(1)
      expect(b).toBe(2)
      expect(c).toBe(3)
      expect(store.nextId).toBe(4)
    })

    it('keeps incrementing even after snackbars are removed', () => {
      const store = useSnackbarStore()
      const a = store.showSnackbar({ message: 'a', timeout: 0 })
      store.hideSnackbar(a)
      vi.advanceTimersByTime(500)
      expect(store.snackbars).toHaveLength(0)
      // nextId is never rewound by removal.
      const b = store.showSnackbar({ message: 'b', timeout: 0 })
      expect(b).toBe(2)
    })
  })

  describe('showSnackbar defaults and stored shape', () => {
    it('defaults type to info and timeout to 4000 when omitted', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'plain' })
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.type).toBe('info')
      expect(s.timeout).toBe(4000)
      expect(s.show).toBe(true)
      expect(s.isPaused).toBe(false)
      expect(s.remainingTime).toBe(4000)
      expect(s.startTime).toBeTypeOf('number')
    })

    it('stores the provided subtitle', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'm', subtitle: 'sub', timeout: 0 })
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.subtitle).toBe('sub')
    })

    it('pushes onto the array preserving insertion order', () => {
      const store = useSnackbarStore()
      store.showSnackbar({ message: 'first', timeout: 0 })
      store.showSnackbar({ message: 'second', timeout: 0 })
      expect(store.snackbars.map((s) => s.message)).toEqual(['first', 'second'])
    })

    it('arms an auto-hide timer when timeout > 0', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'timed', timeout: 4000 })
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.timerId).toBeDefined()
    })

    it('does NOT arm a timer when timeout is 0', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'sticky', timeout: 0 })
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.timerId).toBeUndefined()
    })
  })

  describe('per-type convenience methods and their default timeouts', () => {
    it('showError defaults to a 6000ms timeout', () => {
      const store = useSnackbarStore()
      const id = store.showError('boom')
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.type).toBe('error')
      expect(s.timeout).toBe(6000)
    })

    it('showWarning defaults to a 5000ms timeout', () => {
      const store = useSnackbarStore()
      const id = store.showWarning('careful')
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.type).toBe('warning')
      expect(s.timeout).toBe(5000)
    })

    it('showSuccess uses the base 4000ms default', () => {
      const store = useSnackbarStore()
      const id = store.showSuccess('done')
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.type).toBe('success')
      expect(s.timeout).toBe(4000)
    })

    it('showInfo uses the base 4000ms default', () => {
      const store = useSnackbarStore()
      const id = store.showInfo('fyi')
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.type).toBe('info')
      expect(s.timeout).toBe(4000)
    })

    it('explicit timeout overrides the per-type default (error)', () => {
      const store = useSnackbarStore()
      const id = store.showError('boom', undefined, 1234)
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.timeout).toBe(1234)
    })

    it('explicit timeout overrides the per-type default (warning)', () => {
      const store = useSnackbarStore()
      const id = store.showWarning('careful', undefined, 999)
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.timeout).toBe(999)
    })

    it('falsy explicit timeout 0 falls back to the error default via `|| 6000`', () => {
      // showError uses `timeout || 6000`, so a 0 argument is coerced to 6000.
      const store = useSnackbarStore()
      const id = store.showError('boom', undefined, 0)
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.timeout).toBe(6000)
    })

    it('passes the subtitle through to the snackbar', () => {
      const store = useSnackbarStore()
      const id = store.showSuccess('done', 'with detail', 0)
      const s = store.snackbars.find((x) => x.id === id)!
      // success has no `|| default`, so timeout 0 stays 0.
      expect(s.timeout).toBe(0)
      expect(s.subtitle).toBe('with detail')
    })
  })

  describe('auto-hide timer fires after timeout', () => {
    it('flips show=false at the timeout boundary, then splices after 500ms', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'auto', timeout: 3000 })

      // Just before the boundary: still visible.
      vi.advanceTimersByTime(2999)
      expect(store.snackbars.find((x) => x.id === id)!.show).toBe(true)

      // At the boundary: hideSnackbar runs → show=false but still in the array.
      vi.advanceTimersByTime(1)
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.show).toBe(false)

      // The 500ms removal timer then splices it out.
      vi.advanceTimersByTime(500)
      expect(store.snackbars.find((x) => x.id === id)).toBeUndefined()
    })

    it('never auto-hides when timeout is 0', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'sticky', timeout: 0 })
      vi.advanceTimersByTime(100000)
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.show).toBe(true)
    })
  })

  describe('pauseTimer', () => {
    it('clears the timer, marks paused, and recomputes remainingTime from elapsed', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'p', timeout: 4000 })

      vi.advanceTimersByTime(1000)
      store.pauseTimer(id)

      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.isPaused).toBe(true)
      // 4000 - 1000 elapsed = 3000 remaining.
      expect(s.remainingTime).toBe(3000)

      // While paused, advancing past the original deadline must NOT auto-hide.
      vi.advanceTimersByTime(5000)
      expect(store.snackbars.find((x) => x.id === id)!.show).toBe(true)
    })

    it('clamps remainingTime to 0 when elapsed exceeds the timeout', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'p', timeout: 1000 })
      // Pause is a no-op once the auto-hide already fired (timerId cleared), so
      // pause BEFORE the deadline but after most of it has elapsed... the source
      // computes max(0, remaining - elapsed). We approximate by pausing right at
      // the edge using a sub-deadline advance.
      vi.advanceTimersByTime(900)
      store.pauseTimer(id)
      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.remainingTime).toBe(100)
    })

    it('is a no-op when the snackbar is already paused', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'p', timeout: 4000 })
      vi.advanceTimersByTime(1000)
      store.pauseTimer(id)
      const remainingAfterFirst = store.snackbars.find((x) => x.id === id)!.remainingTime

      // A second pause should not further mutate remainingTime (guard: !isPaused).
      vi.advanceTimersByTime(1000)
      store.pauseTimer(id)
      expect(store.snackbars.find((x) => x.id === id)!.remainingTime).toBe(remainingAfterFirst)
    })

    it('is a no-op for an unknown id', () => {
      const store = useSnackbarStore()
      expect(() => store.pauseTimer(999)).not.toThrow()
    })
  })

  describe('resumeTimer', () => {
    it('re-arms the timer using remainingTime and clears the paused flag', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'r', timeout: 4000 })

      vi.advanceTimersByTime(1000)
      store.pauseTimer(id) // remaining = 3000
      store.resumeTimer(id)

      const s = store.snackbars.find((x) => x.id === id)!
      expect(s.isPaused).toBe(false)

      // It should now hide ~3000ms after resume, not at the original 4000 mark.
      vi.advanceTimersByTime(2999)
      expect(store.snackbars.find((x) => x.id === id)!.show).toBe(true)
      vi.advanceTimersByTime(1)
      expect(store.snackbars.find((x) => x.id === id)!.show).toBe(false)
    })

    it('does nothing when the snackbar is not paused', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'r', timeout: 4000 })
      // Not paused → guard `snackbar.isPaused` short-circuits.
      store.resumeTimer(id)
      expect(store.snackbars.find((x) => x.id === id)!.isPaused).toBe(false)
    })

    it('does nothing when remainingTime is 0', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'r', timeout: 1000 })
      const s = store.snackbars.find((x) => x.id === id)!
      // Force the paused-with-zero-remaining state directly.
      clearTimeout(s.timerId)
      s.isPaused = true
      s.remainingTime = 0
      store.resumeTimer(id)
      // Guard `remainingTime > 0` fails → stays paused, no new timer hides it.
      expect(s.isPaused).toBe(true)
      vi.advanceTimersByTime(10000)
      expect(store.snackbars.find((x) => x.id === id)!.show).toBe(true)
    })

    it('is a no-op for an unknown id', () => {
      const store = useSnackbarStore()
      expect(() => store.resumeTimer(999)).not.toThrow()
    })
  })

  describe('hideSnackbar', () => {
    it('flips show=false synchronously and removes from the array after 500ms', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'h', timeout: 0 })
      store.hideSnackbar(id)

      // Synchronous: show is false but still present.
      expect(store.snackbars.find((x) => x.id === id)!.show).toBe(false)
      expect(store.snackbars).toHaveLength(1)

      // After the animation window the entry is spliced.
      vi.advanceTimersByTime(499)
      expect(store.snackbars).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(store.snackbars).toHaveLength(0)
    })

    it('clears the auto-hide timer so it does not fire again later', () => {
      const store = useSnackbarStore()
      const id = store.showSnackbar({ message: 'h', timeout: 4000 })
      const s = store.snackbars.find((x) => x.id === id)!
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
      store.hideSnackbar(id)
      expect(clearSpy).toHaveBeenCalledWith(s.timerId)
      clearSpy.mockRestore()
    })

    it('only removes the targeted snackbar; others survive', () => {
      const store = useSnackbarStore()
      const keep = store.showSnackbar({ message: 'keep', timeout: 0 })
      const drop = store.showSnackbar({ message: 'drop', timeout: 0 })
      store.hideSnackbar(drop)
      vi.advanceTimersByTime(500)
      expect(store.snackbars).toHaveLength(1)
      expect(store.snackbars[0].id).toBe(keep)
    })

    it('is a no-op for an unknown id', () => {
      const store = useSnackbarStore()
      store.showSnackbar({ message: 'x', timeout: 0 })
      expect(() => store.hideSnackbar(999)).not.toThrow()
      expect(store.snackbars).toHaveLength(1)
    })
  })

  describe('hideAllSnackbars', () => {
    it('flips every show=false immediately and empties the array after 500ms', () => {
      const store = useSnackbarStore()
      store.showSnackbar({ message: 'a', timeout: 4000 })
      store.showSnackbar({ message: 'b', timeout: 0 })
      store.showSnackbar({ message: 'c', timeout: 4000 })

      store.hideAllSnackbars()
      expect(store.snackbars.every((s) => s.show === false)).toBe(true)
      // Still present until the animation window elapses.
      expect(store.snackbars).toHaveLength(3)

      vi.advanceTimersByTime(500)
      expect(store.snackbars).toHaveLength(0)
    })

    it('on an empty store, leaves an empty array and does not throw', () => {
      const store = useSnackbarStore()
      expect(() => store.hideAllSnackbars()).not.toThrow()
      vi.advanceTimersByTime(500)
      expect(store.snackbars).toHaveLength(0)
    })
  })

  describe('visibleSnackbars getter', () => {
    it('returns only entries with show=true', () => {
      const store = useSnackbarStore()
      const visibleId = store.showSnackbar({ message: 'visible', timeout: 0 })
      const hiddenId = store.showSnackbar({ message: 'hidden', timeout: 0 })
      store.hideSnackbar(hiddenId)

      const visible = store.visibleSnackbars
      expect(visible).toHaveLength(1)
      expect(visible[0].id).toBe(visibleId)
    })

    it('is empty when the store is empty', () => {
      const store = useSnackbarStore()
      expect(store.visibleSnackbars).toEqual([])
    })
  })
})

describe('store/globalLoading.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('initial state is not loading with zero progress', () => {
    const store = useGlobalLoadingStore()
    expect(store.isLoading).toBe(false)
    expect(store.loadingProgress).toBe(0)
  })

  describe('showLoading', () => {
    it('sets isLoading true and resets progress to 0', () => {
      const store = useGlobalLoadingStore()
      store.setProgress(55)
      store.showLoading()
      expect(store.isLoading).toBe(true)
      expect(store.loadingProgress).toBe(0)
    })
  })

  describe('hideLoading', () => {
    it('sets isLoading false, jumps progress to 100, then resets to 0 after 300ms', () => {
      const store = useGlobalLoadingStore()
      store.showLoading()
      store.hideLoading()

      expect(store.isLoading).toBe(false)
      expect(store.loadingProgress).toBe(100)

      // Reset is deferred 300ms for the bar's fill-out animation.
      vi.advanceTimersByTime(299)
      expect(store.loadingProgress).toBe(100)
      vi.advanceTimersByTime(1)
      expect(store.loadingProgress).toBe(0)
    })
  })

  describe('setProgress clamping', () => {
    it('passes through an in-range value', () => {
      const store = useGlobalLoadingStore()
      store.setProgress(42)
      expect(store.loadingProgress).toBe(42)
    })

    it('clamps a value above 100 down to 100', () => {
      const store = useGlobalLoadingStore()
      store.setProgress(150)
      expect(store.loadingProgress).toBe(100)
    })

    it('clamps a negative value up to 0', () => {
      const store = useGlobalLoadingStore()
      store.setProgress(-20)
      expect(store.loadingProgress).toBe(0)
    })

    it('keeps the exact boundary values', () => {
      const store = useGlobalLoadingStore()
      store.setProgress(0)
      expect(store.loadingProgress).toBe(0)
      store.setProgress(100)
      expect(store.loadingProgress).toBe(100)
    })
  })

  describe('getLoadingState getter', () => {
    it('returns a snapshot of isLoading and progress', () => {
      const store = useGlobalLoadingStore()
      store.showLoading()
      store.setProgress(30)
      expect(store.getLoadingState()).toEqual({ isLoading: true, progress: 30 })
    })
  })
})

describe('composables/useGlobalLoading.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('delegates showLoading / hideLoading / setProgress to the store', () => {
    const { showLoading, hideLoading, setProgress } = useGlobalLoading()
    const store = useGlobalLoadingStore()

    showLoading()
    expect(store.isLoading).toBe(true)

    setProgress(40)
    expect(store.loadingProgress).toBe(40)

    hideLoading()
    expect(store.isLoading).toBe(false)
    expect(store.loadingProgress).toBe(100)
  })

  it('setProgress through the composable still clamps via the store', () => {
    const { setProgress } = useGlobalLoading()
    const store = useGlobalLoadingStore()
    setProgress(999)
    expect(store.loadingProgress).toBe(100)
  })

  describe('withLoading', () => {
    it('shows loading, awaits the fn, returns its result, and hides in finally', async () => {
      const { withLoading } = useGlobalLoading()
      const store = useGlobalLoadingStore()

      const promise = withLoading(async () => {
        // While the wrapped fn runs, loading is on.
        expect(store.isLoading).toBe(true)
        return 'payload'
      })

      const result = await promise
      expect(result).toBe('payload')
      // finally → hideLoading ran.
      expect(store.isLoading).toBe(false)
      expect(store.loadingProgress).toBe(100)
    })

    it('calls hideLoading in finally EVEN when the wrapped promise rejects', async () => {
      const { withLoading } = useGlobalLoading()
      const store = useGlobalLoadingStore()

      const boom = new Error('kaboom')
      await expect(
        withLoading(async () => {
          throw boom
        })
      ).rejects.toBe(boom)

      // The error propagates but the loading bar is still torn down.
      expect(store.isLoading).toBe(false)
      expect(store.loadingProgress).toBe(100)
    })

    it('simulates stepped progress when showProgress + progressSteps are set', async () => {
      const { withLoading } = useGlobalLoading()
      const store = useGlobalLoadingStore()

      // Spy on the store's setProgress so we capture the exact stepped values
      // regardless of the final hideLoading() (which also writes 100). Reading the
      // live progress after the last step is racy: the loop ends, asyncFn resolves,
      // and the finally hideLoading() runs synchronously, overwriting 90 with 100.
      const setProgressSpy = vi.spyOn(store, 'setProgress')

      const promise = withLoading(async () => 'ok', {
        showProgress: true,
        progressSteps: 3
      })

      // Each step waits 100ms then setProgress(stepSize * i); stepSize = 90/3 = 30.
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(100)

      const result = await promise
      expect(result).toBe('ok')

      // The three simulated steps were 30, 60, 90 (in order).
      const steppedCalls = setProgressSpy.mock.calls.map((c) => c[0])
      expect(steppedCalls).toEqual([30, 60, 90])

      // After completion, hideLoading drove the live progress to 100.
      expect(store.loadingProgress).toBe(100)
      setProgressSpy.mockRestore()
    })

    it('does NOT simulate steps when showProgress is omitted', async () => {
      const { withLoading } = useGlobalLoading()
      const store = useGlobalLoadingStore()

      let observedDuringRun = -1
      const promise = withLoading(async () => {
        observedDuringRun = store.loadingProgress
        return 'ok'
      })

      await promise
      // showLoading reset progress to 0 and no steps ran before the fn.
      expect(observedDuringRun).toBe(0)
    })
  })
})
