#!/usr/bin/env node

/**
 * Production Deployment Script for wbmband.com
 *
 * Deploys the built Nuxt.js site to the production FTP server.
 *
 * Reliability model (why this no longer stalls forever):
 * - Uses `basic-ftp` with an IDLE-SOCKET TIMEOUT, so a hung passive data
 *   connection fails fast instead of blocking the whole run indefinitely.
 * - Each file upload is RETRIED with a fresh reconnection on any error or
 *   timeout (transient network/firewall drops recover automatically).
 * - Uploads are RESUMABLE: a file already on the server with a matching size
 *   is skipped, so re-running after an interruption doesn't re-upload
 *   everything. A single backstop watchdog guards against a transfer that
 *   never errors but also never finishes.
 * - The remote is NO LONGER wiped before upload. Files are uploaded in place
 *   (no downtime window). When DELETE_REMOTE=true, orphaned remote files are
 *   removed AFTER a fully successful upload as a best-effort cleanup.
 *
 * Prerequisites:
 * - Run `npm run generate` first to build the site.
 * - Configure FTP credentials in .env.production.
 *
 * Usage:
 * - node scripts/deploy-production.js
 * - npm run deploy:production (builds and deploys automatically)
 *
 * Optional .env.production tuning keys:
 * - FTP_PORT      (default 21)
 * - FTP_ROOT      (default /home/wbmband/wbmband.com/www/)
 * - DELETE_REMOTE (default false; 'true' enables post-upload orphan cleanup)
 * - FTP_SECURE    (default false; 'true' for FTPS over TLS)
 * - FTP_TIMEOUT   (idle-socket timeout in ms, default 30000)
 * - FTP_RETRIES   (per-file retry attempts, default 8)
 */

import dotenv from 'dotenv'
import { Client } from 'basic-ftp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.production') })

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Reject if `promise` doesn't settle within `ms` — a backstop against a
 *  transfer that neither errors nor completes (the classic FTP "hang"). */
function withTimeout(promise, ms, label) {
  let timer
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer))
}

/** Recursively collect every file under `dir`, returning POSIX-style paths
 *  relative to `dir` plus the file size (used for resume + progress). */
function walkLocal(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let files = []
  for (const entry of entries) {
    if (EXCLUDE_NAMES.has(entry.name)) continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(walkLocal(abs, base))
    } else if (entry.isFile()) {
      const rel = path.relative(base, abs).split(path.sep).join('/')
      files.push({ localPath: abs, rel, size: fs.statSync(abs).size })
    }
  }
  return files
}

const EXCLUDE_NAMES = new Set(['.git', '.github', 'node_modules', '.DS_Store', 'Thumbs.db'])

/**
 * Files that must ALWAYS be re-uploaded (never skipped by the size check).
 *
 * Resume-by-size is only safe for content-addressed, immutable assets — i.e.
 * `_nuxt/*` chunks, whose filename IS a content hash (same name ⟹ same bytes).
 * HTML and `_payload.json` are NOT content-addressed: their names are stable but
 * their contents change every build because they embed the (fixed-length) hashes
 * of the chunk graph. So a new build's HTML is usually byte-identical in SIZE to
 * the old one while pointing at completely different chunks. Skipping it by size
 * leaves STALE HTML on the server referencing a chunk graph that the orphan
 * cleanup may have just deleted — a broken site. Always push these.
 */
const ALWAYS_UPLOAD = /\.(html|json|xml|txt|webmanifest)$/i
function mustReupload(name) {
  return ALWAYS_UPLOAD.test(name) || name === '.htaccess'
}

console.log(`\n${colors.bright}${colors.cyan}🚀 WBM Band - Production Deployment${colors.reset}\n`)
console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)

// --- Pre-upload preparation -------------------------------------------------

const buildPath = path.join(__dirname, '../.output/public')
if (!fs.existsSync(buildPath)) {
  console.error(`${colors.red}❌ Error: Build not found!${colors.reset}`)
  console.log(`\n${colors.yellow}Please run the build command first:${colors.reset}`)
  console.log(`  ${colors.cyan}npm run generate${colors.reset}\n`)
  process.exit(1)
}

