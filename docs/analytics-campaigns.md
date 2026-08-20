# Promo campaigns — per-placement tracking

> You pay a blog, a Telegram channel or a radio show to post about a release. This is how you give them a link that
> reports back: how many people opened the release page, how many of those clicked through to a streaming platform,
> and what that cost per click. Property = **WBM Website `523582426` (`G-Z8QRF6TWC2`)**.
>
> Background on how GA4 attribution works here: [`analytics-debugging.md`](analytics-debugging.md) ·
> Dashboards: [`analytics-dashboards.md`](analytics-dashboards.md)

---

## 1. The model: platform ≠ campaign

Two independent questions, two independent dimensions, both on every conversion event:

| Question                  | Dimension         | Carried by                     | Example                  |
| ------------------------- | ----------------- | ------------------------------ | ------------------------ |
| From **which platform**?  | `source_platform` | path prefix `/listen/i/<slug>` | `instagram`              |
| From **which placement**? | `campaign_id`     | query param `?c=<id>`          | `khvyli-kyiv-music-0821` |

```
https://www.wbmband.com/pre-save/i/khvyli?c=khvyli-kyiv-music-0821
                        └────────┘ └─┘        └──────────────────┘
                        page type  channel     campaign id
```

Your own bio links stay clean (`/listen/i/khvyli`) and report as `campaign_id = none`. Only links you hand to someone
else carry `?c=`. That `none` baseline is what you compare a paid placement against.

**Why a query param and not another path segment:** the site is statically generated — every path combination needs a
prerendered route. Campaigns are created ad hoc, so a path segment would mean a rebuild + deploy per campaign. A query
param needs neither: the already-published page serves as-is and the id is read client-side.

`utm_campaign` is accepted as an alias. So if an outlet insists on standard UTM tags, or you build a link in a UTM
builder, it still attributes (and GA4's own campaign reports fill in too — see §6).

---

## 2. Create a campaign link

One command. It validates the release, generates the id, records the placement, and prints the URL to send:

```bash
npm run campaigns -- add \
  --release khvyli \
  --media "Kyiv Music Blog" \
  --channel i \
  --medium paid \
  --cost 1500 \
  --start 2026-08-21
```

```
✓ Added campaign "khvyli-kyiv-music-blog-0821" → data/campaigns.json

  https://www.wbmband.com/pre-save/i/khvyli?c=khvyli-kyiv-music-blog-0821
```

Flags:

| Flag         | Meaning                                     | Default                    |
| ------------ | ------------------------------------------- | -------------------------- |
| `--media`    | who publishes it (**required**)             | —                          |
| `--release`  | release slug (**required** unless `--path`) | —                          |
| `--path`     | promote any page instead (`/press/khvyli`)  | —                          |
| `--channel`  | source prefix — `i tt yt fb x tg …`         | none (plain, no prefix)    |
| `--page`     | `listen` · `pre-save` · `auto`              | `auto` — by `releaseDate`  |
| `--lang`     | `ua` · `en`                                 | `ua` (unprefixed URLs)     |
| `--medium`   | `paid` · `barter` · `organic` · anything    | `paid`                     |
| `--cost`     | what you paid (number)                      | `0`                        |
| `--currency` | currency code                               | registry `defaultCurrency` |
| `--start`    | `YYYY-MM-DD`                                | today                      |
| `--end`      | `YYYY-MM-DD`                                | —                          |
| `--notes`    | free-form reminder                          | —                          |
| `--id`       | override the generated id                   | `<release>-<media>-<MMDD>` |
| `--dry`      | print, write nothing                        | —                          |

Other commands:

```bash
npm run campaigns                     # list every campaign with its link
npm run campaigns -- links            # bare URLs, one per line (easy to copy)
npm run campaigns -- links <id>       # one campaign's URL
npm run campaigns:export              # .output/campaigns.md + .output/campaigns.csv
```

**Rules that matter**

- Give the outlet the **exact** URL. If they strip `?c=…`, the visit still counts as `instagram`, just not as this
  campaign — attribution degrades, it never breaks.
- Ids are lowercase-kebab, ≤ 40 chars. A mistyped id (`Khvyli_Kyiv Music`) is normalized client-side to the canonical
  form, so a cosmetic error in a published link still resolves.
- Always set `--channel` when the placement lives on a platform you have a prefix for. Then one link answers both
  questions and the campaign row also shows up in the per-platform reports.
- Set `--cost` even when it's barter (`--cost 0 --medium barter`) — that's how the ROI column stays honest.

---

## 3. One-time GA4 setup

`campaign_id` must be registered as an **Event-scoped** custom dimension, exactly like the existing four. The admin
script already lists it — run it once:

```bash
node scripts/ga-admin.mjs           # dry run: shows what's missing
node scripts/ga-admin.mjs --apply   # creates the missing dimensions
```

Then: **custom dimensions are forward-only (no backfill) and take 24–48 h to populate.** Register it _before_ the first
campaign goes live, or that campaign's first day is unreadable in the UI. (`scripts/ga-report.mjs` queries the Data API
and is affected by the same latency.)

---

## 4. Read the results — CLI (fastest)

```bash
node scripts/ga-report.mjs --campaigns          # all campaigns, last 28 days
node scripts/ga-report.mjs --campaigns 7        # ...last 7 days
node scripts/ga-report.mjs --campaign khvyli-kyiv-music-blog-0821
```

