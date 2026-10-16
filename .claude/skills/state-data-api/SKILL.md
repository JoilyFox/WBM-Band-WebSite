---
name: state-data-api
description: 'Use when reading central config via getConfig dot-notation, wiring config/general.ts, or touching Pinia stores (useGlobalLoading/useSnackbar). There is no client API/cache layer.'
---

## When to use

- Reading central config by path (`getConfig('general.contact.email', { fallback })`) or adding a new config file.
- Touching Pinia stores — prefer composable wrappers `useGlobalLoading()` / `useSnackbar()`.

The site is static and fetches no runtime data. The former `useApi` / `ApiCache` layer (`utils/api.ts`, `utils/cache.ts`, mock `server/api`) was deleted as dead code; do not recreate it for a one-off fetch. If real runtime data is ever needed, add a fresh, minimal `$fetch`/`useFetch` wrapper rather than reviving the old one.

## Steps

1. **Read config:** `getConfig('general.<dot.path>', { fallback })`. Never deep-import config objects in app code; go through `getConfig`.
2. **Add a config file:** create `config/<name>.ts`, then register it in `configRegistry` in `utils/configHelpers.ts` (key = first path segment). Without this, `getConfig('<name>.*')` returns fallback.
3. **Global state:** use `useGlobalLoading()` (top progress bar) and `useSnackbar()` (notifications) instead of importing the stores directly.

## Key files

- `utils/configHelpers.ts` — `getConfig(path, opts)` + `configRegistry`; also release-date helpers (`isUpcomingRelease`, `formatReleaseDate`).
- `config/general.ts` — `generalConfig` / `GeneralConfig` (band, contact, social, feature flags, entityProfiles).
- `config/navigation.ts` — `leftNavigation`, `rightNavigation`, `footerNavigation` (imported directly, NOT via getConfig).
- `store/globalLoading.ts` / `composables/useGlobalLoading.ts`, `store/snackbar.ts` / `composables/useSnackbar.ts`.

## Gotchas

- `getConfig` only reaches files in `configRegistry`; `config/navigation.ts` is NOT registered (use direct imports for nav).

## Related

- Docs: `docs/global-loading-system.md`, `docs/snackbar-notifications.md`.
- Sibling skills: `ui-feedback` (loading bar, snackbars, error pages), `add-release` (reads `general.ts` flags), `seo-entity` (consumes `entityProfiles`).
- Review agents: `.claude/agents/` analytics-reviewer / i18n-checker.
