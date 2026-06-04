---
name: state-data-api
description: 'Use when calling APIs with caching (useApi/cachedGet/ApiCache), invalidating cache, reading central config via getConfig dot-notation, or wiring config/general.ts, Pinia stores, useGlobalLoading/useSnackbar.'
---

## When to use

- Fetching data through the cached API layer (`useApi()`, `cachedGet`, `apiCache`) or invalidating cache after a mutation.
- Reading central config by path (`getConfig('general.contact.email', { fallback })`) or adding a new config file.
- Touching Pinia stores — prefer composable wrappers `useGlobalLoading()` / `useSnackbar()`.

## Steps

1. **Read data:** `const api = useApi(); const x = await api.get('/api/x', { cache: { enabled, ttl } })`. GET caches by default (TTL 5min); POST/PUT/DELETE do not. Returns `null` on error (logged, not thrown) when going through `useApi`.
2. **Reactive state:** use `api.loading` / `api.error` / `api.isLoading` / `api.hasError` (all readonly refs/computeds).
3. **After a mutation:** invalidate — `await api.clearCache('users')` (pattern) or `apiCache.clear()` (all), or `invalidateCache(pattern)` directly.
4. **Read config:** `getConfig('general.<dot.path>', { fallback })`. Never deep-import config objects in app code; go through `getConfig`.
5. **Add a config file:** create `config/<name>.ts`, then register it in `configRegistry` in `utils/configHelpers.ts` (key = first path segment). Without this, `getConfig('<name>.*')` returns fallback.

## Source of truth

- `docs/api-caching.md` — ApiCache API, TTLs, cache-key format, invalidation, SSR behavior, best practices (read on demand).

## Key files

- `composables/useApi.ts` — `useApi()`; returns `{ loading, error, isLoading, hasError, request, get, post, put, delete, clearCache, getCacheStats }`.
- `utils/api.ts` — `cachedApiRequest`, `cachedGet`, `cachedPost`, `cachedPut`, `apiDelete`, `invalidateCache(pattern)`.
- `utils/cache.ts` — `ApiCache` class + `apiCache` singleton (`generateCacheKey`, `get`, `set`, `remove`, `clear`, `cleanup`, `getStats`).
- `utils/configHelpers.ts` — `getConfig(path, opts)` + `configRegistry`; also release-date helpers (`isUpcomingRelease`, `formatReleaseDate`).
- `config/general.ts` — `generalConfig` / `GeneralConfig` (band, contact, social, feature flags, entityProfiles).
- `config/navigation.ts` — `leftNavigation`, `rightNavigation`, `footerNavigation` (imported directly, NOT via getConfig).
- `constants/app.ts` — `CACHE_NAME` (`wbm-api-cache`), backs `apiCache`.

## Gotchas

- Caching is **client-only**: SSR/static-gen always fetches fresh (`window`-guarded); never rely on cache during prerender.
- Only GET is cached; cache key = `METHOD|URL|params|body` joined by `|`. Custom key via `cacheOptions.key`.
- `useApi.get` swallows errors → returns `null`; raw `cachedGet` rethrows unless `errorOptions.rethrow:false`.
- Cache API backend stores keys percent-encoded under `cache://<name>/<key>`; `invalidateCache` decodes before matching so patterns with `|`/`/` work — match the **key**, not the URL.
- `getConfig` only reaches files in `configRegistry`; `config/navigation.ts` is NOT registered (use direct imports for nav).
- Auto-cleanup runs every 10min (Cache API only, browser only); localStorage fallback isn't auto-cleaned.

## Related

- Composable wrappers over Pinia: `store/globalLoading.ts` (`useGlobalLoading`), `store/snackbar.ts` (`useSnackbar`).
- Sibling skills: release-states (reads `general.ts` flags), seo/entity work (consumes `entityProfiles`).
- Review agents: `.claude/agents/` analytics-reviewer / i18n-checker.
