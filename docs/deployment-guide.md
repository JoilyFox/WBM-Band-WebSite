# Production Deployment Guide

This guide explains how to deploy the WBM Band website to your production hosting at **wbmband.com** using manual local deployment.

## Overview

The deployment system allows you to:

- ✅ **Test on GitHub Pages** first (automatic on push)
- ✅ **Deploy to production manually** when ready (one command)
- ✅ **Full control** over when updates go live
- ✅ **Reuse a single Nuxt config** while targeting different environments

## Architecture

### Deployment Targets

| Environment    | URL          | Deployment           | `baseURL` setting                                  |
| -------------- | ------------ | -------------------- | -------------------------------------------------- |
| **Testing**    | GitHub Pages | Automatic on push    | `/WBM-Band-WebSite/` (when `DEPLOY_TARGET=github`) |
| **Production** | wbmband.com  | Manual local command | `/` (when `DEPLOY_TARGET` is unset)                |

### Configuration Strategy

We use a single `nuxt.config.ts` file and switch paths with an environment variable:

```ts
// nuxt.config.ts (excerpt)
export default defineNuxtConfig({
  app: {
    baseURL: process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite/' : '/',
    head: {
      link: [
        {
          rel: 'icon',
          href: `${process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : ''}/favicon.ico`
        }
        // ...other head assets follow the same pattern
      ]
    }
  }
})
```

- When you run `npm run deploy:github`, the script sets `DEPLOY_TARGET=github`, so Nuxt generates GitHub Pages–compatible URLs.
- For local development and production builds, `DEPLOY_TARGET` is undefined, so assets use root-relative paths that work on `wbmband.com`.

---

## Initial Setup

### 1. Configure FTP Credentials

Edit the `.env.production` file with your FTP credentials:

```env
# FTP Server Configuration
FTP_HOST=wbmband.ftp.tools
FTP_USERNAME=wbmband_ftp
FTP_PASSWORD=your_actual_password_here
FTP_PORT=21
FTP_ROOT=/home/wbmband/

# Deployment Settings
DELETE_REMOTE=false
```

**Important:**

- ⚠️ Replace `your_actual_password_here` with your real FTP password
- ⚠️ This file is ignored by git (never commit passwords!)
- ✅ Keep this file secure on your local machine

### 2. Verify DNS Configuration

Make sure your domain `wbmband.com` points to your hosting server:

**In your ukraine.com.ua control panel:**

1. Go to **DNS Management**
2. Add/verify these DNS records:

```
Type: A
Host: @
Value: [Your hosting IP address]
TTL: 3600

Type: A
Host: www
Value: [Your hosting IP address]
TTL: 3600
```

**Note:** Ask ukraine.com.ua support for your server's IP address if needed.

⏱️ DNS changes can take 4-48 hours to propagate globally.

---

## Deployment Workflow

### Standard Development Flow

```bash
# 1. Make changes to your code
# 2. Test locally
npm run dev

# 3. Commit and push to GitHub (deploys to GitHub Pages for testing)
git add .
git commit -m "Update content"
git push

# 4. Test on GitHub Pages
# Visit: https://joilyfox.github.io/WBM-Band-WebSite/

# 5. When satisfied, deploy to production
npm run deploy:production
```

### One-Command Production Deployment

```bash
npm run deploy:production
```

This command will:

1. ✅ Build the site using the default (root) `baseURL`
2. ✅ Connect to your FTP server
3. ✅ Upload all files to `/home/wbmband/`
4. ✅ Show upload progress with colored output
5. ✅ Confirm when deployment is complete

**Expected Output:**

