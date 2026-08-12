---
name: new-release
description: 'Use for the END-TO-END release cycle of a new WBM song, from a one-sentence ask ("add our new single to the site", "додай нову пісню/реліз"): intake questions, cover pipeline, musicLibrary + i18n entry, pre-save wiring, tests/build/browser check, deploy, the off-site MusicBrainz / Wikidata / DSP catalogue pass, and the release-day flip to released.'
---

## When to use

Bohdan says some variant of "we have a new song, add it to the site". This skill is the **orchestrator** for the whole cycle — it owns the ORDER, the intake questions, and the off-site half. `add-release` stays the reference for the `MusicRelease` data shape; `work-with-images`, `seo-entity`, `ship-deploy` own their mechanics. Read those on demand, don't duplicate them here.

A release normally arrives in **two passes**: pre-save now (§1–§5), released later (§6). Never wait for release-day data to ship the pre-save.

## 0. Intake — ask for everything missing in ONE batch

| Field                        | Needed for                                  | Blocking?                           |
| ---------------------------- | ------------------------------------------- | ----------------------------------- |
| Ukrainian title              | `title`, `releases.<slug>.title` (uk)       | yes                                 |
| Latin form → **slug**        | URLs, EN title, off-site metadata           | yes (derive, then confirm)          |
| **Release date + Kyiv time** | state machine, countdown, `datePublished`   | **yes — never guess**               |
| Pre-save / smart link        | `distributorPreSaveUrl`, `releaseSmartLink` | yes for a pre-save                  |
| Cover source file path       | whole image pipeline                        | yes                                 |
| Short description (uk)       | `releases.<slug>.description`               | yes (you translate → en, say so)    |
| Genre(s), English            | `genre[]` → schema.org MusicRecording       | no (default `['Alternative rock']`) |
| Lyrics                       | `/lyrics/<slug>` page + JSON-LD             | no — add later, it's additive       |
| Story prose (uk + en)        | MusicRecording `description` for AI/search  | no — **never fabricate it**         |
| Track duration `mm:ss`       | MusicBrainz release (§5)                    | no — off-site only                  |
| ISRC / UPC                   | MusicBrainz (optional but good)             | no                                  |

**Slug / Latin form.** Use the **Ukrainian National System (2010)** (`х→kh`, `и→y`, `я→ia`), but the distributor's smart-link slug **wins** if it already exists — the whole point is one byte-identical Latin form across site, DSPs and MusicBrainz (see `entity-setup-guide.md` §7). `Хвилі` → `khvyli`. The EN i18n `title` is that same romanization, **not** a translation (`Khvyli`, not "Waves") — matches `Chorni Ptahy`.

**Date → `releaseDate`.** Store **UTC** with a trailing comment giving the Kyiv local time. Kyiv is **UTC+3 (EEST)** from the last Sunday of March to the last Sunday of October, **UTC+2 (EET)** otherwise. Midnight Kyiv on 2026-08-21 → `'2026-08-20T21:00:00Z'`.

## 1. Cover art

1. Copy the source into `public/images/albums-images/<slug>/cover.png` (or `.jpg` — both are picked up; the base name must be `cover`). Square source, ≥800px.
2. `npm run compress-images` → writes `public/images/optimized/albums-images/<slug>/cover{,-200,-400,-640}.{avif,webp,jpg}` + `thumbs/`.
3. `npm run extract-colors` → adds the palette to `data/coverColors.generated.ts`. If it prints **`(muted — consider a theme override)`**, hand-tune a `theme:` on the release; otherwise leave it to the generated palette.
4. **Blur is only for the _preview_ card.** The upcoming-release card uses the sharp `imageUrl` whenever it renders in pre-save mode, and the blurred variant **only** in preview mode (`enablePreSave: false`). So: shipping with a pre-save → skip `npm run generate-blurred` and omit `blurredImageUrl`. Add both only if the artwork must stay secret until drop.

## 2. Data + copy

1. **`data/musicLibrary.ts`** — new object at the **top** of `musicLibrary` (file is newest-first), `id` = max + 1. Pre-save shape:
   ```ts
   musicPlatformLinks: {},                  // required by the type, empty until release
   useDistributorPreSave: true,
   distributorPreSaveUrl: '<smart link>',
   skipDistributorConversionEvent: true,    // save happens off-site → the synthetic 100% conversion is meaningless
   releaseSmartLink: '<same smart link>'    // becomes the /listen CTA on release day
   ```
   Comment _why_ for anything non-obvious (missing `blurredImageUrl`, a `theme` override, a skipped event).
2. **`locales/uk.json` + `locales/en.json`** — add `releases.<slug>.{title,description}` to **both**, same key set (`test/unit/locale-parity.spec.ts` enforces parity). Slug hyphens become underscores in i18n keys (`chorni-ptahy` → `chorni_ptahy`). Add `.story` only when the band supplies the prose.
3. Flags in `config/general.ts` (`enablePreSave`, `enableNextReleasePreview`) are already right for the normal case — only touch them for a deliberate preview-without-pre-save drop.
4. Nothing to add to `nuxt.config.ts`: the prerender list, `/lyrics` pages, sitemap and `bio-links.md` all derive from `musicLibrary`.

## 3. Verify

1. `npx vitest run --project unit` — **adding a release predictably breaks `test/unit/music-library.spec.ts`**; fix the assertions, don't work around them (see Gotchas).
2. `npx vitest run --project nuxt`, then `npm run lint` (0 errors; the ~290 warnings are pre-existing).
3. `npm run generate` (never `build`). Then check the output:
   - `.output/public/pre-save/<slug>/index.html` exists, `<title>` localized in `ua` + `en`
   - sitemap has `/listen/<slug>` + `/en/listen/<slug>`
   - `.output/bio-links.md` lists the new slug's share URLs
