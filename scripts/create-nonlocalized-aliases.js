#!/usr/bin/env node

/**
 * Create non-localized route aliases in the static output.
 * This replicates the generated Ukrainian locale pages into
 * non-prefixed directories so hosts without rewrite support
 * (e.g., nginx shared hosting) can serve /pre-save/* and /listen/*
 * URLs directly.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputRoot = path.resolve(__dirname, '../.output/public')

const aliasMappings = [
  { from: 'ua/pre-save', to: 'pre-save' },
  { from: 'ua/listen', to: 'listen' }
]

const copyDirectory = (sourceDir, destinationDir) => {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`⚠️  Skipping alias copy: source not found (${sourceDir})`)
    return
  }

  // Ensure destination parent exists
  fs.mkdirSync(path.dirname(destinationDir), { recursive: true })

  // Remove old destination to avoid stale files
  if (fs.existsSync(destinationDir)) {
    fs.rmSync(destinationDir, { recursive: true, force: true })
  }

  fs.cpSync(sourceDir, destinationDir, { recursive: true })
  console.log(`🔄 Copied ${sourceDir} → ${destinationDir}`)
}

aliasMappings.forEach(({ from, to }) => {
  const sourcePath = path.join(outputRoot, from)
  const destinationPath = path.join(outputRoot, to)
  copyDirectory(sourcePath, destinationPath)
})

console.log('✅ Non-localized aliases created successfully.')
