# Song Lyrics

Per-release song lyrics shown on the release page. The release page's platform-links
section and the lyrics share one spot and **cross-slide** horizontally: tapping the
Lyrics pill slides the links out to the left while the lyrics slide in from the right
(reversed on the way back).

The lyrics view is **deep-linkable and independently indexable**. Each release that
ships lyrics also gets a dedicated, prerendered page at **`/lyrics/<slug>`** (bilingual
`/ua/lyrics/<slug>` + `/en/lyrics/<slug>`, plus the clean non-localized alias) whose
static HTML contains the actual lyric text, its own `<title>` ("Mania Lyrics" /
"Манія — Текст пісні"), self-canonical, and `MusicComposition.lyrics` JSON-LD — so a
search like "mania wbm lyrics" can surface it. Opening that URL boots the release page
with lyrics already shown. Tapping the in-page Lyrics pill keeps the cross-slide **and**
rewrites the URL to `/lyrics/<slug>` via the History API (no remount); browser
back/forward and the in-pane Back return to `/listen/<slug>`. The lyrics route mirrors
the existing `/listen` plumbing (prerender list, non-localized alias, `.htaccess`
rewrite, sitemap) one-for-one.

## Overview

- Lyrics live in **`data/musicLibrary.ts`** on each release as a structured
  `lyrics?: LyricsSection[]` array, in the song's **original language** (lines are
  never translated).
- Only the **section labels** (Verse, Chorus, …) localize, via the
  `music.parts.*` i18n namespace. A label with no translation renders no heading.
- The Lyrics button is **data-driven**: it only appears when the release ships a
  non-empty `lyrics` array. No lyrics → no button (the hero quick-actions row
  collapses cleanly).
- **Scope:** the trigger lives in the mobile/tablet hero quick-actions row
  (`md:hidden`). There is **no desktop trigger yet** (planned). The swap container
  itself lives in the platform-links section and works at any width.

## Components

- [`data/musicLibrary.ts`](../data/musicLibrary.ts) — `LyricsPartKey`, `LyricsSection`
  types and the `lyrics?` field on `MusicRelease`; the actual lyric data per release.
- [`components/music/Lyrics.vue`](../components/music/Lyrics.vue) — presentational
  lyrics pane (auto-imported as `<MusicLyrics>`): header (back control + title) and
  the labeled sections. Emits `back`.
- [`components/music/MusicDetailContent.vue`](../components/music/MusicDetailContent.vue)
  — owns the `showLyrics` state (seeded from the `initialShowLyrics` prop), the
  directional cross-slide `<Transition>`, the Lyrics button wiring, the floating
  back-arrow interception, and — when `lyricsUrlSync` is set — the History-API URL
  sync + `popstate` handling + the `view-change` emit.
- [`pages/lyrics/[slug].vue`](../pages/lyrics/[slug].vue) — the dedicated lyrics page:
  same `MusicDetailContent` booted with `initialShowLyrics` + `lyricsUrlSync`, guarded
  by [`middleware/lyrics-access.ts`](../middleware/lyrics-access.ts) (404s releases with
  no lyrics), lyrics-variant JSON-LD via `useReleaseStructuredData({ variant: 'lyrics' })`.
- [`composables/useReleaseHead.ts`](../composables/useReleaseHead.ts) — the shared,
  view-aware `<head>` used by both `/listen/[slug]` and `/lyrics/[slug]`: swaps
  title / description / canonical / og between the "links" and "lyrics" views.
- `music.parts.*`, `music.detail.lyrics_title`, `music.detail.lyrics_page_title`,
  `music.detail.lyrics_meta_description`, `music.buttons.back`, `music.a11y.show_lyrics`,
  `music.a11y.back_to_platforms` in
  [`locales/uk.json`](../locales/uk.json) + [`locales/en.json`](../locales/en.json).
- Build wiring (mirrors `/listen`): `LYRICS_SLUGS` + the lyrics loop in
  [`nuxt.config.ts`](../nuxt.config.ts) prerender list, the `ua/lyrics` alias in
  [`scripts/create-nonlocalized-aliases.js`](../scripts/create-nonlocalized-aliases.js),
  the `/lyrics` rewrites in [`public/.htaccess`](../public/.htaccess), and the lyrics
  entries in [`scripts/generate-sitemap.js`](../scripts/generate-sitemap.js).

## Adding lyrics to a release

1. Open `data/musicLibrary.ts`, find the release, and add a `lyrics` array:

   ```ts
   lyrics: [
     { part: 'verse', num: 1, lines: ['line one', 'line two'] },
     { part: 'chorus', lines: ['…', '…'] },
     { part: 'bridge', lines: ['…'] }
   ]
   ```

   - `part` (optional) is one of `LyricsPartKey`: `intro`, `verse`, `pre_chorus`,
     `chorus`, `post_chorus`, `hook`, `bridge`, `refrain`, `interlude`, `outro`.
     Omit it (or use a key with no translation) to render lines with **no heading**.
   - `num` (optional) is appended to the label, e.g. `num: 2` → "Verse 2" / "Куплет 2".
     Repeated parts that aren't numbered on the original (e.g. a recurring chorus)
     just omit `num`.
   - `lines` is an array of strings, one per rendered line, in the **original
     language**. An empty string renders a blank line within a section.

