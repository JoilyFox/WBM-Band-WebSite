# Song Lyrics

Per-release song lyrics shown on the release page. The release page's platform-links
section and the lyrics share one spot and **cross-slide** horizontally: tapping the
Lyrics pill slides the links out to the left while the lyrics slide in from the right
(reversed on the way back). It's an in-page view swap — no route change, no new
prerendered page.

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
  — owns the `showLyrics` state, the directional cross-slide `<Transition>`, the
  Lyrics button wiring, and the floating back-arrow interception.
- `music.parts.*`, `music.detail.lyrics_title`, `music.buttons.back`,
  `music.a11y.show_lyrics`, `music.a11y.back_to_platforms` in
  [`locales/uk.json`](../locales/uk.json) + [`locales/en.json`](../locales/en.json).

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

2. That's it — the Lyrics button and the swipe appear automatically. No i18n,
   route, or prerender changes are needed for a new song.

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

## Gotchas

- **Labels localize; lines do not.** Lyrics are stored once in the original
  language. If you ever need a translated/singable version, that's a separate data
  shape (per-locale lyrics) — not how this is modelled today.
- **Lyrics is per-release, single-song.** The catalog has no track model; if a real
  multi-track album/EP is ever added, lyrics would need to move onto a `tracks[]`
  structure first.
- **No desktop trigger yet** — only the `md:hidden` mobile/tablet hero pill opens
  the lyrics. Add a desktop affordance before relying on it on wide screens.
- **Swipe-vs-fade depends on correct perf classification.** Chrome's User-Agent
  Reduction freezes the device model to `"K"`, which used to drop every modern
  Android phone into the `low`/`conservative` tier (→ fade, and the global
  `.mobile-conservative` rule nuked transforms). `usePerformanceOptimization`
  now recovers the real model via **UA Client Hints**
  (`navigator.userAgentData.getHighEntropyValues(['model'])`) so recognized
  flagships classify as `medium`+ and get the swipe. iOS Safari has no Client
  Hints and its UA omits the model, so iOS flagships still fall back to the fade
  — acceptable, but note it if revisiting.
- Lyrics are **not** injected into JSON-LD. `MusicRecording` supports a
  `MusicComposition.lyrics` slot, but full-lyrics structured data has rights
  implications — leave it off unless deliberately cleared.
- Both locale files must define every `music.parts.*` key (a key present in one
  locale only silently renders the fallback language).