// Copy 200.html to index.html for traditional hosting compatibility
const file200 = path.join(buildPath, '200.html')
const indexFile = path.join(buildPath, 'index.html')
if (fs.existsSync(file200) && !fs.existsSync(indexFile)) {
  console.log(`${colors.yellow}📝 Creating index.html from 200.html...${colors.reset}`)
  fs.copyFileSync(file200, indexFile)
  console.log(`${colors.green}✓${colors.reset} index.html created\n`)
}

// Fix site.webmanifest for production (remove GitHub Pages paths)
const manifestPath = path.join(buildPath, 'site.webmanifest')
if (fs.existsSync(manifestPath)) {
  console.log(`${colors.yellow}📝 Fixing site.webmanifest paths for production...${colors.reset}`)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.start_url = '/'
  if (manifest.icons) {
    manifest.icons = manifest.icons.map((icon) => ({
      ...icon,
      src: icon.src.replace('/WBM-Band-WebSite', '')
    }))
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`${colors.green}✓${colors.reset} site.webmanifest updated\n`)
}

// --- Configuration ----------------------------------------------------------

const config = {
  user: process.env.FTP_USERNAME,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: parseInt(process.env.FTP_PORT, 10) || 21,
  secure: process.env.FTP_SECURE === 'true',
  remoteRoot: (process.env.FTP_ROOT || '/home/wbmband/wbmband.com/www/').replace(/\/+$/, '') || '/',
  deleteRemote: process.env.DELETE_REMOTE === 'true',
  timeout: parseInt(process.env.FTP_TIMEOUT, 10) || 30000,
  retries: parseInt(process.env.FTP_RETRIES, 10) || 8
}

if (!config.user || !config.password || !config.host) {
  console.error(`${colors.red}❌ Error: Missing FTP credentials!${colors.reset}\n`)
  console.log(`${colors.yellow}Please configure .env.production with:${colors.reset}`)
  console.log(`  ${colors.cyan}FTP_HOST${colors.reset}=your_ftp_host`)
  console.log(`  ${colors.cyan}FTP_USERNAME${colors.reset}=your_username`)
  console.log(`  ${colors.cyan}FTP_PASSWORD${colors.reset}=your_password`)
  console.log(`  ${colors.cyan}FTP_ROOT${colors.reset}=/home/wbmband/\n`)
  process.exit(1)
}

console.log(
  `${colors.green}✓${colors.reset} Build found: ${colors.cyan}${buildPath}${colors.reset}`
)
console.log(
  `${colors.green}✓${colors.reset} FTP Host: ${colors.cyan}${config.host}:${config.port}${colors.reset}`
)
console.log(
  `${colors.green}✓${colors.reset} Remote Path: ${colors.cyan}${config.remoteRoot}${colors.reset}`
)
console.log(
  `${colors.green}✓${colors.reset} Delete Remote: ${colors.cyan}${config.deleteRemote ? 'Yes (orphan cleanup after upload)' : 'No'}${colors.reset}`
)
console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)

// --- Deployment -------------------------------------------------------------

/** Join the remote root with a POSIX relative path. */
const remotePathOf = (rel) => `${config.remoteRoot}/${rel}`.replace(/\/{2,}/g, '/')

let client = null

async function connect() {
  if (client) {
    try {
      client.close()
    } catch {
      // ignore — replacing a dead connection
    }
  }
  client = new Client(config.timeout)
  client.ftp.verbose = false
  await client.access({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    secure: config.secure
  })
}

let lastEnsuredDir = null

/** Upload one file by its ABSOLUTE remote path, retrying with a full
 *  reconnect on any error/timeout. The parent directory is (re-)ensured each
 *  attempt because a reconnect resets server state we relied on, and an
 *  absolute STOR path means the upload never depends on the working dir. */
