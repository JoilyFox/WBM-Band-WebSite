# GA4 Dashboards & Per-Song Reports

> Three ways to see per-song / per-source numbers: a zero-UI **CLI report**, additions to your existing **GA4
> Explorations**, and a **Looker Studio master dashboard** (the recommended "one page for everything" with a dynamic
> song picker). Property = **WBM Website `523582426` (`G-Z8QRF6TWC2`)**. Background + why reports go empty:
> [`analytics-debugging.md`](analytics-debugging.md). Per-placement (paid/barter) numbers live in
> [`analytics-campaigns.md`](analytics-campaigns.md) — same dashboard, its own page.

> **Reading the numbers:** `release_view` is deduped per session+source (one visit = one view); `platform_click` is
> NOT deduped (a visitor can click several platforms). So "conv%" = clicks ÷ views can exceed 100% — treat it as
> clicks-per-visit engagement, not a literal conversion rate. Also: today most traffic is `source = direct` because
> the prefixed bio links (`.output/bio-links.md`, `/listen/i/…`, `/pre-save/tt/…`) aren't being posted — untagged
> links + in-app browsers (which strip the referrer) collapse to `direct`. Fix that first and the per-platform rows
> fill in.

---

## 0. CLI report — fastest, no GA UI (`scripts/ga-report.mjs`)

Auto-discovers every release in the data (new songs appear automatically — nothing to edit). Auth = your ADC login
(see `analytics-debugging.md` §5).

```bash
node scripts/ga-report.mjs                 # all releases: views, clicks, conv%
node scripts/ga-report.mjs chorni-ptahy    # one release, broken down by source platform
node scripts/ga-report.mjs mania 7         # ...over the last 7 days (default 28)
```

Example:

```
"mania" — source breakdown, last 28 days
  source         views clicks  conv%  visits
  direct            88     19    22%  ██████████████████████
  other              6      8   133%  ██····················
  search             1      0     0%  ······················
  TOTAL             95     27    28%
```

---

## 1. GA4 Explorations — add per-song views to what you already have

GA4 Explore has **no dropdown widget** (that's a Looker Studio feature). Inside Explore you get three patterns:

### A. One exploration, switch songs with a filter

1. Open the exploration. In the left **Variables** column, make sure **`Release slug`** is imported (if absent: `+`
   next to DIMENSIONS → search "Release slug" → Import).
2. Right column **Settings** → scroll to **FILTERS** → drag **`Release slug`** in.
3. Condition **`exactly matches`** → value `chorni-ptahy` (or `mania` / `alina`) → **Apply**.
4. Edit that value to switch songs.

### B. A dedicated tab per song (persistent side-by-side)

1. Right-click the tab at the top of the exploration → **Duplicate**. Do it once per song.
2. Rename each tab to the song (double-click the tab name).
3. On each tab, set a **`Release slug` exactly matches `<that song>`** filter (step A).
4. New release → add one more tab manually. (This is the only "manual per release" option; B is for when you want
   them all visible at once.)

### C. All songs as rows — automatic, zero maintenance

1. Drag **`Release slug`** into **ROWS**, above `Source platform` (so it nests: song → source).
2. Every release becomes its own expandable row group, and **new songs appear automatically**. It's one big table
   rather than separate tables, but it needs no upkeep.

> Tip for "visitors vs conversions": set **Columns = `Event name`**, **Values = `Event count`**, and a **filter
> `Event name` matches regex `^(release_view|platform_click)$`** — then each row shows views and clicks side by side.

---

## 2. Looker Studio — the master dashboard (recommended for #2 **and** #3)

One shareable page = per-song source tables **+ a dynamic song dropdown that auto-includes new releases** + general
stats (users over time, country map, devices, top pages). This is the "master analytics page" — everything in one
place, no jumping between Explore tabs. ~20 minutes to build once.

### Step 1 — Create the report + connect GA4

1. Go to **[lookerstudio.google.com](https://lookerstudio.google.com)** → **Create → Report** (sign in as
   `wbmbandofficial@gmail.com`).
2. In "Add data to report" pick the **Google Analytics** connector → account **Woman Based Mechanics** → property
   **WBM Website** (`523582426`) → **Add**. (Pick the right property — _not_ "WBM Band".)
3. A starter table drops on the canvas; delete it. Your custom dimensions show up in the field list as **Source
   platform**, **Release slug**, **Page type**, **Platform name**.

### Step 2 — The dynamic song picker (the part you wanted)

1. **Insert → Control → Drop-down list.** Place it at the top.
2. In its **Setup**, set **Control field = `Release slug`**. Leave metric default.
3. That's it — the dropdown auto-fills with `alina / chorni-ptahy / mania / …` from the data, and **future releases
   appear automatically**. By default a control filters **every chart on the page** (see Step 5 about scoping).

### Step 3 — Per-source visits-vs-conversions table

1. **Insert → Pivot table.**
2. **Row dimension = `Source platform`**. **Column dimension = `Event name`**. **Metric = `Event count`**.
3. Chart **Filter** (Setup → Add filter → Create): Include `Event name` **In** `release_view`, `platform_click`.
   Now each source row shows its views vs clicks. (Optional: add a calculated field
   `clicks/views` for conv%.)

### Step 4 — General stats (the "home overview" feel)

- **Time series** (Insert → Time series): Dimension `Date`, Metric `Active users` (or `Event count`) — traffic over time.
- **Geo map** (Insert → Google Maps → _Filled map_, or Geo chart): Dimension `Country`, Metric `Active users`.
- **Devices** (Insert → Pie chart): Dimension `Device category`, Metric `Active users`.
- **Top pages** (Insert → Table): Dimension `Page path + query string`, Metric `Views`.
- **Date range control** (Insert → Control → Date range control): lets you re-scope the whole page by date.

### Step 5 — Scope the song picker (important)

A control filters the **whole page** by default — so picking a song would also filter the country map etc. Two clean
layouts:

- **Page 1 "Per song":** the song dropdown + the per-source table + a per-song time series. Select them all →
  right-click → **Group** (or just keep them on this page) so the dropdown scopes to these.
- **Page 2 "Overview":** general stats (countries, devices, users-over-time, top pages) with **no** song control, so
  it always shows the whole site. (Add pages via the **Page → New page** menu.)

### Step 6 — Title & share

Name it "WBM Analytics", arrange, then **Share** → copy link (or schedule an emailed PDF). Done — that's your master
dashboard.

---

## Can this be automated / built for you?

- **CLI report (§0):** yes — already built and maintained in this repo.
- **GA4 Explorations (§1) & Looker Studio (§2):** Google exposes **no API** to create/edit Explorations or build
  Looker reports with controls, so those are owner-built in the UI (steps above). The Data API (what `ga-report.mjs`
  and the `ga4` MCP use) can only _read_ — it can't create dashboards.
