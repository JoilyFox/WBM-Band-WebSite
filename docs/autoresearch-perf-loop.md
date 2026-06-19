# Autoresearch-Driven Performance Optimization — Implementation Plan

> Status: **wrapped — all wins STAGED in the working tree, nothing committed/deployed** (owner
> reviews/ships on their own terms). Owner: Bohdan. 2026-06-19.
> Concept source: KB `autoresearch-loop`, `locked-evaluator`, `autonomous-research-frameworks`
> (Adaptive-Minds-Agent). Karpathy `autoresearch`.

## Outcomes (2026-06-19)

Two real wins, both **staged and verified, neither shipped**:

1. **Image-encoding autoresearch loop (flagship).** Converged to per-preset AVIF quality
   `hero 78 · heroVertical 78 · about 82 · album 79 · team 78` → **−18.6% AVIF (train), −16.9%
   (holdout, generalizes)**, scorer-guaranteed within 0.02 SSIM of production + human visual gate.
   Staged in `scripts/autoresearch/best-presets.json` (NOT applied to `constants/imagePresets.json`).
2. **Track A JS reduction.** PrimeVue tree-shake + FA cdnjs dedupe + below-fold lazy hydration →
   **JS 3.1 MB → 0.88 MB (−72%)**, functionally verified (modal, form, no errors). Staged in the
   working-tree edits to `nuxt.config.ts` + `pages/index.vue`.

**The biggest lesson (from real device/network testing):** JS is NOT the LCP lever here — the hero
`<h1>` is SSR text that paints before hydration, so the JS win is for interactivity/bandwidth, not
LCP. LCP is gated by the hero's `fadeIn 0.5s` opacity animation (~500 ms) + fonts. Owner chose to
leave LCP as-is (live mobile 2.7 s, CLS 0).

### To ship later (owner's call)

- **Apply the image winner:** copy the `avifQuality` values from `best-presets.json` into
  `constants/imagePresets.json`, run `npm run compress-images`, then `npm run generate`. Re-run the
  visual gate first: `node scripts/autoresearch/visual-compare.mjs --preset about --qualities 85,82`.
- **Re-run / extend the loop:** `node scripts/autoresearch/loop.mjs --candidates <round>.json`
  (locked scorer = `score-images.mjs`; baseline = `baseline-images.json`; never let the loop edit
  those). Re-baseline after shipping a winner: `score-images.mjs --write-baseline --set all`.
- **The Track A edits** are already in the working tree — review the diff and commit when ready.

## Build log / state

- **Phase 0 (image side) — DONE.** Locked scorer + fixtures + SSIM + production baseline,
  validated in both directions (rejects an over-aggressive quality drop; measures byte deltas).
- **Phase 2.1 — DONE.** Encoder knobs extended; `scripts/lib/encode-options.mjs` shared by the
  scorer and the real `compress-images.js` so measured bytes == built bytes.
- **Track A Stage 1+2 — DONE locally, verified, NOT shipped.** (staged in working tree)
  - PrimeVue `include:'*'` → `['Button','InputText','Textarea']`; removed redundant render-blocking
    Font Awesome cdnjs `<link>`; home-page below-fold sections `hydrate-on-visible` + modal lazy chunk.
  - **JS shipped: 3.1 MB → 0.88 MB** (clean rebuild; ~72%, incl. your three.js removal).
  - **LCP barely moved (3685 → 3672 ms localhost low-end).** KEY LESSON: the hero `<h1>` is SSR text
    that paints BEFORE hydration, so JS reduction helps **TBT/INP + bandwidth + maintainability**, NOT
    LCP. (A build cache corruption — `server.mjs … 'owRef'` — needed a clean `.nuxt` rebuild; not a
    source bug.)
  - **Functionally verified** in-browser: no console errors/hydration mismatches; release click opens
    the (lazy) modal; contact form renders; all SSR section content present (SEO-safe).
  - **Measurement caveat:** localhost is HTTP/1.1 (`npx serve`) — it serializes CSS and over-weights
    render-blocking vs the live HTTP/2 host (where RenderBlocking insight was 0 ms). Local A/B is
    internally consistent; the live HTTP/2 traces remain the real-world anchor.