4. **Look at it in a browser** — the upcoming card is client-rendered, so it is _not_ in the SSR HTML and grepping proves nothing. Serve `.output/public` (`npx serve -l 4177 .output/public`) and drive it with Playwright via the installed Chrome (`chromium.launch({ channel: 'chrome' })` — the bundled headless shell isn't installed, and chrome-devtools-mcp's profile is often already locked). Confirm: PRE-SAVE badge, sharp cover, localized title, correct countdown, and that `/pre-save/<slug>` really lands on the smart link.

## 4. Ship

Per `ship-deploy`: staging = push to `main` (GitHub Pages CI builds from git); production = `npm run deploy:production` (FTP, **builds from the WORKING TREE** — uncommitted changes ship, so reconcile first). Restart any `npm run dev` afterwards — a build overwrites `.nuxt` and 500s the running dev server.

Hand Bohdan the share links from `.output/bio-links.md` (per-platform `/pre-save/<prefix>/<slug>` URLs feed GA4 source attribution — see `analytics-tracking`).

## 5. Off-site catalogue pass (the real SEO lever)

Follow `docs/entity-setup-guide.md` §8. The entity foundation already exists — **never create a second artist**.

1. **MusicBrainz** — add the single to the **existing** artist (MBID `62589d1f-dcf9-4e94-b5fc-a5e48c2e2368`): Add Release → Single · Official · Language Ukrainian · Release event = the date, country **[Worldwide]** · Digital Media, 1 track, exact duration · no barcode (or the real UPC) · label blank. Edit note citing wbmband.com + the DSP IDs. Then add the Spotify/Apple URLs on the recording. Best done **within 24h of creating** the entity you're editing — later edits queue for 7 days of voting.
2. **Wikidata** — normally **nothing**; the band item `Q140043384` is stable. A per-release item is low priority for a small catalogue.
3. **Consistency sweep** — name, genre wording, `Kyiv`, and the Latin title byte-identical on the smart link, every DSP, MusicBrainz and the site. Drift fragments the entity.
4. **Reciprocal links** — `https://www.wbmband.com` present in every platform's website field.
5. If any new profile URL appears, add it to `config/general.ts` (`socialMedia` / `streamingPlatforms` / `entityProfiles`) → flows into JSON-LD `sameAs` automatically.

Steps 1–4 are browser work: offer to drive them in-session (Bohdan logs in, or pastes credentials ephemerally — **never store them in the repo**). Accounts: MusicBrainz `wbmband`, Wikidata `WBMBand`.

## 6. Release day — flip pre-save → released

The state machine flips itself once `releaseDate` passes (`presave-access.ts` redirects `/pre-save` → `/listen`), but the site must be **rebuilt and redeployed** to pick up the live platform links.

1. Paste the real per-platform URLs into `musicPlatformLinks` (keys must exist in `utils/musicPlatforms.ts`). The grid then automatically replaces the `releaseSmartLink` CTA.
2. Add `lyrics[]` and the `.story` prose if they weren't ready — this is what makes `/lyrics/<slug>` exist and gives the JSON-LD its long-form description.
3. Re-run §3 + §4. Update the release table in `docs/entity-setup-guide.md` §0 with the new Spotify/Apple IDs.
4. Off-site: add the streaming links to the MusicBrainz recording.

## Gotchas

- **Every new release breaks the same 4 assertions in `test/unit/music-library.spec.ts`** — the two newest-first ordering lists (`getLatestReleases`, `getAllReleases`), `getLatestReleases(1)`, and _"treats a release whose moment exactly equals now as NOT upcoming"_. That last one must be pinned to the **newest** release's instant, or a newer release stays ahead of `now` and the strict `>` is never exercised. Add the new id constant and update all four.
- `musicPlatformLinks` is **required** by the type — ship `{}` for a pre-save, not an omission.
- The blurred cover is a _preview-mode_ asset, not a pre-save one (§1.4).
- `/listen/<slug>` is in the sitemap from day one, but before the release date it prerenders to a meta-refresh into `/404` (listen-access gate). Harmless and self-correcting on release day — just don't request indexing for it early.
- `npm run extract-colors` must run **after** `compress-images`: it reads `optimized/albums-images/<slug>/cover.jpg`.
- Dev SSR does **not** hot-reload `locales/*.json` — verify new i18n keys in the `npm run generate` output, never in `npm run dev`.
- The non-localized `/pre-save/<slug>` and `/listen/<slug>` aliases are byte-copies of the **ua** build, so check `en/...` for English strings.

## Source of truth

- `docs/release-states-system.md` · `docs/presave-functionality.md` — state derivation, pre-save modes, `releaseSmartLink`.
- `docs/entity-setup-guide.md` — off-site walkthrough, canonical facts sheet, §8 per-release checklist.
- `docs/release-page-theming.md` · `docs/lyrics-feature.md` · `docs/image-optimization-guide.md`.

## Related

- Skills: `add-release` (data shape), `work-with-images` (pipeline), `seo-entity` (JSON-LD + entity rules), `ship-deploy` (build/deploy), `analytics-tracking` (share-link attribution), `add-page-route` (only if the release needs a brand-new route).
- Agents: `release-coordinator` (validates the Preview/Pre-save/Released combo), `i18n-checker` (locale parity).
- Commands: `npm run compress-images` · `extract-colors` · `generate` · `deploy:production`.
