#!/usr/bin/env node

/**
 * Image compression script
 * Compresses existing large images to improve performance
 */

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
// Shared with utils/imageHelpers.ts (runtime srcset builder) so widths can't drift.
import imagePresets from '../constants/imagePresets.json' with { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_DIR = path.join(__dirname, '../public/images')
const OUTPUT_DIR = path.join(__dirname, '../public/images/optimized')

// Compression settings (widths/aspect/quality/formats per preset).
const COMPRESSION_SETTINGS = imagePresets

async function createOptimizedDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    await fs.mkdir(path.join(OUTPUT_DIR, 'hero-images', 'horizontal'), { recursive: true })
    await fs.mkdir(path.join(OUTPUT_DIR, 'hero-images', 'vertical'), { recursive: true })
    await fs.mkdir(path.join(OUTPUT_DIR, 'albums-images'), { recursive: true })
    await fs.mkdir(path.join(OUTPUT_DIR, 'about-us-images'), { recursive: true })
    await fs.mkdir(path.join(OUTPUT_DIR, 'our-team'), { recursive: true })
    await fs.mkdir(path.join(OUTPUT_DIR, 'meta-images'), { recursive: true })
  } catch (error) {
    console.error('Error creating directories:', error)
  }
}

async function compressImage(inputPath, outputDir, filename, settings) {
  console.log(`Compressing ${filename}...`)

  const baseFilename = path.parse(filename).name
  const widths = settings.widths || [settings.width]
  const [arW, arH] = settings.aspect || [1, 1]
  const maxWidth = Math.max(...widths)

  try {
    for (const format of settings.formats) {
      for (const width of widths) {
        const height = Math.round((width * arH) / arW)
        // Largest width → base file (`name.ext`) so existing references (album
        // imageUrl, blurred placeholders) keep resolving. Smaller widths →
        // `name-<w>.ext`, which the responsive srcset points at.
        const suffix = width === maxWidth ? '' : `-${width}`
        const outputPath = path.join(outputDir, `${baseFilename}${suffix}.${format}`)

        let pipeline = sharp(inputPath).resize(width, height, {
          fit: 'cover',
          position: 'center'
        })

        switch (format) {
          case 'avif':
            pipeline = pipeline.avif({ quality: settings.quality })
            break
          case 'webp':
            pipeline = pipeline.webp({ quality: settings.quality })
            break
          case 'jpg':
            pipeline = pipeline.jpeg({
              quality: settings.quality,
              progressive: true,
              mozjpeg: true
            })
            break
          case 'png':
            pipeline = pipeline.png({ quality: settings.quality })
            break
        }

        await pipeline.toFile(outputPath)

        const newStats = await fs.stat(outputPath)
        console.log(`  ${format.toUpperCase()} ${width}w: ${(newStats.size / 1024).toFixed(0)}KB`)
      }
    }
  } catch (error) {
    console.error(`Error compressing ${filename}:`, error)
  }
}