- **Real LCP levers (next):** the hero `<h1>` carries `.animate-fade-in` = `fadeIn 0.5s` opacity
  0→1 — an entrance animation on the LCP element delays LCP by up to ~500 ms (textbook anti-pattern).
  Plus `font-display` (insight: ~575 ms FCP) and render-blocking CSS. These — not JS — move LCP.
  (Hero fade is an aesthetic choice → needs owner sign-off.)

- **Phase 2.2 — CONVERGED (awaiting ship approval).** 4 rounds, margin 0.02. Winner per-preset
  AVIF quality: `hero 78 · heroVertical 78 · about 82 · album 79 · team 78` (others unchanged).
  - **Train: 18.62%** weighted-AVIF reduction, feasible. **Holdout: 16.91%**, feasible — the win
    transfers to unseen images (incl. a PNG source), so it's not overfit.
  - Loop findings: `about` hits a steep SSIM cliff (q82→81 jumps −0.013→−0.020), so it's pinned
    at 82; heroes floor at 78; pushing low-weight presets to the edge bought ~nothing, so they
    keep their buffer. Effort and chroma-subsampling were both rejected by the scorer.
  - Visual gate generated (`visual-compare.mjs`): production vs winner, 1:1 crops — indistinguishable.
  - **Next (needs approval):** apply winner to `constants/imagePresets.json` → `npm run compress-images`
    → re-baseline Lighthouse to confirm real-world LCP/transfer gains → re-capture image baseline.

### Calibration finding (the "metric is the hard part", confirmed immediately)

The first scorer run on **current production** (quality 85) scored as low as **0.80 RGB-SSIM** on
noisy concert photos — because SSIM penalizes JPEG's denoising of sensor grain, not real visible
loss. An **absolute** SSIM floor would have rejected the live site. Two corrections, locked in:

1. **Anchor to production, not an absolute.** A candidate may not drop any `(fixture, format)`
   SSIM more than `SSIM_MARGIN` (0.005) below its _current_ value (`baseline-images.json`).
   Production quality is shippable by definition, so "don't regress below it" is the right constraint.
2. **Weight bytes toward AVIF** (`SERVED_WEIGHT`): AVIF is first in every `<picture>` and served to
   ~95%+ of browsers; WebP/JPEG are fallbacks almost nobody downloads, so shrinking them barely
   moves real page weight. The loop optimizes the bytes users actually pay for.

Empirical lever findings: AVIF `effort 9` is **not** a free win here (bytes +1.8%, and slow) — so
the loop tunes **quality** (down to the margin) and **chroma subsampling**, leaving effort at 4.

## 0. What this is (and the misconception it is NOT)

The **autoresearch loop** is an autonomous hill-climb: an agent edits **one artifact** → a
**locked, automated scorer** returns a single number → keep if it improved, discard if not →
repeat fast. Karpathy: _"give it an objective, a metric, and the boundaries — then remove
yourself as the bottleneck."_

It does **NOT** research the web for performance best-practices (the name misleads). It
mechanically squeezes a metric we define. Therefore:

- The **big architectural wins** (render-blocking fonts, oversized bundles, dead deps) it
  **structurally cannot find** (gwern: a fixed-budget single-artifact search misses
  out-of-distribution/architectural wins). → handled by **Track A** below, not the loop.
- **"The metric is the hard part" — autoresearch _is_ reward-function design.** A locked-but-wrong
  metric optimizes confidently in the wrong direction; the loop will **Goodhart** any proxy
  (optimize SSIM → mushy images that score fine). → handled by the **locked scorer + held-out
  set + visual gate** in Phase 0.

## Site facts that shape the plan (measured 2026-06-19)

- **Dominant payload: ~68 MB of optimized images.** Individual AVIFs run ~1 MB at quality 85
  (`about-us/7.avif` = 1.08 MB) — high for AVIF; `sharp` defaults to `effort: 4` and chroma
  subsampling isn't tuned. **Clear, measurable headroom → image presets are the flagship lever.**
- `_nuxt` bundle ≈ 5.9 MB on disk (uncompressed).
- Render-blocking **Font Awesome** full CSS via CDN `<link>` (`nuxt.config.ts:250`).
- **Google Fonts**: 5 families × ~5 weights × 3 subsets, `preload: true` (`nuxt.config.ts:444`).
- **three.js** in deps, referenced only by the untracked experimental `pages/glass-lab.vue`.
- **PrimeVue** `components: { include: '*' }` (`nuxt.config.ts:418`) — pulls in all components.
- Prerender list is large (releases × locales × source-prefixes × listen/pre-save) → a
  full-build + Lighthouse loop is **minutes/iteration**; an image-encode loop is **seconds**.

