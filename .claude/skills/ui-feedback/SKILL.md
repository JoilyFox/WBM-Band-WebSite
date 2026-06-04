---
name: ui-feedback
description: 'Use when showing user feedback in the WBM Nuxt site: a top-bar loading indicator (useGlobalLoading/GlobalLoadingBar), a snackbar/toast (useSnackbar), or a contextual /404 error page (useErrorPage/ErrorPage.vue).'
---

## When to use

Pick the right feedback primitive: top-bar progress for async ops, a snackbar/toast for transient success/error/info, or a full `/404` error page for hard failures (data load, access, maintenance, unknown route).

## Steps

1. **Loading bar** — `const { withLoading, showLoading, hideLoading, setProgress, isLoading } = useGlobalLoading()`. Prefer `await withLoading(asyncFn, { showProgress: true, progressSteps: 10 })`; otherwise `showLoading()` + `hideLoading()` in a `finally`. `setProgress(0..100)` for known-step ops.
2. **Snackbar** — `const snackbar = useSnackbar()`; then `snackbar.success/error/info/warning(message, subtitle?, timeout?)`. Multiple stack; `snackbar.hide(id)` / `snackbar.hideAll()`. `show({...})` for a custom type.
3. **Error page** — `const { redirectToError, redirectTo404, redirectToDataError, redirectToAccessError, redirectToMaintenance } = useErrorPage()`. Use a preset, or `redirectToError({ title, message, buttonText, buttonLink, buttonIcon })` (PrimeIcons class). All push to `/404` via query params.
4. Combine: pair `withLoading` with a `snackbar.success/error` on completion. All three are mounted globally in `app.vue` — do not re-register.

## Source of truth

- `docs/global-loading-system.md` — loading bar API, examples, styling; read on demand. NOTE doc's `withLoading` options are stale (see Gotchas).
- `docs/error-page-system.md` — error types, presets, query-param contract, glassmorphism; read on demand.
- `docs/snackbar-notifications.md` — **empty file**; the composable/store ARE the source of truth.

## Key files

- `composables/useGlobalLoading.ts` — `useGlobalLoading()` → `{ showLoading, hideLoading, setProgress, withLoading, isLoading, loadingProgress, getLoadingState }`.
- `store/globalLoading.ts` — `useGlobalLoadingStore` (`isLoading`, `loadingProgress`, `showLoading/hideLoading/setProgress`).
- `composables/useSnackbar.ts` — `useSnackbar()` → `{ success, error, info, warning, show, hide, hideAll }`.
- `store/snackbar.ts` — `useSnackbarStore` + `Snackbar` interface; stacking, pause/resume on hover, auto-hide.
- `composables/useErrorPage.ts` — `useErrorPage()` → 5 redirect helpers, all to `/404`.
- `components/common/ErrorPage.vue` — render component (props: title/message/buttonText/buttonLink/buttonIcon).
- `components/common/GlobalLoadingBar.vue`, `components/common/Snackbar.vue`, `pages/404.vue`, `error.vue` — global mounts.

## Gotchas

- `withLoading` real options are `{ showProgress?, progressSteps? }` — the doc's `{ simulateProgress, progressDuration }` is WRONG. Without `showProgress`, the bar fills automatically.
- Always `hideLoading()` in `finally` (or use `withLoading`, which does it for you).
- Default timeouts differ by type: error 6000ms, warning 5000ms, success/info 4000ms; pass `0` for sticky.
- `redirectToError` only forwards truthy options as query params; `/404` (`pages/404.vue`) reads them — fallbacks are `ErrorPage.vue` `withDefaults`. Page is `robots: noindex`.
- `buttonLink` is a raw path string pushed by the page; for localized targets resolve with `useLocalePath()` before passing, per repo i18n rule.

## Related

- Pinia/composable-wrapper convention from CLAUDE.md (prefer `useGlobalLoading()`/`useSnackbar()` over direct store imports).
- i18n-checker agent — verify any `buttonLink`/copy respects locale routing.
- Mounted globally in `app.vue`; no script/command needed to enable.
