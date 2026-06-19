#!/usr/bin/env node

/**
 * Favicon Generator Script
 *
 * This script converts the source SVG favicon to all required favicon formats
 * including ICO, PNG, Apple Touch Icons, and generates necessary manifest files.
 *
 * Requirements:
 * - Node.js
 * - sharp (npm install sharp)
 *
 * Usage: npm run generate-favicons
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config = {
  // Browser-tab favicon source: the bare monogram on a transparent ground (the
  // historical look). Drives the small sizes a tab actually picks (≤ tabMaxSize)
  // plus favicon.ico and the linked SVG.
  tabSource: path.join(__dirname, '../public/favicon.svg'),
  // Search (Google) + mobile/PWA source: the white monogram on a solid black
  // square, so Google's circular crop renders a black disc with the white mark.
  // Google favours 48px-multiple icons, so everything ≥ 48 uses this.
  badgeSource: path.join(__dirname, '../assets/favicons/favicon-badge.svg'),
  // Largest icon still rendered from the tab (monogram) source; larger → badge.
  tabMaxSize: 32,
  // Logo glyph (white on transparent) used only for the Safari pinned tab.
  logoSilhouette: path.join(__dirname, '../public/images/wbm-logo-white.svg'),
  outputDir: path.join(__dirname, '../public'),
  baseURL: '/WBM-Band-WebSite', // GitHub Pages base URL
  sizes: {
    ico: [16, 32, 48],
    png: [16, 32, 48, 64, 96, 128, 152, 167, 180, 192, 256, 512],
    appleTouchIcon: [57, 60, 72, 76, 114, 120, 144, 152, 167, 180],
    androidChrome: [192, 512],
    msTile: [70, 150, 310]
  },
  colors: {
    themeColor: '#000000',
    msapplicationTileColor: '#000000',
    safariPinnedTabColor: '#000000'
  }
}

// Pick the artwork for a given pixel size: browser tabs grab the small icons
// (bare monogram), Google search + PWA grab ≥48 (the solid black badge).
const pngSourceFor = (size) => (size <= config.tabMaxSize ? config.tabSource : config.badgeSource)

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Convert SVG to PNG using Sharp
 */
async function svgToPng(inputPath, outputPath, size) {
  try {
    await sharp(inputPath).resize(size, size).png().toFile(outputPath)

    console.log(`✓ Generated ${path.basename(outputPath)} (${size}x${size})`)
    return true
  } catch (error) {
    console.error(`✗ Failed to generate ${path.basename(outputPath)}:`, error.message)
    return false
  }
}

/**
 * Generate PNG favicons
 */
async function generatePngFavicons() {
  console.log('\n📱 Generating PNG favicons...')

  const promises = config.sizes.png.map((size) =>
    svgToPng(pngSourceFor(size), path.join(config.outputDir, `favicon-${size}x${size}.png`), size)
  )

  await Promise.all(promises)
}

/**
 * Generate Apple Touch Icons
 */
async function generateAppleTouchIcons() {
  console.log('\n🍎 Generating Apple Touch Icons...')

  // Generate apple-touch-icon.png (default 180x180) — home-screen icon → badge.
  await svgToPng(config.badgeSource, path.join(config.outputDir, 'apple-touch-icon.png'), 180)

  // Generate various sizes
  const promises = config.sizes.appleTouchIcon.map((size) =>
    svgToPng(
      config.badgeSource,
      path.join(config.outputDir, `apple-touch-icon-${size}x${size}.png`),
      size
    )
  )

  await Promise.all(promises)
}

/**
 * Generate Android Chrome Icons
 */
async function generateAndroidIcons() {
  console.log('\n🤖 Generating Android Chrome Icons...')

  const promises = config.sizes.androidChrome.map((size) =>
    svgToPng(
      config.badgeSource,
      path.join(config.outputDir, `android-chrome-${size}x${size}.png`),
      size
    )
  )

  await Promise.all(promises)
}

/**
 * Generate Microsoft Tile Icons
 */
async function generateMsTileIcons() {
  console.log('\n🪟 Generating Microsoft Tile Icons...')

  // Generate mstile icons
  const promises = config.sizes.msTile.map((size) =>
    svgToPng(config.badgeSource, path.join(config.outputDir, `mstile-${size}x${size}.png`), size)
  )

  await Promise.all(promises)
}

/**
 * Generate ICO file (multiple sizes in one file)
 */
async function generateIcoFile() {
  console.log('\n🔷 Generating ICO file...')

  try {
    // Generate individual PNG files for ICO creation
    const tempPngs = []

    for (const size of config.sizes.ico) {
      const tempPath = path.join(config.outputDir, `temp-${size}.png`)
      await svgToPng(config.tabSource, tempPath, size)
      tempPngs.push(tempPath)
    }

    // favicon.ico is a browser-tab / legacy icon → bare monogram (tab source).
    // For now, just use the 32x32 as the main favicon.ico
    // You can use a library like png-to-ico for proper multi-size ICO generation
    await sharp(config.tabSource)
      .resize(32, 32)
      .png()
      .toFile(path.join(config.outputDir, 'favicon.ico'))

    // Clean up temp files
    for (const tempPath of tempPngs) {
      await fs.unlink(tempPath).catch(() => {})
    }

    console.log('✓ Generated favicon.ico')
  } catch (error) {
    console.error('✗ Failed to generate favicon.ico:', error.message)
  }
}