## Decisions taken

1. **Target:** both loops — **images first**, then build knobs.
2. **Execution:** **in-session**, orchestrated via the Workflow/agent tooling (subagent proposer
   - locked Node scorer). No API keys, no unattended runs. You watch.
3. **Architectural audit:** **yes** — runs as a separate non-loop track.

---

## Phase 0 — Baseline & locked guardrails (shared foundation)

You cannot hill-climb without a baseline, and the loop is unsafe without a locked metric. This
phase is the honest "hard part."

- **0.1 Perf baseline.** Build (`npm run generate`), serve `.output/public`, run Lighthouse
  (mobile, throttled) on a route set: `/ua`, a release `/ua/listen/<slug>`, about/contacts.
  Persist JSON + composite (LCP, TBT, CLS, total transfer, JS bytes). Committed; every loop
  reports deltas vs this.
- **0.2 Held-out image set.** ~10–12 representative **source** originals across presets (hero
  h+v, album, about, team, meta). Split into an **optimize-against** set (loop sees) and a
  **held-out test** set (overfitting check only).
- **0.3 Lock the scorer** — `scripts/autoresearch/score-images.mjs`. Input: a candidate
  `imagePresets.json`. Re-encodes the optimize-against set with sharp, computes per-image
  **SSIM** (sharp raw buffers → windowed SSIM in JS; optional ffmpeg/VMAF if installed) + total
  bytes, returns one scalar. **This file + the test set + the reward fn are LOCKED — the loop may
  not edit them.**
  - **Reward (the real work):** minimize total bytes **subject to** per-preset SSIM floors
    (e.g. hero/album ≥ 0.985, about ≥ 0.98), encoded as a penalty:
    `score = total_bytes + Σ PENALTY·max(0, floor − SSIM_i)` (lower = better).
  - **Anti-Goodhart:** SSIM over-rewards blur, so add a secondary guard (gradient/edge energy or
    DSSIM/Butteraugli if available) **and** a mandatory **visual before/after montage gate**
    before any winner ships. Locking stops scorer-editing, NOT Goodharting (per KB).

## Real-world baseline (live wbmband.com/ua, Chrome DevTools traces, 2026-06-19)

| Condition                        | LCP     | Render delay (JS) | TTFB   | CLS  |
| -------------------------------- | ------- | ----------------- | ------ | ---- |
| Desktop, no throttle             | 692 ms  | 574 ms (83%)      | 118 ms | 0.00 |
| Low-end mobile (Slow 4G, 6× CPU) | 2689 ms | 2541 ms (94%)     | 147 ms | 0.00 |
| Poor network (Slow 3G, 4× CPU)   | 6705 ms | 5916 ms (88%)     | 789 ms | 0.00 |

**Decisive finding: JavaScript render-delay dominates LCP in every condition.** The LCP element is
the hero `<h1>` text (not an image), so it can't paint until the app hydrates. On fast networks the
cost is JS _execution_; on slow networks it's the 3.1 MB JS _download_ + execution. CLS is already
perfect (0.00) everywhere — no work needed.

**This reprioritizes the whole effort: JS, not images, is the LCP lever.** The image autoresearch
win (−18.6% AVIF) is real but it's a **bandwidth/data** win + helps image-LCP pages and
download-bound LCP — it does not move home-page LCP.

### Track A findings (measured)

- **3.1 MB JS, ~27 chunks** on the home page (biggest loaded chunk 384 KB, `Cmri6k89.js`, also the
  forced-reflow source). The render-delay driver. Levers: PrimeVue `include:'*'` → used-only,
  lazy/deferred hydration, defer analytics.
- **Font Awesome loaded twice**: render-blocking cdnjs `all.min.css` (`nuxt.config.ts:251`) AND a
  bundled `_nuxt/all.*.css` (128 KB) from `plugins/fontawesome.client.ts`. The CDN link is
  redundant. (RenderBlocking insight = 0 ms LCP savings because LCP is JS-bound, but it's still a
  dropped external dependency + small FCP win.)
- **three.js (704 KB chunk) is built into prod** from the untracked experimental `pages/glass-lab.vue`.
  Code-split, so NOT loaded on home — but `deploy:production` builds from the working tree, so it
  WOULD ship. Flag for decision (don't delete the user's experiment).