async function uploadFileWithRetry(remoteDir, localPath, remotePath, sizeForBackstop) {
  const label = path.posix.basename(remotePath)
  // Idle-socket timeout catches stalls; this generous total backstop catches a
  // transfer that keeps the socket warm but never finishes.
  const backstop = Math.max(120000, Math.ceil(sizeForBackstop / 1024) * 200)
  let lastErr
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      if (lastEnsuredDir !== remoteDir) {
        await withTimeout(client.ensureDir(remoteDir), config.timeout, `ensureDir ${remoteDir}`)
        lastEnsuredDir = remoteDir
      }
      await withTimeout(client.uploadFrom(localPath, remotePath), backstop, `upload ${label}`)
      return
    } catch (err) {
      lastErr = err
      if (attempt === config.retries) break
      const wait = Math.min(1500 * attempt, 8000)
      console.log(
        `${colors.yellow}  ↻ retry ${attempt}/${config.retries - 1} for ${label}: ${err.message} — reconnecting in ${wait}ms${colors.reset}`
      )
      await sleep(wait)
      lastEnsuredDir = null
      try {
        await connect()
      } catch (reconnectErr) {
        lastErr = reconnectErr
      }
    }
  }
  throw new Error(
    `Failed to upload "${label}" after ${config.retries} attempts: ${lastErr?.message}`
  )
}

/** List a remote dir into a { name -> size } map for resume decisions.
 *  Returns an empty map if the dir doesn't exist yet (first deploy). */
async function remoteSizeMap(remoteDir) {
  try {
    const list = await withTimeout(client.list(remoteDir), config.timeout, `list ${remoteDir}`)
    const map = new Map()
    for (const item of list) {
      if (item.isFile) map.set(item.name, item.size)
    }
    return map
  } catch {
    return new Map()
  }
}

/** Recursively collect remote file paths (relative to remoteRoot) for cleanup. */
async function collectRemoteFiles(absDir, relBase = '') {
  let files = []
  let list
  try {
    list = await withTimeout(client.list(absDir), config.timeout, `list ${absDir}`)
  } catch {
    return files
  }
  for (const item of list) {
    if (item.name === '.' || item.name === '..') continue
    const rel = relBase ? `${relBase}/${item.name}` : item.name
    if (item.isDirectory) {
      files = files.concat(await collectRemoteFiles(`${absDir}/${item.name}`, rel))
    } else if (item.isFile) {
      files.push(rel)
    }
  }
  return files
}

async function deploy() {
  console.log(`${colors.yellow}🔎 Scanning build output...${colors.reset}`)
  const files = walkLocal(buildPath)
  if (files.length === 0) {
    throw new Error(`No files found in ${buildPath} — refusing to deploy an empty build.`)
  }
  // Group by remote directory so ensureDir + listing happen once per directory.
  const byDir = new Map()
  for (const f of files) {
    const remoteDir = path.posix.dirname(remotePathOf(f.rel))
    if (!byDir.has(remoteDir)) byDir.set(remoteDir, [])
    byDir.get(remoteDir).push(f)
  }
  console.log(
    `${colors.green}✓${colors.reset} ${colors.yellow}${files.length}${colors.reset} files across ${colors.yellow}${byDir.size}${colors.reset} directories\n`
  )

  console.log(`${colors.yellow}📡 Connecting to FTP server...${colors.reset}\n`)
  await connect()

  let uploaded = 0
  let skipped = 0
  let processed = 0
  let lastProgress = 0
  const total = files.length

  for (const [remoteDir, dirFiles] of byDir) {
    await withTimeout(client.ensureDir(remoteDir), config.timeout, `ensureDir ${remoteDir}`)
    lastEnsuredDir = remoteDir
    const existing = await remoteSizeMap(remoteDir)

    for (const f of dirFiles) {
      const name = path.posix.basename(f.rel)
      // Skip only immutable, content-hashed assets whose size already matches;
      // always re-upload HTML/JSON/etc. so the server never serves stale markup.
      if (!mustReupload(name) && existing.get(name) === f.size) {
        skipped++
      } else {
        await uploadFileWithRetry(remoteDir, f.localPath, remotePathOf(f.rel), f.size)
        uploaded++
      }
      processed++

      const progress = Math.round((processed / total) * 100)
      if (progress >= lastProgress + 5 || processed === total) {
        const shown = f.rel.length > 50 ? '...' + f.rel.slice(-47) : f.rel
        console.log(
          `${colors.cyan}[${progress}%]${colors.reset} ` +
            `${colors.yellow}${processed}${colors.reset}/${colors.yellow}${total}${colors.reset} - ${shown}`
        )
        lastProgress = progress
      }
    }
  }

  // Best-effort orphan cleanup AFTER a fully successful upload, only when asked.
  let removed = 0
  if (config.deleteRemote) {
    console.log(`\n${colors.yellow}🧹 Cleaning up orphaned remote files...${colors.reset}`)
    try {
      const localSet = new Set(files.map((f) => f.rel))
      const remoteFiles = await collectRemoteFiles(config.remoteRoot)
      const orphans = remoteFiles.filter((rel) => !localSet.has(rel))
      for (const rel of orphans) {
        try {
          await withTimeout(client.remove(remotePathOf(rel)), config.timeout, `remove ${rel}`)
          removed++
        } catch (err) {
          console.log(`${colors.yellow}  ⚠ could not remove ${rel}: ${err.message}${colors.reset}`)
        }
      }
      console.log(`${colors.green}✓${colors.reset} Removed ${removed} orphaned file(s)`)
    } catch (err) {
      console.log(
        `${colors.yellow}  ⚠ Orphan cleanup skipped (non-fatal): ${err.message}${colors.reset}`
      )
    }
  }

  return { total, uploaded, skipped, removed }
}

