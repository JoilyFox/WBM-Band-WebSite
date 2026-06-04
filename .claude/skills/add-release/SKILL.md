---
name: add-release
description: 'Use when adding/editing/deploying a music release in data/musicLibrary.ts — preview vs pre-save vs released state, config/general.ts flags, cover theming (npm run extract-colors), or song lyrics.'
---

## When to use

Adding or editing a music release, flipping it between Preview / Pre-save / Released, theming a release page from its cover, or attaching song lyrics. The release page lives at `/listen/{slug}` (released) or `/pre-save/{slug}` (pre-save).

## Steps

1. Add/edit the release object in `data/musicLibrary.ts` (`MusicRelease`). Set `id`, `slug`, `title`, `type`, `releaseDate` (ISO 8601, e.g. `2025-12-01T18:00:00`), `imageUrl`, and the link maps. State is **derived** from `releaseDate` vs now + flags — there is no `state` field.
   - Released: populate `musicPlatformLinks` (keys must be in `utils/musicPlatforms.ts`). Empty grid at drop? set `releaseSmartLink` for a single "Listen on all platforms" CTA (no redirect).
   - Pre-save: set `preSaveMusicPlatformLinks` (or `useDistributorPreSave: true` + `distributorPreSaveUrl` to redirect the `/pre-save` page). Add `blurredImageUrl` for the card.
   - Preview only: just image fields; no pre-save links needed.
2. Set flags in `config/general.ts`: `enablePreSave` (true → pre-save card; overrides preview), `enableNextReleasePreview`.
3. Cover art: drop `public/images/.../albums-images/<slug>/cover.jpg`, then `npm run compress-images` → `npm run generate-blurred` → **`npm run extract-colors`** (rewrites `data/coverColors.generated.ts`). Muddy/monochrome cover? add a `theme:` (`ReleaseTheme`) override in the release.
4. Lyrics (optional): add `lyrics: LyricsSection[]` (original language, `part`/`num`/`lines`). The in-page Lyrics button **and** a dedicated, indexable `/lyrics/<slug>` page (prerender + sitemap, auto-derived from the lyrics array) appear automatically. New part label → extend `LyricsPartKey` + add `music.parts.<key>` to **both** locale files.
5. Build with `npm run generate` (not `build`) — prerender slugs auto-derive from `musicLibrary`, no `nuxt.config.ts` edit needed. Deploy: `npm run deploy:production` (FTP) or `npm run deploy:github` (staging).

## Source of truth

- `docs/release-states-system.md` — state derivation, `releaseSmartLink`, dedup. Read on demand.
- `docs/presave-functionality.md` — pre-save modes, distributor redirect, link maps. Read on demand.
- `docs/release-page-theming.md` — Ambient Bloom, palette extraction, `theme` override. Read on demand.
- `docs/lyrics-feature.md` — lyrics data shape, cross-slide, perf/i18n gotchas. Read on demand.

## Key files

- `data/musicLibrary.ts` — `MusicRelease`, `ReleaseTheme`, `LyricsPartKey`, `LyricsSection` types + data; helpers `getReleaseBySlug`, `getAllReleases`, `getNearestUpcomingPreSaveRelease`.
- `config/general.ts` — `enablePreSave`, `enableNextReleasePreview`, `maintenanceMode` flags.
- `composables/useReleaseTheme.ts` — `useReleaseTheme(release)` → `{ theme, themeVars, atmosphereClass, variant }`; override→generated→hash-fallback.
- `data/coverColors.generated.ts` — auto-gen `coverColors` map + `CoverPalette` type. Do not hand-edit.
- `utils/musicPlatforms.ts` — `musicPlatforms`, `getMusicPlatform(key)`, `getDefaultPlatform()` (valid link-map keys).
- `utils/countdown.ts` — `getLocalizedCountdown({ releaseDate, locale, t })` for card countdown.
- `components/music/MusicDetailContent.vue` — atmosphere layers + lyrics swap; `components/music/HeroPill.vue`, `components/music/Lyrics.vue`.

## Gotchas

- Run `npm run extract-colors` after ANY cover change or colours stay stale (baked at build).
- `extract-colors` reads `optimized/albums-images/<slug>/cover.jpg` — run `compress-images` first or it has nothing to scan.
- Lyric LINES never localize; only section labels do. Every `music.parts.*` key must exist in BOTH `uk.json` + `en.json`.
- No desktop lyrics trigger on `/listen` yet — pill is `md:hidden` (mobile/tablet only); desktop reaches lyrics via the `/lyrics/<slug>` URL.
- Use `npm run generate`, never `build` — non-localized `/pre-save` `/listen` `/lyrics` aliases come from `create-nonlocalized-aliases.js`.
- Lyrics ARE embedded in JSON-LD on the `/lyrics/<slug>` page only (the band owns them); the plain `/listen/<slug>` page still omits them. See `docs/lyrics-feature.md`.

## Related

- Agent `release-coordinator` — validates the Preview/Pre-save/Released combo before push (read-only).
- Agent `i18n-checker` — verify locale-key parity after touching `music.parts.*`.
- Skills: `work-with-images` (cover pipeline before extract-colors), `seo-entity` (release JSON-LD).
- Commands: `npm run extract-colors`, `npm run compress-images`, `npm run generate-blurred`, `npm run generate`.
