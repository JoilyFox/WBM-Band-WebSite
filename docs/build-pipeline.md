# Build Pipeline

What `npm run generate` actually does, in order, and which parts rewrite your HTML behind your
back. Read this before changing fonts, routes, the `<head>`, or anything that emits redirects.

## Commands

| Command                    | Runs                                                                | Used for                              |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| `npm run generate`         | `generate:base` -> `generate-sitemap.js` -> `generate-bio-links.js` | Production build (the one to use)     |
| `npm run build:production` | alias for `generate`                                                | `deploy:production`                   |
| `npm run deploy:github`    | `DEPLOY_TARGET=github npm run generate:base`                        | GitHub Pages staging (no sitemap/bio) |
| `npm run generate:base`    | `nuxt generate` only                                                | Raw Nuxt output                       |

`npm run build` (`nuxt build`) is a server build; it does not produce the static site.

## Stages

### 1. Route list (`nuxt.config.ts`, config load time)

`nitro.prerender.routes` is built from three inputs:

- `STATIC_ROUTES` - home, privacy-policy, terms-of-service, cookies-policy, each as `/path`
  (Ukrainian, unprefixed) and `/en/path`.
- `masterPageRoutes()` - `data/musicLibrary.ts` x `LOCALES` x {`listen`, `pre-save`} x
  `SOURCE_PREFIXES` (`utils/sourceAttribution.ts`), so a new release or a new attribution prefix
  needs no edit in `nuxt.config.ts`.
- Lyrics pages - one `/lyrics/<slug>` (clean URL only) per release that has `lyrics`.

`assertNoSlugCollisions()` fails the build if a release slug shadows a reserved source prefix.
Adding a **page** (not a release) still needs a manual entry in `STATIC_ROUTES`; see the
`add-page-route` skill.

`failOnError: false` lets the build finish when a route returns an error status (maintenance
mode returns 503 on the home page).

### 2. Prerender (`nuxt generate`)

Nitro renders every route to `.output/public/<route>/index.html`. With `prefix_except_default`
the Ukrainian pages are the real unprefixed files (`/index.html`, `/listen/<slug>/index.html`);
English lives under `en/`. There is no `ua/` directory.

Nitro also emits `200.html` and `404.html`, the empty SPA shell. Production nginx serves
`404.html` with a 404 status for unknown URLs (there is no catch-all fallback, see
`deploy/nginx/README.md`).

### 3. `prerender:generate` hook (`nuxt.config.ts`, `nitro.hooks`)

Runs on every generated `.html` file before it is written, and rewrites `route.contents`:

1. **`noindex` on redirect stubs.** A route that a middleware redirects away from (an unreleased
   `/listen/<slug>`, a disabled `/pre-save/<slug>`) is emitted by Nitro as a 200-status
   `<meta http-equiv="refresh">` stub with no content. Google reads that as a soft 404, so the
   hook injects `<meta name="robots" content="noindex">` into any such page that has no robots
   meta. Real content pages are untouched.
2. **Headline font preload.** The hook reads the hashed URL of the Space Grotesk `basic-latin`
   (`U+0000-00FF`) `@font-face` out of the page's own inlined CSS (written by `@nuxt/fonts`) and
   prepends `<link rel="preload" as="font" type="font/woff2" crossorigin>` to `<head>`. This
   keeps the LCP headline from queueing behind hero images. Because the URL is read from the
   page, it survives font hash changes and `DEPLOY_TARGET` base paths. If you change the
   headline font family, subset or `@nuxt/fonts` config, this regex must follow, or the preload
   silently disappears.

### 4. Post-build scripts (plain `node`, run by `npm run generate`)

Both scripts text-parse the canonical TS files (`constants/app.ts`, `utils/sourceAttribution.ts`,
`data/musicLibrary.ts`) because plain `node` cannot import typed modules.
`test/unit/build-script-drift.spec.ts` guards that parsing against drift.

- **`scripts/generate-sitemap.js`** writes `.output/public/sitemap.xml`: canonical, indexable URLs
  only (homes, policy pages, listen + lyrics per locale). The host is always `SITE_URL`
  (production), never the GitHub Pages mirror. Source-prefixed variants and pre-save pages are
  excluded; a **not yet released** release is skipped from `/listen` (its page is a redirect stub).
- **`scripts/generate-bio-links.js`** writes `.output/bio-links.md` (outside `public/`, so it is
  not deployed): every source-prefixed URL for every release x page type x locale, for pasting
  into Instagram/TikTok/YouTube bios.

`deploy:github` skips both: they bake in the production URL.

### 5. Output checks

`npm run test:e2e` = `npm run generate` + Vitest against `.output/public`
(`test/e2e/static-output.e2e.spec.ts`): every release x type x locale page exists, sitemap and
robots are present, dev pages (`/test`, `/performance-test`) are **not** generated, no GitHub
Pages base path leaks into the production HTML. The browser smoke test needs Chromium.

## Routing contract (what the output assumes about the server)

| URL                                       | Expected behaviour                    |
| ----------------------------------------- | ------------------------------------- |
| `/`, `/listen/<slug>`, `/lyrics/<slug>`   | 200, the Ukrainian files              |
| `/en`, `/en/listen/<slug>`                | 200, English files                    |
| `/ua`, `/ua/*`                            | 301 to the clean URL (retired prefix) |
| `/index.html`, trailing-slash twins, `//` | 301 to the clean URL                  |
| Unknown URL, missing `/_nuxt/*.js`        | real 404 (`404.html`)                 |

nginx (`deploy/nginx/`) implements this in production. `public/.htaccess` and `public/_redirects`
express the same contract for the legacy shared host and GitHub Pages and are covered by
`test/unit/routing-contract.spec.ts`; nginx does not read them.

## Gotchas

- `npm run generate` overwrites `.nuxt`, which breaks a running `npm run dev` (restart it).
- `experimental.appManifest: false` is deliberate: it stops requests for build-metadata files
  from 404ing on static hosts.
- `detectBrowserLanguage: false` is deliberate (Googlebot indexed the English home at `/`); see
  `docs/search-console.md`.
- The prerender hook sees HTML strings, not a DOM: keep the regexes tolerant and covered by a
  build check when you touch them.

## Related

- [Deployment Guide](./deployment-guide.md) - how the output reaches the server
- [Image Optimization Guide](./image-optimization-guide.md) - the build-time image pipeline
- [Search Console](./search-console.md) - why the hook, the sitemap and the routing look the way they do