async function processImages() {
  console.log('🖼️  Starting image compression...')

  await createOptimizedDir()

  // Process hero images (split into horizontal + vertical subfolders so each
  // orientation can be compressed with art-direction-appropriate dimensions)
  console.log('\n📸 Processing hero images...')

  const heroVariants = [
    { dir: 'horizontal', settings: COMPRESSION_SETTINGS.hero },
    { dir: 'vertical', settings: COMPRESSION_SETTINGS.heroVertical }
  ]

  for (const variant of heroVariants) {
    const inputVariantDir = path.join(INPUT_DIR, 'hero-images', variant.dir)
    const outputVariantDir = path.join(OUTPUT_DIR, 'hero-images', variant.dir)

    try {
      const files = await fs.readdir(inputVariantDir)
      await fs.mkdir(outputVariantDir, { recursive: true })
      console.log(`  ${variant.dir}/ (${variant.settings.width}x${variant.settings.height})`)

      for (const file of files) {
        if (file.match(/\.(jpg|jpeg|png)$/i)) {
          const inputPath = path.join(inputVariantDir, file)
          await compressImage(inputPath, outputVariantDir, file, variant.settings)
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`  No hero-images/${variant.dir}/ folder, skipping.`)
      } else {
        console.error(`Error processing hero-images/${variant.dir}:`, error)
      }
    }
  }

  // Process album images
  console.log('\n🎵 Processing album images...')
  const albumDir = path.join(INPUT_DIR, 'albums-images')

  async function processAlbumDirectory(dirPath, relativePath = '') {
    const items = await fs.readdir(dirPath)

    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stats = await fs.stat(itemPath)

      if (stats.isDirectory()) {
        await processAlbumDirectory(itemPath, path.join(relativePath, item))
      } else if (item.match(/\.(jpg|jpeg|png)$/i)) {
        const outputDir = path.join(OUTPUT_DIR, 'albums-images', relativePath)
        await fs.mkdir(outputDir, { recursive: true })
        await compressImage(itemPath, outputDir, item, COMPRESSION_SETTINGS.album)

        // Also create thumbnails
        const thumbDir = path.join(OUTPUT_DIR, 'albums-images', relativePath, 'thumbs')
        await fs.mkdir(thumbDir, { recursive: true })
        await compressImage(itemPath, thumbDir, item, COMPRESSION_SETTINGS.thumbnail)
      }
    }
  }

  await processAlbumDirectory(albumDir)

  // Process about-us images
  console.log('\n👥 Processing about-us images...')
  const aboutDir = path.join(INPUT_DIR, 'about-us-images')
  try {
    const aboutFiles = await fs.readdir(aboutDir)

    for (const file of aboutFiles) {
      if (file.match(/\.(jpg|jpeg|png)$/i)) {
        const inputPath = path.join(aboutDir, file)
        const outputDir = path.join(OUTPUT_DIR, 'about-us-images')
        await compressImage(inputPath, outputDir, file, COMPRESSION_SETTINGS.about)
      }
    }
  } catch (error) {
    console.log('No about-us images found or error processing:', error.message)
  }

  // Process team images (with subdirectories for each member)
  console.log('\n👥 Processing team member images...')
  const teamDir = path.join(INPUT_DIR, 'our-team')
  try {
    const teamMembers = await fs.readdir(teamDir)

    for (const member of teamMembers) {
      const memberPath = path.join(teamDir, member)
      const stats = await fs.stat(memberPath)

      if (stats.isDirectory()) {
        console.log(`  Processing ${member}...`)
        const memberFiles = await fs.readdir(memberPath)
        const outputMemberDir = path.join(OUTPUT_DIR, 'our-team', member)
        await fs.mkdir(outputMemberDir, { recursive: true })

        for (const file of memberFiles) {
          if (file.match(/\.(jpg|jpeg|png)$/i)) {
            const inputPath = path.join(memberPath, file)
            await compressImage(inputPath, outputMemberDir, file, COMPRESSION_SETTINGS.team)
          }
        }
      }
    }
  } catch (error) {
    console.log('No team images found or error processing:', error.message)
  }

  // Process meta images
  console.log('\n🏷️  Processing meta images...')
  const metaDir = path.join(INPUT_DIR, 'meta-images')
  try {
    const metaFiles = await fs.readdir(metaDir)

    for (const file of metaFiles) {
      if (file.match(/\.(jpg|jpeg|png)$/i)) {
        const inputPath = path.join(metaDir, file)
        const outputDir = path.join(OUTPUT_DIR, 'meta-images')
        await compressImage(inputPath, outputDir, file, COMPRESSION_SETTINGS.meta)
      }
    }
  } catch (error) {
    console.log('No meta images found or error processing:', error.message)
  }

  console.log('\n✅ Image compression complete!')
  console.log('📁 Optimized images saved to:', OUTPUT_DIR)
  console.log('\n💡 Next steps:')
  console.log('1. Update your image paths to use the optimized versions')
  console.log('2. Set up your CDN or image service to serve the appropriate format')
  console.log('3. Consider using the NuxtImg component with format="avif,webp,jpg"')
}

// Run the script
processImages().catch(console.error)

export { COMPRESSION_SETTINGS }