deploy()
  .then(({ total, uploaded, skipped, removed }) => {
    try {
      client?.close()
    } catch {
      // already closed
    }
    console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
    console.log(
      `${colors.bright}${colors.green}✅ Deployment completed successfully!${colors.reset}\n`
    )
    console.log(`${colors.green}🌐 Your site is now live at:${colors.reset}`)
    console.log(`   ${colors.bright}${colors.cyan}https://wbmband.com${colors.reset}\n`)
    console.log(`${colors.yellow}📊 Summary:${colors.reset}`)
    console.log(`   Uploaded:   ${colors.cyan}${uploaded}${colors.reset}`)
    console.log(`   Skipped (unchanged): ${colors.cyan}${skipped}${colors.reset}`)
    if (config.deleteRemote) {
      console.log(`   Orphans removed: ${colors.cyan}${removed}${colors.reset}`)
    }
    console.log(`   Total files: ${colors.cyan}${total}${colors.reset}`)
    console.log(`   Remote path: ${colors.cyan}${config.remoteRoot}${colors.reset}\n`)
    console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
  })
  .catch((err) => {
    try {
      client?.close()
    } catch {
      // already closed
    }
    console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
    console.error(`${colors.bright}${colors.red}❌ Deployment failed!${colors.reset}\n`)
    console.error(`${colors.red}Error:${colors.reset} ${err.message}\n`)

    const msg = err.message || ''
    if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('timed out')) {
      console.log(`${colors.yellow}💡 Troubleshooting tips:${colors.reset}`)
      console.log(`   1. Check your internet connection`)
      console.log(`   2. Verify FTP_HOST in .env.production`)
      console.log(`   3. Check if your hosting firewall allows passive FTP data connections`)
      console.log(`   4. Re-run the same command — it resumes and skips files already uploaded\n`)
    } else if (msg.includes('530') || msg.includes('Login') || msg.includes('credentials')) {
      console.log(`${colors.yellow}💡 Troubleshooting tips:${colors.reset}`)
      console.log(`   1. Verify FTP_USERNAME in .env.production`)
      console.log(`   2. Verify FTP_PASSWORD in .env.production`)
      console.log(`   3. Check if your FTP account is active\n`)
    } else if (msg.includes('550')) {
      console.log(`${colors.yellow}💡 Troubleshooting tips:${colors.reset}`)
      console.log(`   1. Verify FTP_ROOT path in .env.production`)
      console.log(`   2. Check folder permissions on the server`)
      console.log(`   3. Make sure the remote directory exists\n`)
    } else {
      console.log(
        `${colors.yellow}💡 Re-run the same command — the deploy resumes and skips files already uploaded.${colors.reset}\n`
      )
    }

    console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
    process.exit(1)
  })
