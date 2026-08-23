# Off-Site Entity Setup Guide — Woman Based Mechanics

The off-site half of the [AI-search/SEO strategy](./ai-search-optimization-strategy.md)
Phase 3. This is the **single highest-leverage work** for getting the band
recognized by Google's Knowledge Graph and AI assistants (ChatGPT/Perplexity/
Gemini/Claude) — bigger than any on-site change, because those systems build an
entity from **cross-source consensus**, not from your markup.

All steps are things **you** execute off-platform. Every value below is verified
(June 2026) and copy-paste-ready.

> **The one rule that governs everything: ONE canonical identity, byte-identical
> everywhere.** Lead with the full name **Woman Based Mechanics**; "WBM"/"WBM
> Band" are _aliases only_ (the acronym is ambiguous). Any drift — `Kyiv` vs
> `Kiev`, `alt-rock` vs `alternative rock`, a stray `WBM` as the primary name —
> splits you into two weak half-entities ("entity fragmentation") and keeps you
> out of the Knowledge Graph.

---

## Order of operations

| #     | Step                                                           | Where                 | Time                      | Blocking?           |
| ----- | -------------------------------------------------------------- | --------------------- | ------------------------- | ------------------- |
| **0** | Lock the canonical facts (below)                               | this doc              | 15 min                    | do first            |
| **1** | **MusicBrainz** — create artist + 2 singles → get the **MBID** | musicbrainz.org       | ~45 min                   | **before Wikidata** |
| **2** | **Wikidata** — create item, cite the MBID + IDs                | wikidata.org          | ~20 min                   | needs the MBID      |
| **3** | Claim **Spotify for Artists**                                  | artists.spotify.com   | mins to submit / 1–7 days | parallel            |
| **4** | Claim **Apple Music for Artists**                              | artists.apple.com     | mins / ≤7 business days   | parallel            |
| **5** | Request **YouTube OAC** via your distributor                   | distributor dashboard | **2–4 weeks**             | start early         |
| **6** | Reciprocal links + consistency pass                            | every platform        | ongoing                   | last                |

