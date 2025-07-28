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
      
      let pipeline = sharp(inputPath)
        .resize(settings.width, settings.height, {
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
      const reduction = ((originalStats.size - newStats.size) / originalStats.size * 100).toFixed(1)
      
      console.log(`  ${format.toUpperCase()}: ${(newStats.size / 1024 / 1024).toFixed(2)}MB (${reduction}% reduction)`)
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
  const albumFiles = await fs.readdir(albumDir)
  
  for (const file of albumFiles) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const inputPath = path.join(albumDir, file)
      const outputDir = path.join(OUTPUT_DIR, 'albums-images')
      await compressImage(inputPath, outputDir, file, COMPRESSION_SETTINGS.album)
      
      // Also create thumbnails
      const thumbDir = path.join(OUTPUT_DIR, 'albums-images', 'thumbs')
      await fs.mkdir(thumbDir, { recursive: true })
      await compressImage(inputPath, thumbDir, file, COMPRESSION_SETTINGS.thumbnail)
    }
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