```
Promo campaigns — last 28 days

  campaign                   views clicks  conv%    cost per click  visits
  khvyli-kyiv-music-blog-0821  142     38    27%     1500        39  ██████████████████████
  ↳ Kyiv Music Blog · khvyli
  khvyli-radio-promin-0821      24      3    13%        0         —  ████··················
  ↳ Радіо Промінь · khvyli
```

The report joins GA4 against `data/campaigns.json`, which holds what GA can never know — the outlet, the money, the
dates. `campaign_id` is the join key. Untagged traffic (`none`) is excluded from the table: it's the baseline, not a
campaign.

**"Cost per click" is cost ÷ `platform_click`** — cost per person who actually went to a streaming platform. That's the
number to compare across outlets when deciding who to buy from again.

---

## 5. Read the results — Looker Studio page

Add a **"Промокампанії"** page to the existing dashboard
([report link](https://datastudio.google.com/u/0/reporting/92f022ac-2ca4-474a-9a8b-d41912e1a8e3/page/p_lxsdtuoj4d)).
Setup steps for the report itself are in [`analytics-dashboards.md`](analytics-dashboards.md) §2.

1. **Page → New page**, name it "Промокампанії". Keep it separate so the song picker on the per-song page doesn't
   filter it (a control filters its whole page).
2. **Insert → Control → Drop-down list** → Control field = **`Promo Campaign`** (that's `campaign_id`). It auto-fills
   with new campaigns — nothing to maintain.
3. **Insert → Control → Date range control.**
4. **Insert → Pivot table**: Row = `Promo Campaign` · Column = `Event name` · Metric = `Event count` · chart filter
   Include `Event name` **In** `release_view, platform_click`. Add a second filter **Exclude** `Promo Campaign` = `none`
   so the untagged baseline doesn't dwarf the rows.
5. **Insert → Time series**: Dimension `Date`, Metric `Event count`, breakdown `Promo Campaign`, same event filter —
   shows how long each placement kept delivering (usually 48–72 h; that decay is the interesting part).
6. **Per campaign × platform**: a second pivot with Row = `Promo Campaign`, Column = `Source platform`. Useful when one
   outlet posts to several platforms under one id.

### Cost / ROI inside Looker (optional)

GA4 has no idea what you paid. To get cost columns in the dashboard:

1. `npm run campaigns:export` → `.output/campaigns.csv`.
2. Upload it to Google Sheets (or paste it into a sheet in your Drive).
3. In Looker Studio: **Add data → Google Sheets** → that sheet.
4. **Resource → Manage blends** → blend GA4 with the sheet, **join key `campaign_id` ↔ `Promo Campaign`**, join type
   **Left outer** (GA4 on the left).
5. In a table on the blend, add a calculated field `Cost per click = SUM(cost) / SUM(clicks)`.

Re-run the export and re-upload whenever you add campaigns. If that upkeep isn't worth it, skip the blend — the CLI
(§4) already prints cost per click.

---

## 6. What this does and doesn't measure

- **Views vs clicks.** `release_view` is deduped per session **per source per campaign**; `platform_click` is not
  deduped (one visitor can click Spotify and Apple Music). So conv% > 100 % is possible — read it as
  clicks-per-visit engagement, not a literal rate.
- **First-touch, session-scoped.** The id is stored in `sessionStorage` and survives internal navigation and the
  pre-save → listen redirect on release day. A visitor who returns tomorrow without the link is `none`.
- **A second campaign link re-attributes.** Clicking another `?c=` link mid-session overwrites the stored id — same
  rule as path prefixes. Deliberate: the last placement that got them to click is the one that did the work.
- **Consent.** Under default-deny (`gcs=G100`) events are cookieless, but `campaign_id` is an **event parameter**, so
  it rides the ping either way. This is exactly why the campaign lives in our own dimension and not only in GA4's
  session-scoped `Session campaign` — see [`analytics-debugging.md`](analytics-debugging.md) §2.
- **UTM tags still work in parallel.** Append `utm_source`/`utm_medium`/`utm_campaign` if an outlet wants them and
  GA4's native Acquisition reports will populate too. Treat them as a bonus; `campaign_id` is the reliable number.
- **Small numbers are noisy.** A placement that drives 12 visits tells you almost nothing on day one. Compare over the
  full campaign window, and against your untagged baseline for the same release.
- **Bots.** `platform_click` is bot-filtered (`isLikelyBot`), `release_view` is not — an outlet's link preview crawler
  can inflate views slightly. If views look impossible next to clicks, that's usually why.

---

## 7. Where things live

| File                                     | Role                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `data/campaigns.json`                    | the registry: id, outlet, release, channel, medium, cost, dates, notes |
| `scripts/campaigns.mjs`                  | `add` / `list` / `links` / `export` — the only way you should edit it  |
| `utils/campaignAttribution.ts`           | reads `?c=` / `utm_campaign`, normalizes, persists first-touch         |
| `composables/useAnalytics.ts`            | attaches `campaign_id` to `release_view` + `platform_click`            |
| `plugins/analytics.client.ts`            | captures the id at boot, sets it as a default event param + user prop  |
| `scripts/ga-report.mjs`                  | `--campaigns` / `--campaign <id>` reports                              |
| `scripts/ga-admin.mjs`                   | registers the `campaign_id` custom dimension                           |
| `test/unit/campaign-attribution.spec.ts` | normalization / detection / persistence coverage                       |

The registry is committed to git on purpose: it's a small, factual record of what was bought and what it cost, and it
keeps the ROI numbers reproducible months later.
