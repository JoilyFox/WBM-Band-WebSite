# Snackbar / Toast Notifications

Stackable toast notifications. A single `<Snackbar>` is mounted globally in
`app.vue`; state lives in a Pinia store, and the `useSnackbar()` composable is
the ergonomic API you call from anywhere.

## Overview

- **Global mount** — `<Snackbar />` is rendered once in `app.vue`, so toasts are
  available on every page. Do **not** add a second instance in a layout/page.
- **Composable-first** — call `useSnackbar()` (in `composables/useSnackbar.ts`);
  prefer it over poking the store directly (project convention, see `CLAUDE.md`).
- **Stacking** — multiple toasts show at once via a `<TransitionGroup>`; the
  store's `visibleSnackbars` getter feeds the list.
- Each toast: a type icon, a message + optional subtitle, a manual close button,
  a per-type progress bar, **auto-hide on a per-type timeout**, and
  **pause-on-hover**.

## Quick start

```ts
const snackbar = useSnackbar()

snackbar.success('Saved!')
snackbar.error('Upload failed', 'Check your connection') // message + subtitle
snackbar.info('Heads up', undefined, 8000) // custom 8s timeout
const id = snackbar.warning('Careful') // returns the id
snackbar.hide(id) // dismiss one
snackbar.hideAll() // dismiss all
```

## API — `useSnackbar()`

| Method                                          | Default timeout             | Returns    |
| ----------------------------------------------- | --------------------------- | ---------- |
| `success(message, subtitle?, timeout?)`         | 4000 ms                     | toast `id` |
| `info(message, subtitle?, timeout?)`            | 4000 ms                     | toast `id` |
| `warning(message, subtitle?, timeout?)`         | 5000 ms                     | toast `id` |
| `error(message, subtitle?, timeout?)`           | 6000 ms                     | toast `id` |
| `show({ message, subtitle?, type?, timeout? })` | 4000 ms (`type` → `'info'`) | toast `id` |
| `hide(id)`                                      | —                           | —          |
| `hideAll()`                                     | —                           | —          |

Every create method returns the numeric `id`; keep it if you want to `hide(id)`
the toast programmatically.

## Behavior & defaults

- **Per-type timeouts:** success/info `4000`, warning `5000`, error `6000` ms.
- **Persistent toast:** pass `timeout: 0` via `show({ ..., timeout: 0 })` — with
  `timeout <= 0` no auto-hide timer is started, so it stays until dismissed.
- **Pause-on-hover:** hovering a toast pauses its timer (`pauseTimer`), leaving
  resumes it with the _remaining_ time (`resumeTimer`).
- **Dismiss animation:** `hide` sets `show = false`, then the store splices the
  toast out **500 ms later** to let the leave transition play. Keep that 500 ms
  in sync with the CSS transition in `Snackbar.vue` if you change either.

## Types (`store/snackbar.ts`)

```ts
interface Snackbar {
  id: number
  message: string
  subtitle?: string
  type: 'success' | 'error' | 'info' | 'warning'
  timeout: number
  show: boolean
  // internal timer bookkeeping: timerId, startTime, remainingTime, isPaused
}
```

## Components & files

- `components/common/Snackbar.vue` — the renderer: per-type icon + colour,
  message/subtitle, close button (`aria-label="Close notification"`,
  `pi pi-times`), per-type progress bar, `@mouseenter/@mouseleave` →
  pause/resume. Mounted once in `app.vue`.
- `composables/useSnackbar.ts` — `useSnackbar()`; the API in the table above.
- `store/snackbar.ts` — `useSnackbarStore` (Pinia id `snackbar`): state
  `snackbars[]` + `nextId`; getter `visibleSnackbars`; actions `showSnackbar`,
  `showSuccess/Error/Info/Warning`, `hideSnackbar`, `hideAllSnackbars`, and the
  timer trio `startTimer` / `pauseTimer` / `resumeTimer`.

## Gotchas

- **Use the composable, not the store** — `useSnackbar()` is the public surface;
  the store actions are an implementation detail.
- **One mount only** — it lives in `app.vue`. A second `<Snackbar>` would render
  a duplicate stack.
- **SSR:** toasts only appear after hydration — trigger them from event handlers
  / `onMounted`, never from server-side `setup`.
- **No `timeout: 0` via `error`/`warning`** — those convenience methods coerce a
  falsy timeout (`timeout || 6000` / `|| 5000`), so `snackbar.error(msg, sub, 0)`
  still auto-hides at 6 s. For a persistent error use
  `snackbar.show({ type: 'error', timeout: 0 })`.

## Related

- `docs/global-loading-system.md` — the other global UI-feedback singleton.
- `.claude/skills/ui-feedback/SKILL.md` — task entry point (loading + snackbar + `/404`).