```
🚀 WBM Band - Production Deployment
═══════════════════════════════════════════

✓ Build found: /path/to/.output/public
✓ FTP Host: wbmband.ftp.tools:21
✓ Remote Path: /home/wbmband/
✓ Delete Remote: No

═══════════════════════════════════════════

📡 Connecting to FTP server...

[5%] 12/245 - index.html
[10%] 25/245 - assets/main.css
[15%] 37/245 - images/hero.webp
...
[100%] 245/245 - site.webmanifest

═══════════════════════════════════════════

✅ Deployment completed successfully!

🌐 Your site is now live at:
   https://wbmband.com

📊 Summary:
   Uploaded:   245
   Skipped (unchanged): 0
   Total files: 245
   Remote path: /home/wbmband/

═══════════════════════════════════════════
```

---

## Manual Build Steps (Advanced)

If you want to build and deploy separately:

### Build Only

```bash
npm run build:production
```

This creates the production build in `.output/public/` using root-relative paths (same settings as `deploy:production`).

### Deploy Only

```bash
node scripts/deploy-production.js
```

This uploads the existing build to your FTP server.

---

## Configuration Files

### [`nuxt.config.ts`](../nuxt.config.ts)

- Single source of truth for both GitHub Pages and production
- Uses `DEPLOY_TARGET` to decide which path prefix to emit
- All meta tags and favicon links share the same conditional logic

### [`.env.production`](../.env.production)

FTP credentials (never committed):

```env
FTP_HOST=wbmband.ftp.tools
FTP_USERNAME=wbmband_ftp
FTP_PASSWORD=your_password
FTP_PORT=21
FTP_ROOT=/home/wbmband/
DELETE_REMOTE=false
```

### [`scripts/deploy-production.js`](../scripts/deploy-production.js)