Steps **1 → 2** are the core entity graph and the priority — do them first; they
don't wait on anything. Steps 3–5 run in parallel (kick off the slow YouTube OAC
early). The on-site `sameAs` JSON-LD is already live — Step 6 is the _reciprocal_
side (putting `wbmband.com` in each platform's links).

---

## 0. Canonical facts sheet (your reference for every form)

Keep this open while you fill in each platform.

| Field                            | Value                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary name**                 | `Woman Based Mechanics`                                                                                                                                                   |
| **Aliases**                      | `WBM Band`, `WBM`, `Вуман Бейсд Меканікс`                                                                                                                                 |
| **Short description**            | `Ukrainian alternative rock band`                                                                                                                                         |
| **Genre**                        | `alternative rock, punk` (same wording/order everywhere)                                                                                                                  |
| **Origin / hometown**            | `Kyiv, Ukraine` (always **Kyiv**, never "Kiev")                                                                                                                           |
| **Formed (year)**                | ⬜ _you fill — needed for MusicBrainz begin date + Wikidata inception_                                                                                                    |
| **Official site**                | `https://www.wbmband.com` (always `www` + `https`)                                                                                                                        |
| **Canonical bio (1st sentence)** | `Woman Based Mechanics (WBM) is a Kyiv-based alternative rock band, characterized by melodious vocals and a combination of unconventional elements with a driving sound.` |

**Profiles & IDs:**

| Platform             | URL                                                                  | ID (bare)                             |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| Spotify (artist)     | `https://open.spotify.com/artist/0HAHqBJrbpBocXeVJ90NoO`             | `0HAHqBJrbpBocXeVJ90NoO`              |
| Apple Music (artist) | `https://music.apple.com/us/artist/woman-based-mechanics/1849021570` | `1849021570`                          |
| YouTube              | `https://youtube.com/@wbmbandofficial`                               | `UC…` ⬜ _fetch — see Wikidata P2397_ |
| YouTube Music        | `https://music.youtube.com/@wbmbandofficial`                         | (same `UC…`)                          |
| Instagram            | `https://instagram.com/wbmband`                                      | `wbmband`                             |
| TikTok               | `https://tiktok.com/@wbmband`                                        | `wbmband`                             |

**Releases (singles):**

| Title       | Latin        | Date       | Spotify                        | Apple              |
| ----------- | ------------ | ---------- | ------------------------------ | ------------------ |
| Манія       | Mania        | 2025-11-14 | album `0pjAORRhgVsS7eP4R6JbMF` | album `1849021879` |
| Чорні Птахи | Chorni Ptahy | 2026-02-06 | track `2hujOwcGE21eCQHMz61y75` | song `1868500237`  |
| Аліна       | Alina        | 2026-06-12 | track `13UFLpXjAoVNW3IKCW6Hzf` | album `6774072720` |
| Хвилі       | Khvyli       | 2026-08-21 | track `1xR3GJBaTDBEjbPfP1GZKA` | album `6798661748` |

**MusicBrainz release MBIDs** (all four singles are on the artist as of 23 Aug 2026 — never create a second artist):

| Single      | Release MBID                           | Recording MBID                         |
| ----------- | -------------------------------------- | -------------------------------------- |
| Манія       | `07c97515-d0d1-4dfc-8175-93f03ef8e3f6` | —                                      |
| Чорні Птахи | `fdf23639-79ad-4af3-9884-145313674928` | —                                      |
| Аліна       | `813c450e-e4f4-4277-b252-754bca905f3b` | `1bfe9661-186c-4a6e-99f9-4b00bac2222a` |
| Хвилі       | `400d48c2-b345-45b2-823f-5b76b7c6897a` | `886aa083-41f0-4058-84a2-8a799db6ad25` |

Both Аліна and Хвилі carry Spotify / Apple Music / Deezer at release level and per-track at recording level;
Хвилі also has the YouTube Music album playlist and the official video, Аліна the YouTube Music track.

---

## 1. MusicBrainz (do this first — it produces the MBID Wikidata needs)

MusicBrainz is the open "trust anchor" DB that feeds Google, Wikidata, BBC, and AI
pipelines. **Anyone can add an artist — no gatekeeping.** Front-load everything in
one session: edits to an entity you created **<24h ago apply instantly**; after
that they enter a 7-day voting queue. Always write an **edit note** citing your
own site/distributor — it's the biggest factor in edits being accepted.

### 1a. Create the artist

Register at `musicbrainz.org/register` (verify email). **Search first** for
`Woman Based Mechanics` and `WBM` to confirm no duplicate, then **Editing → Add
Artist** (`musicbrainz.org/artist/create`):

| Field               | Enter                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Name                | `Woman Based Mechanics`                                                |
| Sort name           | `Woman Based Mechanics` (verbatim — only a leading "the/a" would move) |
| Disambiguation      | `Ukrainian alternative rock band`                                      |
| Type                | **Group**                                                              |
| Area                | `Kyiv` (pick the city from autocomplete)                               |
| Begin area          | `Kyiv`                                                                 |
| Begin date          | the formation year (e.g. `2024`) — or leave blank if truly unknown     |
| Gender / End fields | leave blank (band, active)                                             |

**Aliases** (click _Add alias_ for each; type **Artist name**):

| Alias                  | Locale | Primary for locale                  |
| ---------------------- | ------ | ----------------------------------- |
| `WBM Band`             | en     | no                                  |
| `WBM`                  | en     | no                                  |
| `Вуман Бейсд Меканікс` | uk     | **yes** (sort name = same Cyrillic) |

Edit note: `New Kyiv-based alternative rock band. Official site https://www.wbmband.com, Spotify artist 0HAHqBJrbpBocXeVJ90NoO.` → **Enter edit.**

### 1b. Add the two released singles (REQUIRED — an empty artist can be removed)

Don't add Alina until it's out (2026-06-12). For each single, **Add Release**
(`musicbrainz.org/release/add`):

- **Title** `Mania` (then `Chorni Ptahy`); **Artist** = your artist (make sure you
  pick the existing one, not a duplicate); **Release group** = new.
- **Type** Single · **Status** Official · **Language** Ukrainian.
- **Release event**: Date `2025-11-14` (then `2026-02-06`) · Country **[Worldwide]**.
- **Label** blank (legit for self-release) · **Packaging** None · tick "no barcode".
- **Tracklist**: Format **Digital Media**, 1 track, with the exact **duration** (mm:ss).
- Edit note with the Spotify/Apple IDs from the facts sheet. **Enter edit.**

> Pick ONE title-script convention and stick to it across both singles (e.g.
> Latin title + Cyrillic AKA, matching how they're distributed).

### 1c. Add URL relationships

On the **artist** page → Edit → External links, **paste each URL** (MusicBrainz
auto-detects the type — just confirm it):

- `https://www.wbmband.com` → _official homepage_
- `https://open.spotify.com/artist/0HAHqBJrbpBocXeVJ90NoO` → _stream for free_
- `https://music.apple.com/us/artist/woman-based-mechanics/1849021570` → _streaming page_ (subscription)
- `https://youtube.com/@wbmbandofficial` → _YouTube channel_
- `https://music.youtube.com/@wbmbandofficial` → _stream for free_
- `https://instagram.com/wbmband`, `https://tiktok.com/@wbmband` → _social network_

On each **release/recording**, add its Spotify/Apple album-or-track link too.

### 1d. Grab the MBID

The artist page URL is `musicbrainz.org/artist/<UUID>`. **That UUID is the MBID** —
copy it. It's the permanent identifier Wikidata and Google key on. **You need it
for Step 2.**

---

## 2. Wikidata (the bridge into Google's Knowledge Graph)

Wikidata's notability bar is **far** lower than Wikipedia's — and the MusicBrainz
MBID clears it **without any press** (see "Notability" below). Create an account
(named accounts are far less likely to be reverted), then **Special:NewItem**
(`wikidata.org/wiki/Special:NewItem`).

### 2a. Labels / description / aliases

- **Label (en)** `Woman Based Mechanics` · **Description (en)** `Ukrainian alternative rock band`
- **Label (uk)** `Вуман Бейсд Меканікс` · **Description (uk)** `український альтернативний рок-гурт`
- **Aliases (en + uk):** `WBM`, `WBM Band`, and the other-script form of the name.

### 2b. Statements — verified property IDs

| Statement              | Property | Value                                            |
| ---------------------- | -------- | ------------------------------------------------ |
| instance of            | **P31**  | `musical group` → **Q215380** _(not Q127334927)_ |
| genre                  | **P136** | `alternative rock` → **Q11366**                  |
| genre (2nd)            | **P136** | `punk rock` → **Q3071**                          |
| country of origin      | **P495** | `Ukraine` → **Q212**                             |
| location of formation  | **P740** | `Kyiv` → **Q1899**                               |
| official website       | **P856** | `https://www.wbmband.com`                        |
| inception _(optional)_ | **P571** | formation year                                   |

**Identifiers** (bottom section — paste the **bare ID**, not the URL):

| Identifier            | Property  | Value                                    |
| --------------------- | --------- | ---------------------------------------- |
| MusicBrainz artist ID | **P434**  | the MBID from Step 1d ← _most important_ |
| Spotify artist ID     | **P1902** | `0HAHqBJrbpBocXeVJ90NoO`                 |
| Apple Music artist ID | **P2850** | `1849021570`                             |
| YouTube channel ID    | **P2397** | the `UC…` ID (see note)                  |
| Instagram username    | **P2003** | `wbmband`                                |
| TikTok username       | **P7085** | `wbmband`                                |

> **Getting the YouTube `UC…` ID** (P2397 needs it, NOT the `@handle`): open the
> channel → **··· → Share channel → Copy channel ID**, or view-source and search
> `"channelId"`. The same `UC…` resolves both youtube.com and music.youtube.com.

### 2c. Notability — why this is deletion-proof

An item is kept if it meets **any one** of three criteria. You use **#2: "a
clearly identifiable entity describable with serious, publicly available
references."** A **MusicBrainz record (cited via P434)** is exactly such a
reference — an open, curated authority DB, not a promo page. So **no journalism,
no Wikipedia, no streaming threshold is needed.** Keep the description neutral
(`Ukrainian alternative rock band`, no hype) and make sure **P434 is present** — that single
identifier moves the item from "promotional/deletable" to "referenced/notable."
This is why MusicBrainz must come first.

### 2d. Reciprocal link

Back on your **MusicBrainz** artist page → Edit → External links → paste the new
`https://www.wikidata.org/wiki/Q…` URL (auto-detected as _Wikidata_). Now both
sides reference each other — set both yourself rather than waiting for bots.

---

## 3. Spotify for Artists

Your profile already exists; claiming just unlocks the dashboard (the ID
`0HAHqBJrbpBocXeVJ90NoO` never changes). Go to **artists.spotify.com → Get
access**, paste `spotify:artist:0HAHqBJrbpBocXeVJ90NoO`. Fastest path: **request
via your distributor** (often instant). Unlocks bio/images/Artist Pick/analytics.
_(Note: as of Jan 2026 the blue "Verified Artist" badge is now "Registered
Artist" — same thing.)_

## 4. Apple Music for Artists

At **artists.apple.com → Request Artist Access**, find the page (search the band or
paste a release link — Mania album `1849021879`), pick your role, submit. Review ≤7
business days; don't abandon a request (expires in 30 days).

## 5. YouTube Official Artist Channel (OAC)

**You can't request this directly — it goes through your distributor's dashboard**
(the distributor must be a YouTube Music partner; yours delivers to YT Music, so it
should qualify). Requirements: you own `@wbmbandofficial`, ≥1 distributed release
(✓), ≥1 manually-uploaded public video, and **the channel name must exactly match
`Woman Based Mechanics`** in the distributor metadata (fix before requesting).
~2–4 weeks to merge the "- Topic" channel in and add the artist badge. Start this
early — it's the slowest step.

---

## 6. Consistency + reciprocal `sameAs`

The on-site `MusicGroup` JSON-LD already lists all profiles in `sameAs` (and
auto-picks up MusicBrainz/Wikidata once you add them to `config/general.ts`
`entityProfiles`). The **reciprocal** half is on you: put `https://www.wbmband.com`
in the website/links field of **every** platform (Spotify, Apple, YouTube, IG,
TikTok), and keep the **name / bio / genre / hometown byte-identical** everywhere
per §0. Bidirectional links are the machine-readable bridge Google uses to merge
all profiles into one entity.

**→ When MusicBrainz + Wikidata exist, send me the MBID + Q-ID** and I'll add them
to `config/general.ts` `entityProfiles` so they flow into the JSON-LD `sameAs`.

---

## 7. Ukrainian romanization (consistency > correctness)

You already use **Mania / Chorni Ptahy / Alina** as the Latin forms — keep those
**byte-identical** on Spotify, Apple, the smart-link, your site, and all metadata.
Mismatched romanizations are the #1 source of track/entity fragmentation for
Cyrillic-language artists. For any _future_ romanization, use **one** standard —
the **Ukrainian National System (2010)** (ASCII, UN/BGN-recognized; e.g. х→kh,
и→y, я→ya/ia). Don't mix standards.

---

## ✅ What's done (2026-06-03)

- **MusicBrainz artist:** [Woman Based Mechanics](https://musicbrainz.org/artist/62589d1f-dcf9-4e94-b5fc-a5e48c2e2368) — MBID `62589d1f-dcf9-4e94-b5fc-a5e48c2e2368` (type Group, disambiguation, 5 aliases, both released singles + platform links).
- **Wikidata item:** [Q140043384](https://www.wikidata.org/wiki/Q140043384) — full statements (instance-of, genre ×2, origin Kyiv/Ukraine, website, inception 2025) + all 6 external IDs, cites the MBID via P434. `uk` aliases: WBM, WBM Band, Woman Based Mechanics, **ВБМ** (Cyrillic acronym added 2026-06-05 to match MusicBrainz + the on-site `alternateName`, for "вбм" searches).
- **On-site `foundingDate`:** `2025-11-14` (the debut single "Mania" release date) in the `MusicGroup` JSON-LD; matches the Wikidata inception (year 2025).
- **Genre framing standardized (2026-06-05):** the band is **"Ukrainian alternative rock band"** / **"український альтернативний рок-гурт"** everywhere — on-site (hero subtitle, `app.meta_description`, `about.content`, global meta, `disambiguatingDescription`) **and** Wikidata `en`/`uk` descriptions **and** MusicBrainz disambiguation. Replaced the earlier "alternative rock band" wording so entity facts are consistent across sources.
- **On-site:** both URLs wired into `config/general.ts` `entityProfiles` → live in the `MusicGroup` JSON-LD `sameAs`.
- **Accounts:** MusicBrainz `wbmband`, Wikidata `WBMBand`. **Credentials live in Bohdan's password manager — never stored in this repo.**

Still optional / later: claim Spotify + Apple for Artists, request the YouTube OAC, and add the reciprocal Wikidata link on the MusicBrainz artist page (MB↔Wikidata bots usually reconcile this within a few days anyway).

## 8. Recurring: when you release a new single

The entity foundation is built once. Each new release just needs a few touch-ups —
ping Claude to drive the off-site parts in-session (log into the browser, or paste
creds ephemerally; nothing is stored). The whole cycle — on-site **and** this
off-site pass — is orchestrated by the `new-release` skill
([`.claude/skills/new-release/SKILL.md`](../.claude/skills/new-release/SKILL.md)):

1. **On-site** (repo): add the release to `data/musicLibrary.ts` (pre-save →
   released state machine — see [release-states-system.md](./release-states-system.md)).
   Set `releaseSmartLink` (the feature.fm link) so `/listen/<slug>` shows the
   "Listen on all platforms" CTA until per-platform links exist; paste the real
   Spotify/Apple/etc. links into `musicPlatformLinks` once live (the grid then
   replaces the CTA automatically).
2. **MusicBrainz**: add the new single to the **existing** artist (MBID above) via
   the same Add-Release flow (§1b) — Single · Official · Worldwide · Digital Media ·
   exact length · streaming links on the recording. **Do NOT create a new artist.**
3. **Wikidata**: usually nothing — the band item (Q140043384) is stable. (Optionally
   add a separate item for the release; low priority for a small catalogue.)
4. **Consistency**: keep name / genre / hometown byte-identical everywhere (§4), and
   reuse the same Latin romanization for any Cyrillic title (§7).

---

## Sources (verified June 2026)

- MusicBrainz: [Add an Artist](https://musicbrainz.org/doc/How_to_Add_an_Artist), [Aliases](https://musicbrainz.org/doc/Aliases), [artist-url relationships](https://musicbrainz.org/relationships/artist-url), [Wikidata linking](https://musicbrainz.org/doc/Wikidata)
- Wikidata: [Notability](https://www.wikidata.org/wiki/Wikidata:Notability), properties [P31](https://www.wikidata.org/wiki/Property:P31)/[P136](https://www.wikidata.org/wiki/Property:P136)/[P495](https://www.wikidata.org/wiki/Property:P495)/[P740](https://www.wikidata.org/wiki/Property:P740)/[P856](https://www.wikidata.org/wiki/Property:P856)/[P434](https://www.wikidata.org/wiki/Property:P434)/[P1902](https://www.wikidata.org/wiki/Property:P1902)/[P2850](https://www.wikidata.org/wiki/Property:P2850)/[P2397](https://www.wikidata.org/wiki/Property:P2397)/[P2003](https://www.wikidata.org/wiki/Property:P2003)/[P7085](https://www.wikidata.org/wiki/Property:P7085)
- [Spotify for Artists access](https://support.spotify.com/us/artists/article/getting-access-to-spotify-for-artists/) · [Apple Music for Artists claim](https://artists.apple.com/support/1101-claim-your-account) · [YouTube OAC](https://support.google.com/youtube/answer/7336634)
- [Romanization of Ukrainian](https://en.wikipedia.org/wiki/Romanization_of_Ukrainian)

_Created 2026-06-03. Companion to docs/ai-search-optimization-strategy.md (Phase 3)._