- **DocumentLatency** insight on Slow 3G: ~631 ms FCP/LCP from the initial document — check the host
  serves gzip/brotli on HTML (`.htaccess`).
- Fonts: multiple families × weights × subsets self-hosted (Inter, Space Grotesk, Manrope 300s,
  latin+cyrillic). Payload trim candidate.

## Phase 1 — Track A: Architectural audit & fixes (parallel, non-loop)

The wins the loop can't reach. Audit → targeted fix → re-measure vs Phase-0 baseline → keep if
it improves (a manual mini eval-loop). Candidates (confirmed by audit, not assumed):

- **Font Awesome** render-blocking CDN CSS → subset/self-host or inline only the icons used.
- **Google Fonts** → cut unused families/weights/subsets; consider self-host + preconnect.
- **three.js** → confirm tree-shaken from prod; if not, route-split or drop from prod build.
- **PrimeVue `include: '*'`** → scope to components actually used.
- **Bundle/code-split** → inspect `_nuxt` for oversized shared chunks; per-route JS hygiene.

Expected to yield the **largest single gains**.

## Phase 2 — Track B: Image-encoding autoresearch loop (flagship)

- **2.1 Extend the search space.** Add knobs sharp exposes but presets don't use: AVIF `effort`
  (0–9), `chromaSubsampling`; WebP `effort`/`smartSubsample`. `imagePresets.json` grows these
  fields (backward-compatible); `compress-images.js` + scorer read them.
- **2.2 The loop (in-session Workflow).** Each round: proposer subagent reads current presets +
  recent scores/reasoning → emits ONE `imagePresets.candidate.json` → locked scorer scores it →
  keep if improved, else discard → append to `results.jsonl`. Run N rounds or until K rounds with
  no improvement (loop-until-dry).
- **2.3 Overfitting check.** Score the winner on the **held-out test set**; if the win doesn't
  transfer, tighten the set/floors (mirrors Karpathy's depth-12→24 transfer check).
- **2.4 Visual gate + ship.** Render before/after montage → your eyeball → on approval update
  `imagePresets.json`, run `npm run compress-images` for real, re-baseline Lighthouse to confirm
  real LCP/transfer gains, commit.

## Phase 3 — Track C: Build-knob autoresearch loop (secondary, guarded)

Only after B ships. Same machinery, different artifact + scorer.

- **Artifact:** a small curated set of Vite/Nitro knobs (manualChunks, `build.cssMinify`,
  `build.target`, route rules) in a scratch config — never the live `nuxt.config.ts` until a
  winner is chosen.
- **Locked scorer:** `npm run generate` → serve → headless Lighthouse on the route set →
  weighted composite (LCP+TBT+CLS + JS bytes).
- **Guards:** build failure = worst score (discard, don't crash); per-build timeout; minutes/iter
  so few rounds; never deploy. This is the fragile track — keep the knob set tiny, bail if it
  isn't paying off.

## Phase 4 — Wrap-up

- Update this doc with measured results; fold a pointer into the `performance` skill
  (per CLAUDE.md "add its doc to docs/ … fold into the relevant skill").
- Save a memory entry for the initiative.
- Report gains vs Phase-0 baseline.

## Deliverables

```
scripts/autoresearch/
  baseline.mjs            # Lighthouse + image-payload baseline capture
  score-images.mjs        # LOCKED scorer (SSIM + bytes → scalar)
  fixtures/               # optimize-against + held-out source images (or manifest)
  results/*.jsonl         # per-round run logs
constants/imagePresets.json   # edited by the loop (+ new effort/subsampling knobs)
scripts/compress-images.js    # read new knobs
nuxt.config.ts                # Track A fixes
docs/autoresearch-perf-loop.md# this plan + results
```

## Risks (and the KB-prescribed handling)

| Risk                        | Handling                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| Reward hacking              | Locked scorer (uneditable) + held-out set + **visual gate**                   |
| Locked-but-wrong metric     | Conservative SSIM floors; review metric harder than the loop; visual backstop |
| Eval-set overfitting        | Separate held-out test set + transfer check                                   |
| Slow/fragile build loop (C) | Tiny knob set; build-fail = worst score; timeouts; never deploy               |
| Architectural blindness     | That's exactly why Track A exists and runs first                              |

## Proposed first step

**Phase 0** — capture the baseline, build the held-out set, write + lock the image scorer. Then
Track A audit in parallel, then the flagship loop.