2. That's it — the Lyrics button, the swipe, **and** the dedicated, indexable
   `/lyrics/<slug>` page all appear automatically. The prerender list
   (`LYRICS_SLUGS` in `nuxt.config.ts`) and the sitemap both derive the lyrics
   routes from "release has a non-empty `lyrics` array", so no i18n, route, or
   prerender changes are needed for a new song. Run `npm run generate` and the
   new `/lyrics/<slug>` (+ `/ua`, `/en`, clean alias) is built and sitemapped.

## Adding a new song-part label

To support a part not already in `LyricsPartKey`:

1. Add the key to the `LyricsPartKey` union in `data/musicLibrary.ts`.
2. Add `music.parts.<key>` to **both** `locales/uk.json` and `locales/en.json`
   (keys must exist in both — see [i18n](#) parity rule in `CLAUDE.md`).

## How it works

- The platform-links pane and the lyrics pane are two children of a CSS-grid
  cell (`grid-area: 1 / 1`), so they overlap and cross-slide. `showLyrics` flips
  the keyed `<Transition>` child; `swapDirection` picks the slide direction.
- **Two animation modes, chosen by `shouldReduceAnimations`** (`prefersReducedMotion
|| level === 'low'`):
  - Default → the directional **swipe** (`lyrics-swap-forward` / `-back`), a
    fully-opaque `translateX` cross-slide at a fixed `0.42s`. The two panes tile
    (one left-half, one right-half) and move together — lyrics in/out from the
    right, links in/out from the left.
  - Low-perf / reduced-motion → a clean opacity **fade** (`lyrics-fade`) with
    `<Transition mode="out-in">` so the old pane fully leaves before the new
    enters (**no overlap**). No horizontal travel.
- The transition `transition:` declarations use `!important` so the blunt global
  mobile perf overrides in `base.scss` can't clobber them: `.mobile-standard *
{ transition-duration: 0.2s !important }` (keeps the swipe at 0.42s) and
  `.mobile-conservative * { transition: none !important }` (keeps the fade alive).
- `is-swapping` toggles `overflow: hidden` on the swap wrapper **only while a
  transition runs**, so resting platform-button shadows aren't clipped.
- The floating back-arrow (top-left) first returns to the links view when lyrics
  are open, instead of leaving the page.
- There is **no auto-scroll** on open — the swap happens in place.
- **URL sync (deep-linking).** When the host page sets `lyricsUrlSync` (the clean
  `/listen/[slug]` and `/lyrics/[slug]` pages do; the modal, pre-save and
  source-attribution variants do **not**), `openLyrics` swaps the `listen` path
  segment for `lyrics` and `pushState`s the result (preserving whatever
  locale-prefix style the visitor is on); `closeLyrics` `replaceState`s back. We
  use the **History API directly, not router navigation**, so the component never
  remounts and the cross-slide is preserved — vue-router only reacts to `popstate`,
  which our own handler also listens to so browser back/forward re-syncs
  `showLyrics`. Each view flip emits `view-change`, which flips the page's `view`
  ref and lets `useReleaseHead` swap `<title>` + canonical to match the address bar.
- The dedicated `/lyrics/<slug>` page boots `MusicDetailContent` with
  `initialShowLyrics`, so the lyrics pane is **SSR-rendered into the static HTML**
  (the whole point — crawlers see the lyric text without running JS).

## Gotchas

- **Labels localize; lines do not.** Lyrics are stored once in the original
  language. If you ever need a translated/singable version, that's a separate data
  shape (per-locale lyrics) — not how this is modelled today.
- **Lyrics is per-release, single-song.** The catalog has no track model; if a real
  multi-track album/EP is ever added, lyrics would need to move onto a `tracks[]`
  structure first.
- **No desktop trigger on `/listen` yet** — only the `md:hidden` mobile/tablet hero
  pill opens the lyrics in-place. Desktop users still reach the full lyrics via the
  dedicated `/lyrics/<slug>` URL (search/share/direct entry renders them open, and
  the in-pane Back returns to `/listen`); a desktop "Lyrics" affordance on the
  `/listen` page is still planned.
- **Swipe-vs-fade depends on correct perf classification.** Chrome's User-Agent
  Reduction freezes the device model to `"K"`, which used to drop every modern
  Android phone into the `low`/`conservative` tier (→ fade, and the global
  `.mobile-conservative` rule nuked transforms). `usePerformanceOptimization`
  now recovers the real model via **UA Client Hints**
  (`navigator.userAgentData.getHighEntropyValues(['model'])`) so recognized
  flagships classify as `medium`+ and get the swipe. iOS Safari has no Client
  Hints and its UA omits the model, so iOS flagships still fall back to the fade
  — acceptable, but note it if revisiting.
- Lyrics **are** embedded in JSON-LD **only on the `/lyrics/<slug>` page** (via
  `useReleaseStructuredData({ variant: 'lyrics' })` → `MusicRecording.recordingOf`
  → `MusicComposition.lyrics`). The generic rights caveat around full-lyrics
  structured data does **not** apply here because the band owns these lyrics. The
  plain `/listen/<slug>` page deliberately still omits them (its JSON-LD stays the
  lean release schema).
- Both locale files must define every `music.parts.*` key (a key present in one
  locale only silently renders the fallback language).
