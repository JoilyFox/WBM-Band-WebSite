#!/usr/bin/env node

/**
 * Image compression script
 * Compresses existing large images to improve performance
 */

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_DIR = path.join(__dirname, '../public/images')
const OUTPUT_DIR = path.join(__dirname, '../public/images/optimized')

// Compression settings
const COMPRESSION_SETTINGS = {
  hero: {
    width: 1920,
    height: 1080,
    quality: 85,
    formats: ['avif', 'webp', 'jpg']
  },
  album: {
    width: 800,
    height: 800,
    quality: 85,
    formats: ['avif', 'webp', 'jpg']
  },
  about: {
    width: 1920,
    height: 1080,
    quality: 85,
    formats: ['avif', 'webp', 'jpg']
  },
  team: {
    width: 800,
    height: 800,
    quality: 85,
    formats: ['avif', 'webp', 'jpg']
  },
  meta: {
    width: 1200,
    height: 630,
    quality: 85,
    formats: ['jpg', 'png']
  },
  thumbnail: {
    width: 400,
    height: 400,
    quality: 80,
    formats: ['avif', 'webp', 'jpg']
  }
}

async function createOptimizedDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    await fs.mkdir(path.join(OUTPUT_DIR, 'hero-images'), { recursive: true })
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

  try {
    for (const format of settings.formats) {
      const outputPath = path.join(outputDir, `${baseFilename}.${format}`)

      let pipeline = sharp(inputPath).resize(settings.width, settings.height, {
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
      }

      await pipeline.toFile(outputPath)

      // Log file size reduction
      const originalStats = await fs.stat(inputPath)
      const newStats = await fs.stat(outputPath)
      const reduction = (((originalStats.size - newStats.size) / originalStats.size) * 100).toFixed(
        1
      )

      console.log(
        `  ${format.toUpperCase()}: ${(newStats.size / 1024 / 1024).toFixed(2)}MB (${reduction}% reduction)`
      )
    }
  } catch (error) {
    console.error(`Error compressing ${filename}:`, error)
  }
}

async function processImages() {
  console.log('🖼️  Starting image compression...')

  await createOptimizedDir()

  // Process hero images
  console.log('\n📸 Processing hero images...')
  const heroDir = path.join(INPUT_DIR, 'hero-images')
  const heroFiles = await fs.readdir(heroDir)

  for (const file of heroFiles) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const inputPath = path.join(heroDir, file)
      const outputDir = path.join(OUTPUT_DIR, 'hero-images')
      await compressImage(inputPath, outputDir, file, COMPRESSION_SETTINGS.hero)
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
