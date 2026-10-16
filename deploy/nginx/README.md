# Production nginx config (www.wbmband.com)

The production site is the static `npm run generate` output, synced by
`scripts/deploy-production-vps.sh` to `/var/www/wbmband` on the OVH VPS (151.80.140.64).
The VPS also hosts `app.`, `ops.` and `affine.wbmband.com`; those have their own server
blocks and are not managed here.

| Repo file               | Server path                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `wbm-site.conf`         | `/etc/nginx/sites-available/wbm-site` (symlinked into `sites-enabled`) |
| `wbm-site-headers.conf` | `/etc/nginx/snippets/wbm-site-headers.conf`                            |

These files are the source of truth for the production routing contract: apex → www,
`/ua/*` → `/*`, no trailing slash, `/index.html` and `//` twins → clean URL, real 404s, and the cache and security
headers. Keep them in sync with the server. `public/.htaccess` and `public/_redirects` only
cover the legacy shared host and the GitHub Pages staging copy.

Brotli comes from the `libnginx-mod-http-brotli-filter` and `libnginx-mod-http-brotli-static`
packages.

## Apply a change

```bash
KEY=~/.ssh/wbm_deploy; H=root@151.80.140.64
scp -i $KEY deploy/nginx/wbm-site.conf $H:/tmp/wbm-site.new
scp -i $KEY deploy/nginx/wbm-site-headers.conf $H:/tmp/wbm-site-headers.new
ssh -i $KEY $H 'B=/root/nginx-backup-$(date +%Y%m%d-%H%M%S); mkdir -p $B &&
  cp -a /etc/nginx/sites-available/wbm-site /etc/nginx/snippets/wbm-site-headers.conf $B/ &&
  install -m644 /tmp/wbm-site-headers.new /etc/nginx/snippets/wbm-site-headers.conf &&
  install -m644 /tmp/wbm-site.new /etc/nginx/sites-available/wbm-site &&
  nginx -t && systemctl reload nginx'
```

If `nginx -t` fails, copy the files back from the backup directory it printed and reload.

## Smoke test after a change

```bash
for u in / /en /listen/khvyli /random-xyz /_nuxt/nope.js /index.html /listen/ /ua/listen/khvyli; do
  printf '%-22s ' $u; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.wbmband.com$u
done
```

Expected results:

- Pages return 200.
- Unknown URLs and assets return 404.
- `/index.html`, `/listen/` and `/ua/...` return 301.
- `curl -sI` on `/` shows `content-encoding: br` (when `Accept-Encoding: br` is sent) and the security headers.

## Why there is no SPA fallback

Every route is prerendered. The old catch-all `try_files ... /200.html` returned 200 for
typos, unknown slugs and missing `/_nuxt/*.js` chunks. Google treated those as soft 404s, and a
stale chunk came back as HTML, which broke Nuxt's chunk-reload recovery. Unknown URLs now get
status 404 with `404.html` (Nuxt's SPA shell), which still renders the localized error page
on the client.