Deployment script features (uploader built on [`basic-ftp`](https://www.npmjs.com/package/basic-ftp)):

- ✅ Validates build exists
- ✅ Checks FTP credentials
- ✅ Shows upload progress
- ✅ Colored terminal output
- ✅ Error handling with troubleshooting tips
- ✅ **Idle-socket timeout** — a hung passive data connection fails fast instead of stalling the whole run forever (the old `ftp-deploy`-based script had no timeout and would freeze mid-upload)
- ✅ **Per-file retry with reconnect** — transient drops recover automatically (default 8 attempts, tune via `FTP_RETRIES`)
- ✅ **Resumable** — files already on the server with a matching size are skipped, so re-running after an interruption doesn't re-upload everything
- ✅ **No pre-wipe** — files are uploaded in place (no downtime window); with `DELETE_REMOTE=true`, orphaned remote files are cleaned up only _after_ a fully successful upload

---

## Troubleshooting

### Error: Build not found

**Problem:**

```
❌ Error: Build not found!
```

**Solution:**
Run the build command first:

```bash
npm run build:production
```

---

### Error: Missing FTP credentials

**Problem:**

```
❌ Error: Missing FTP credentials!
```

**Solution:**

1. Check that `.env.production` exists
2. Verify all required fields are filled:
   - `FTP_HOST`
   - `FTP_USERNAME`
   - `FTP_PASSWORD`
   - `FTP_ROOT`

---

### Error: Connection timeout (ETIMEDOUT)

**Problem:**

```
❌ Deployment failed!
Error: ETIMEDOUT
```

**Solutions:**

1. Check your internet connection
2. Verify `FTP_HOST` is correct in `.env.production`
3. Check if your hosting firewall allows **passive** FTP data connections
4. Just **re-run `npm run deploy:production`** — the deploy resumes and skips files already uploaded, so an interrupted run continues instead of starting over
5. If transfers stall often, raise `FTP_TIMEOUT` / `FTP_RETRIES` in `.env.production`

---

### Error: Login incorrect (530)

**Problem:**

```
❌ Deployment failed!
Error: 530 Login incorrect
```

**Solutions:**

1. Double-check `FTP_USERNAME` in `.env.production`
2. Verify `FTP_PASSWORD` is correct (no extra spaces)
3. Confirm your FTP account is active in hosting control panel
4. Check if you need to enable FTP access in your hosting settings

---

### Error: Directory not found (550)

**Problem:**

```
❌ Deployment failed!
Error: 550 Directory not found
```

**Solutions:**

1. Verify `FTP_ROOT` path in `.env.production`
2. Check that `/home/wbmband/` exists on the server
3. Ensure you have write permissions to the directory
4. Try using the full path from your hosting control panel

---

### Files not updating on website

**Problem:**
Deployed successfully but changes don't appear on wbmband.com

**Solutions:**

1. **Clear browser cache:**
   - Chrome: `Ctrl/Cmd + Shift + R` (hard refresh)
   - Firefox: `Ctrl/Cmd + F5`
   - Safari: `Cmd + Option + R`

2. **Wait for CDN cache:**
   - If your hosting uses CDN, wait 5-10 minutes
   - Check hosting control panel for cache purge option

3. **Verify upload:**
   - Check your hosting File Manager
   - Confirm files in `/home/wbmband/` are updated
   - Look at file modification timestamps

4. **Check DNS:**
   - Run: `nslookup wbmband.com`
   - Ensure it points to your hosting IP

---

### Site shows 404 errors

**Problem:**
Main page loads but other pages show 404

**Solutions:**

1. **Check server configuration:**
   - Nuxt generates a static site (SSG)
   - Server must support `index.html` fallback
   - Contact ukraine.com.ua support if needed

2. **Verify all files uploaded:**
   - Check upload log for errors
   - Ensure all HTML files are present
   - Look for upload interruptions

3. **Check .htaccess file:**
   - If using Apache, you might need URL rewrite rules
   - Create `.htaccess` in your root:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [L]
   ```

---

## Best Practices

### 1. Always Test Before Production

```bash
# Push to GitHub first
git push

# Test on GitHub Pages
# https://joilyfox.github.io/WBM-Band-WebSite/

# Only deploy to production when satisfied
npm run deploy:production
```

### 2. Create Backups

Before major deployments:

```bash
# Option 1: Download via FTP client (FileZilla, Cyberduck)
# Option 2: Use hosting control panel backup feature
# Option 3: Keep old builds locally
```

### 3. Incremental & Resumable Updates

Every deploy is now incremental: the uploader skips any file already on the server with a matching size, so unchanged files cost nothing and an interrupted run can simply be re-run to **resume where it left off** (no need to start over).

Set `DELETE_REMOTE=false` (default) to leave stale/orphaned remote files in place — harmless for a static site (old hashed `_nuxt/*` chunks just sit unused) and the fastest, safest option.

Set `DELETE_REMOTE=true` to also remove orphaned remote files (those no longer present in the local build). This cleanup runs **after** a fully successful upload — the live site is never wiped first, so there's no downtime window even on a clean-slate deploy.

> Tuning: if your network is flaky you can raise `FTP_RETRIES` or `FTP_TIMEOUT` in `.env.production` (see the Environment Variables Reference). For an FTPS server, set `FTP_SECURE=true`.

### 4. Monitor Deployment

Watch the upload progress:

- Check file count matches your build
- Verify no upload errors
- Confirm success message appears

### 5. Post-Deployment Verification

After deployment:

1. ✅ Visit https://wbmband.com
2. ✅ Test all pages and links
3. ✅ Check images load correctly
4. ✅ Verify mobile responsiveness
5. ✅ Test multi-language switching

---

## Environment Variables Reference

### `.env.production`

| Variable        | Required | Description                                                                     | Example                |
| --------------- | -------- | ------------------------------------------------------------------------------- | ---------------------- |
| `FTP_HOST`      | ✅ Yes   | FTP server hostname                                                             | `wbmband.ftp.tools`    |
| `FTP_USERNAME`  | ✅ Yes   | FTP login username                                                              | `wbmband_ftp`          |
| `FTP_PASSWORD`  | ✅ Yes   | FTP password                                                                    | `your_secure_password` |
| `FTP_PORT`      | ❌ No    | FTP port (default: 21)                                                          | `21`                   |
| `FTP_ROOT`      | ✅ Yes   | Remote directory path                                                           | `/home/wbmband/`       |
| `DELETE_REMOTE` | ❌ No    | Remove orphaned remote files after a successful upload (default: false)         | `false`                |
| `FTP_SECURE`    | ❌ No    | Use FTPS over TLS (default: false)                                              | `false`                |
| `FTP_TIMEOUT`   | ❌ No    | Idle-socket timeout in ms before a stalled transfer is retried (default: 30000) | `30000`                |
| `FTP_RETRIES`   | ❌ No    | Per-file retry attempts before giving up (default: 8)                           | `8`                    |

---

## NPM Scripts Reference

| Command                             | Description                  | When to Use              |
| ----------------------------------- | ---------------------------- | ------------------------ |
| `npm run dev`                       | Start local dev server       | Local development        |
| `npm run generate`                  | Build for GitHub Pages       | Testing deployment       |
| `npm run build:production`          | Build for production         | Before manual deploy     |
| `npm run deploy:production`         | Build + deploy to production | Push to live site        |
| `node scripts/deploy-production.js` | Deploy only (no build)       | Re-upload existing build |

---

## File Structure

```
WBM-Band-WebSite/
├── .env.production              # FTP credentials (not committed)
├── nuxt.config.ts               # Shared config (switches via DEPLOY_TARGET)
├── package.json                 # NPM scripts
├── .gitignore                   # Excludes .env.production
├── scripts/
│   └── deploy-production.js     # FTP deployment script
└── docs/
   └── deployment-guide.md      # This file
```

---

## Security Notes

### ⚠️ Never Commit Credentials

The `.gitignore` file is configured to exclude:

```
.env
.env.production
.env.local
.env.*.local
*.env
```

**Always verify before committing:**

```bash
git status
# Make sure .env.production is NOT listed
```

### 🔒 Credential Storage

- ✅ Keep `.env.production` on your local machine only
- ✅ Store a backup in a secure password manager
- ✅ Use strong FTP passwords
- ❌ Never share credentials via email/chat
- ❌ Never commit to public repositories

### 🛡️ FTP Security

Consider these security improvements:

1. **Use SFTP instead of FTP** (if hosting supports it)
   - Set `FTP_PORT=22` in `.env.production`
   - More secure encryption
2. **Change FTP password regularly**
3. **Restrict FTP access by IP** (if hosting allows)
4. **Use separate FTP accounts** for different team members

---

## Support & Resources

### Hosting Support

- **ukraine.com.ua Support**: Contact for hosting-specific issues
- **FTP Issues**: Check control panel or contact support
- **DNS Configuration**: Get help from hosting support team

### Project Support

- **GitHub Repository**: [JoilyFox/WBM-Band-WebSite](https://github.com/JoilyFox/WBM-Band-WebSite)
- **Documentation**: Check [`docs/`](../docs/) folder for feature guides
- **Issues**: Report bugs via GitHub Issues

### Related Documentation

- [Performance Optimization](./performance-optimization.md)
- [Image Optimization Guide](./image-optimization-guide.md)
- [Error Page System](./error-page-system.md)
- [Global Loading System](./global-loading-system.md)

---

## Quick Reference Card

**🚀 Deploy to Production:**

```bash
npm run deploy:production
```

**🧪 Test on GitHub Pages:**

```bash
git push
# Visit: https://joilyfox.github.io/WBM-Band-WebSite/
```

**📁 FTP Credentials:**

```
File: .env.production
Location: Project root (not committed)
```

**🌐 Production URL:**

```
https://wbmband.com
```

**⚙️ Configuration:**

```
All targets: nuxt.config.ts (set DEPLOY_TARGET=github for GitHub Pages)
```

---

_Last updated: October 27, 2025_
