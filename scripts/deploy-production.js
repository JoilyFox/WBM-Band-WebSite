#!/usr/bin/env node

/**
 * Production Deployment Script for wbmband.com
 *
 * This script deploys the built Nuxt.js site to the production FTP server.
 *
 * Prerequisites:
 * - Run `npm run generate` first to build the site
 * - Configure FTP credentials in .env.production
 *
 * Usage:
 * - node scripts/deploy-production.js
 * - npm run deploy:production (builds and deploys automatically)
 */

import dotenv from 'dotenv'
import FtpDeploy from 'ftp-deploy'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.production') })

const ftpDeploy = new FtpDeploy()

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

console.log(`\n${colors.bright}${colors.cyan}🚀 WBM Band - Production Deployment${colors.reset}\n`)
console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)

// Check if build exists
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
  const manifestContent = fs.readFileSync(manifestPath, 'utf8')
  const manifest = JSON.parse(manifestContent)

  // Update paths to remove GitHub Pages base URL
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

// FTP Configuration
const config = {
  user: process.env.FTP_USERNAME,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: parseInt(process.env.FTP_PORT) || 21,
  localRoot: buildPath,
  remoteRoot: process.env.FTP_ROOT || '/home/wbmband/wbmband.com/www/',
  include: ['*', '**/*'],
  exclude: ['.git', '.github', 'node_modules', '.DS_Store', 'Thumbs.db'],
  deleteRemote: process.env.DELETE_REMOTE === 'true',
  forcePasv: true,
  sftp: false
}

// Validate credentials
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
  `${colors.green}✓${colors.reset} Delete Remote: ${colors.cyan}${config.deleteRemote ? 'Yes' : 'No'}${colors.reset}`
)
console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
console.log(`${colors.yellow}📡 Connecting to FTP server...${colors.reset}\n`)

// Track upload progress
let uploadedCount = 0
let totalFiles = 0
let lastProgress = 0

ftpDeploy.on('uploading', (data) => {
  uploadedCount = data.transferredFileCount
  totalFiles = data.totalFilesCount

  const progress = Math.round((uploadedCount / totalFiles) * 100)

  // Only log every 5% to avoid spam
  if (progress >= lastProgress + 5 || progress === 100) {
    const fileName = data.filename.length > 50 ? '...' + data.filename.slice(-47) : data.filename

    console.log(
      `${colors.cyan}[${progress}%]${colors.reset} ` +
        `${colors.yellow}${uploadedCount}${colors.reset}/${colors.yellow}${totalFiles}${colors.reset} - ` +
        `${fileName}`
    )
    lastProgress = progress
  }
})

ftpDeploy.on('uploaded', (data) => {
  // Silent - we're already tracking in 'uploading'
})

ftpDeploy.on('log', (data) => {
  // Uncomment for debugging:
  // console.log(`${colors.blue}[LOG]${colors.reset} ${data}`);
})

// Start deployment
ftpDeploy
  .deploy(config)
  .then(() => {
    console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
    console.log(
      `${colors.bright}${colors.green}✅ Deployment completed successfully!${colors.reset}\n`
    )
    console.log(`${colors.green}🌐 Your site is now live at:${colors.reset}`)
    console.log(`   ${colors.bright}${colors.cyan}https://wbmband.com${colors.reset}\n`)
    console.log(`${colors.yellow}📊 Summary:${colors.reset}`)
    console.log(`   Files uploaded: ${colors.cyan}${totalFiles}${colors.reset}`)
    console.log(`   Remote path: ${colors.cyan}${config.remoteRoot}${colors.reset}\n`)
    console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
  })
  .catch((err) => {
    console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
    console.error(`${colors.bright}${colors.red}❌ Deployment failed!${colors.reset}\n`)
    console.error(`${colors.red}Error:${colors.reset} ${err.message}\n`)

    if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
      console.log(`${colors.yellow}💡 Troubleshooting tips:${colors.reset}`)
      console.log(`   1. Check your internet connection`)
      console.log(`   2. Verify FTP_HOST in .env.production`)
      console.log(`   3. Check if your hosting firewall allows FTP connections\n`)
    } else if (err.message.includes('530') || err.message.includes('Login incorrect')) {
      console.log(`${colors.yellow}💡 Troubleshooting tips:${colors.reset}`)
      console.log(`   1. Verify FTP_USERNAME in .env.production`)
      console.log(`   2. Verify FTP_PASSWORD in .env.production`)
      console.log(`   3. Check if your FTP account is active\n`)
    } else if (err.message.includes('550')) {
      console.log(`${colors.yellow}💡 Troubleshooting tips:${colors.reset}`)
      console.log(`   1. Verify FTP_ROOT path in .env.production`)
      console.log(`   2. Check folder permissions on the server`)
      console.log(`   3. Make sure the remote directory exists\n`)
    }

    console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`)
    process.exit(1)
  })
