---
name: add-page-route
description: 'Use when adding a new page/route or top-level nav link to the WBM Nuxt site: ua/en parity, nitro.prerender STATIC_ROUTES, useLocalePath, locales/uk.json + en.json keys, non-localized /listen + /pre-save share aliases.'
---

## When to use

Adding a new top-level page/route (e.g. `/about`, `/tour`) or a new top-level nav link to the WBM Nuxt 3 static site. Covers ua/en parity, the prerender allow-list, `useLocalePath()`, and non-localized share aliases.

## Steps

1. Create the page at `pages/<path>.vue` (file-based routing; the i18n `prefix` strategy auto-localizes it to `/ua/<path>` and `/en/<path>`).
2. Use `useLocalePath()` for EVERY internal link/`navigateTo`/`router.push` — never hardcode `/en/...` or `/ua/...`.
3. Add BOTH locale routes to `STATIC_ROUTES` in `nuxt.config.ts` (the `nitro.prerender.routes` source): `'/ua/<path>'` AND `'/en/<path>'`. Omitting either drops it from static output.
4. Add every new i18n key to BOTH `locales/uk.json` (default `ua`) AND `locales/en.json`. Missing keys do NOT error (warnings only in dev) — diff the keysets yourself.
5. If it's a top-level nav link, wire it via `config/navigation.ts` (not hardcoded paths).
6. Verify: `npm run generate`, then confirm `.output/public/ua/<path>` and `.output/public/en/<path>` exist.

## Source of truth

- `CLAUDE.md` → "i18n (prefix strategy, default `ua`)" — locale rules, `useLocalePath()`, root-redirect middleware. Read on demand.
- `CLAUDE.md` → "Static generation & prerender list" — the "add both `/en` and `/ua`" rule, `failOnError: false`. Read on demand.

## Key files

- `nuxt.config.ts` — `STATIC_ROUTES` (explicit prerender list) + `masterPageRoutes()` (release-derived); i18n module config (`strategy: 'prefix'`, `defaultLocale: 'ua'`, `langDir: 'locales'`).
- `i18n/i18n.config.ts` — `defineI18nConfig`; `fallbackLocale: 'ua'`, dev-only missing/fallback warns.
- `locales/uk.json` / `locales/en.json` — translation keysets (default `uk.json` = `ua` locale).
- `config/navigation.ts` — top-level nav link source.
- `composables/useMusicNavigation.ts` — `useMusicNavigation()`; shows the `localePath({ path, query })` pattern for share routes.
- `composables/useMasterPage.ts` — `useMasterPage({ slug, pageType, sourcePrefix })`; listen/pre-save page setup (release lookup, SEO meta, 404 on bad slug).
- `scripts/create-nonlocalized-aliases.js` — copies built `ua/pre-save` + `ua/listen` to root for non-prefixed share URLs.

## Gotchas

- Default locale file is `uk.json`, NOT `ua.json` (locale code `ua`, language `uk-UA`).
- `STATIC_ROUTES` is the ONLY way a top-level page reaches static output — file existence alone is not enough.
- Music release pages (`/listen/*`, `/pre-save/*`) are auto-prerendered via `masterPageRoutes()`; don't add them to `STATIC_ROUTES` manually.
- Non-localized `/listen/*` + `/pre-save/*` aliases exist only after `npm run generate` (which runs the alias script) — `build` won't create them. `.htaccess` handles redirects server-side; `redirect-share-urls.global.ts` stays disabled.
- Add new DEPLOY_TARGET-prefixed head links/meta with the same conditional `/WBM-Band-WebSite` prefix already in `nuxt.config.ts`.

## Related

- Agent `i18n-checker` — validates ua/en parity, `useLocalePath()` usage, and prerender-list coverage; run it after this skill.
- Commands: `npm run generate` (SSG + aliases), `npm run dev`.
