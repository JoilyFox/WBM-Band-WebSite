#!/usr/bin/env bash
# Production deploy of the static site to the OVH VPS (nginx serves /var/www/wbmband).
# Replaces the old FTP deploy (removed), because wbmband.com now points at the VPS.
#
# Usage:  npm run deploy:production            (build + upload)
#         DRY_RUN=1 bash scripts/deploy-production-vps.sh   (show what would change, upload nothing)
# Config (env or .env.production): DEPLOY_SSH_HOST (default 151.80.140.64), DEPLOY_SSH_USER (root),
#         DEPLOY_SSH_KEY (~/.ssh/wbm_deploy), DEPLOY_PATH (/var/www/wbmband).
# See docs/deployment-guide.md.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env.production ] && { set -a; . ./.env.production; set +a; }
HOST="${DEPLOY_SSH_HOST:-151.80.140.64}"; USER_="${DEPLOY_SSH_USER:-root}"
KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/wbm_deploy}"; DEST="${DEPLOY_PATH:-/var/www/wbmband}"
SRC=".output/public/"

# `rsync --delete` empties DEST of everything not in SRC, so refuse anything that is
# not a directory strictly below /var/www/ (or that tries to climb out of it).
[[ "$DEST" == /var/www/?* && "$DEST" != *..* ]] || {
  echo "✗ DEPLOY_PATH must be a directory under /var/www/ (got '$DEST')"; exit 1; }
[ -d "$SRC" ] || { echo "✗ $SRC not found — run the build first (npm run build:production)"; exit 1; }
[ -f "${SRC}index.html" ] || { echo "✗ ${SRC}index.html missing — run the build first (npm run build:production)"; exit 1; }

# Deterministic permissions without a post-deploy `chmod -R` over SSH: normalise the
# build output (dirs 755, files 644) and also ask rsync to apply the same modes.
# (macOS' openrsync accepts --chmod but ignores it, hence the local chmod.)
chmod -R u=rwX,go=rX "$SRC"

SSH="ssh -i $KEY -o IdentitiesOnly=yes -o BatchMode=yes"
FLAGS=(-az --delete --human-readable --stats --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r)
# .well-known/ lives only on the server (ACME challenges etc.): never touch it.
FLAGS+=(--exclude '/.well-known/')
# Source image originals (public/images/<dir>/…) are inputs to `npm run compress-images`;
# the site only ever requests the generated files under images/optimized/ (plus the
# *-blurred.* placeholders, icons, logos and meta-images, which stay). `H` = hide from the
# sender only, so the files are not uploaded AND are removed from the server by --delete
# (a plain --exclude would leave stale copies there). Verified against the built HTML/JS:
# docs/deployment-guide.md.
FLAGS+=(
  --filter 'H /images/hero-images/'
  --filter 'H /images/about-us-images/'
  --filter 'H /images/our-team/'
  --filter 'H /images/albums-images/*/cover.*'
)
[ "${DRY_RUN:-}" = 1 ] && FLAGS+=(-n -i)
echo "▶ $SRC → $USER_@$HOST:$DEST ${DRY_RUN:+(dry run)}"
rsync "${FLAGS[@]}" -e "$SSH" "$SRC" "$USER_@$HOST:$DEST/"
if [ "${DRY_RUN:-}" != 1 ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' https://www.wbmband.com/ || true)
  echo "✓ deployed; https://www.wbmband.com/ → $code"
fi