/**
 * Generate Web App Manifest
 */
async function generateManifest() {
  console.log('\n📄 Generating Web App Manifest...')

  const manifest = {
    name: 'WBM Band',
    short_name: 'WBM',
    description: 'Official website of WBM Band',
    // Relative URLs so ONE manifest is correct under BOTH deploy targets: the
    // browser resolves them against the manifest's own URL, giving '/...' on
    // wbmband.com and '/WBM-Band-WebSite/...' on GitHub Pages. Previously these
    // hardcoded `${config.baseURL}` (the GitHub base), so on the production
    // domain start_url + every icon 404'd (broken PWA install / maskable icon).
    start_url: './',
    display: 'standalone',
    // Black splash/background to match the new black icon and theme_color.
    background_color: '#000000',
    theme_color: config.colors.themeColor,
    icons: [
      {
        src: 'android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }

  try {
    await fs.writeFile(
      path.join(config.outputDir, 'site.webmanifest'),
      JSON.stringify(manifest, null, 2)
    )
    console.log('✓ Generated site.webmanifest')
  } catch (error) {
    console.error('✗ Failed to generate manifest:', error.message)
  }
}

/**
 * Generate browserconfig.xml for Microsoft
 */
async function generateBrowserConfig() {
  console.log('\n🔧 Generating Browser Config...')

  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="mstile-70x70.png"/>
            <square150x150logo src="mstile-150x150.png"/>
            <square310x310logo src="mstile-310x310.png"/>
            <TileColor>${config.colors.msapplicationTileColor}</TileColor>
        </tile>
    </msapplication>
</browserconfig>`

  try {
    await fs.writeFile(path.join(config.outputDir, 'browserconfig.xml'), browserConfig)
    console.log('✓ Generated browserconfig.xml')
  } catch (error) {
    console.error('✗ Failed to generate browserconfig.xml:', error.message)
  }
}

/**
 * Generate Safari Pinned Tab SVG (optimized)
 */
async function generateSafariPinnedTab() {
  console.log('\n🦁 Generating Safari Pinned Tab...')

  try {
    // Source the LOGO SILHOUETTE, not favicon.svg. favicon.svg now carries a
    // solid black backing square (so Google/PWA crop to a black circle with the
    // white mark) — recoloring that to monochrome black would yield an all-black
    // block. Safari pinned tabs want the bare glyph in black on transparent.
    const logoSource = path.join(__dirname, '../public/images/wbm-logo-white.svg')
    const svgContent = await fs.readFile(logoSource, 'utf8')

    // Recolor the white monogram (both the `.cls-1 { fill: #fff }` style block
    // and any inline white fills/strokes) to black; background stays transparent.
    const optimizedSvg = svgContent
      .replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #000000')
      .replace(/fill="(?:#fff(?:fff)?|white)"/gi, 'fill="#000000"')
      .replace(/stroke="(?:#fff(?:fff)?|white)"/gi, 'stroke="#000000"')

    await fs.writeFile(path.join(config.outputDir, 'safari-pinned-tab.svg'), optimizedSvg)

    console.log('✓ Generated safari-pinned-tab.svg')
  } catch (error) {
    console.error('✗ Failed to generate safari-pinned-tab.svg:', error.message)
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting favicon generation...\n')

  try {
    // Check both artwork sources exist (tab monogram + search badge)
    await fs.access(config.tabSource)
    await fs.access(config.badgeSource)

    // Ensure output directory exists
    await ensureDir(config.outputDir)

    // Generate all favicon types
    await generatePngFavicons()
    await generateAppleTouchIcons()
    await generateAndroidIcons()
    await generateMsTileIcons()
    await generateIcoFile()
    await generateManifest()
    await generateBrowserConfig()
    await generateSafariPinnedTab()

    console.log('\n✅ Favicon generation completed successfully!')
    console.log('\n📋 Generated files:')
    console.log('   - favicon.ico')
    console.log('   - favicon-*.png (multiple sizes)')
    console.log('   - apple-touch-icon*.png')
    console.log('   - android-chrome-*.png')
    console.log('   - mstile-*.png')
    console.log('   - site.webmanifest')
    console.log('   - browserconfig.xml')
    console.log('   - safari-pinned-tab.svg')
    console.log('\n🎯 Next: Update your Nuxt config to use these favicons!')
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(
        `✗ Source file not found (tab: ${config.tabSource} | badge: ${config.badgeSource})`
      )
      console.error('Please make sure both SVG favicon sources exist at the specified paths.')
    } else {
      console.error('✗ Favicon generation failed:', error.message)
    }
    process.exit(1)
  }
}

// Run the main function
main()
