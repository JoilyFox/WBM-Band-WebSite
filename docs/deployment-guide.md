# Deployment Guide

How the WBM Band site gets from the repo to **wbmband.com** (production) and to the GitHub Pages
staging mirror.

## Overview

| Environment    | URL                     | How it is deployed                                                                | `baseURL`                                          |
| -------------- | ----------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Staging**    | GitHub Pages            | Automatic on push to `main` (CI builds from git)                                  | `/WBM-Band-WebSite/` (when `DEPLOY_TARGET=github`) |
| **Production** | https://www.wbmband.com | Manual: `npm run deploy:production` (build + `rsync` to the VPS, nginx serves it) | `/` (when `DEPLOY_TARGET` is unset)                |

Production is a static `npm run generate` output synced to `/var/www/wbmband` on the OVH VPS.
**nginx** serves it; its config is versioned in [`deploy/nginx/`](../deploy/nginx/README.md) (that
directory is the source of truth for the production routing contract: apex to www, `/ua/*` to
`/*`, trailing-slash and `/index.html` twins, real 404s, cache and security headers).
`public/.htaccess` and `public/_redirects` are legacy/fallback only (old shared host and the
GitHub Pages copy); nginx does not read them.

The earlier FTP deploy (`scripts/deploy-production.js`, `basic-ftp`) was removed. The old shared
hosting copy is no longer served.

## One `nuxt.config.ts`, two targets

`nuxt.config.ts` switches paths with `process.env.DEPLOY_TARGET`:

```ts
app: {
  baseURL: process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite/' : '/'
}
```

Every favicon/meta `href` uses the same conditional prefix. `npm run deploy:github` sets
`DEPLOY_TARGET=github`; all other builds use root-relative paths that work on `wbmband.com`.

> **Staging vs production build steps.** `deploy:github` runs only `generate:base` (`nuxt generate`).
> It intentionally omits `generate-sitemap.js` and `generate-bio-links.js`: both bake in the
> canonical production URL, so they only run in the full `npm run generate` used for production.
> See [build-pipeline.md](./build-pipeline.md) for what the build does end to end.

## Standard flow

```bash
npm run dev                    # 1. work locally
git push                       # 2. push to main: GitHub Pages (staging) rebuilds from git
# 3. check the staging copy, then:
npm run deploy:production      # 4. build + rsync to the VPS
```

> `deploy:production` builds from the **working tree**, not from git. Uncommitted changes ship.
> Run `git status` first and reconcile.

## Production deploy (`npm run deploy:production`)

Runs `npm run build:production` (= `npm run generate`) and then
[`scripts/deploy-production-vps.sh`](../scripts/deploy-production-vps.sh), which:

1. Refuses to run if `.output/public/index.html` is missing, if `DEPLOY_PATH` is not under
   `/var/www/`, or if the source directory does not exist.
2. `rsync -az --delete`s `.output/public/` to `DEPLOY_PATH` over SSH (permissions set with
   `--chmod=D755,F644`). `--delete` removes anything on the server that is not in the build, so a
   deleted page disappears on the next deploy. `.well-known/` is excluded and survives.
3. Hides unreferenced source image originals (`--filter 'H ...'` rules in the script: `images/hero-images/`,
   `about-us-images/`, `our-team/`, `albums-images/*/cover.*`) from rsync, so they are neither uploaded nor kept on
   the server (`--delete` removes old copies). The site only requests `images/optimized/*` plus the
   `*-blurred.*` placeholders, icons, logos and meta-images; verified against the built HTML/JS (full output 541 MB,
   deployed 117 MB). Original sources stay in `public/images/` for `npm run compress-images`.
4. Prints the HTTP status of `https://www.wbmband.com/`.

### Configuration

Set in the environment or in `.env.production` (gitignored, loaded by the script):

| Variable          | Default             | Description                                     |
| ----------------- | ------------------- | ----------------------------------------------- |
| `DEPLOY_SSH_HOST` | `151.80.140.64`     | VPS host                                        |
| `DEPLOY_SSH_USER` | `root`              | SSH user (will move to a dedicated deploy user) |
| `DEPLOY_SSH_KEY`  | `~/.ssh/wbm_deploy` | SSH private key                                 |
| `DEPLOY_PATH`     | `/var/www/wbmband`  | Remote web root; must match `/var/www/?*`       |

### Dry run

```bash
DRY_RUN=1 bash scripts/deploy-production-vps.sh
```

Shows what would change (`rsync -n -i`) and uploads nothing. Use it before any deploy that
deletes or renames pages.

### Deploy only (no build)

```bash
bash scripts/deploy-production-vps.sh
```

Re-syncs the existing `.output/public/`.

## Changing nginx

Edit `deploy/nginx/wbm-site.conf` / `wbm-site-headers.conf` and follow the apply and smoke-test
steps in [`deploy/nginx/README.md`](../deploy/nginx/README.md). Keep the repo files and the server in
sync; the repo is the source of truth.

## Troubleshooting

| Symptom                                    | Check                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `index.html missing`                       | Run `npm run build:production` first.                                                                      |
| `Permission denied (publickey)`            | `DEPLOY_SSH_KEY` points at the right key and the server has its public half in `authorized_keys`.          |
| Page deployed but not updating in browser  | Hard refresh. HTML is revalidated; hashed `_nuxt/*` assets are immutable. Check `curl -sI` cache headers.  |
| A URL 404s on production but works locally | It is not in the prerender list (`nitro.prerender.routes`) so no file was generated. See `add-page-route`. |
| Unexpected redirects                       | The rules live in `deploy/nginx/`, not in `.htaccess`.                                                     |
| Share URL previews wrong                   | Release pages are prerendered per slug and source prefix; regenerate and redeploy.                         |

## Security notes

- Never commit `.env.production` (gitignored along with `.env*`). Verify with `git status`.
- The deploy key gives write access to the web root; keep it local.
- `DEPLOY_PATH` is validated by the script, but `--delete` is still destructive: use `DRY_RUN=1` when
  in doubt.

## Related documentation

- [Build pipeline](./build-pipeline.md)
- [Performance Optimization](./performance-optimization.md)
- [Image Optimization Guide](./image-optimization-guide.md)
- [Search Console](./search-console.md)
