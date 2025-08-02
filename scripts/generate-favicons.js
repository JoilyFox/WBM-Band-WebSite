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

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  sourceFile: path.join(__dirname, '../public/favicon.svg'),
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
};

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Convert SVG to PNG using Sharp
 */
async function svgToPng(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated ${path.basename(outputPath)} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

/**
 * Generate PNG favicons
 */
async function generatePngFavicons() {
  console.log('\n📱 Generating PNG favicons...');
  
  const promises = config.sizes.png.map(size => 
    svgToPng(
      config.sourceFile,
      path.join(config.outputDir, `favicon-${size}x${size}.png`),
      size
    )
  );
  
  await Promise.all(promises);
}

/**
 * Generate Apple Touch Icons
 */
async function generateAppleTouchIcons() {
  console.log('\n🍎 Generating Apple Touch Icons...');
  
  // Generate apple-touch-icon.png (default 180x180)
  await svgToPng(
    config.sourceFile,
    path.join(config.outputDir, 'apple-touch-icon.png'),
    180
  );
  
  // Generate various sizes
  const promises = config.sizes.appleTouchIcon.map(size => 
    svgToPng(
      config.sourceFile,
      path.join(config.outputDir, `apple-touch-icon-${size}x${size}.png`),
      size
    )
  );
  
  await Promise.all(promises);
}

/**
 * Generate Android Chrome Icons
 */
async function generateAndroidIcons() {
  console.log('\n🤖 Generating Android Chrome Icons...');
  
  const promises = config.sizes.androidChrome.map(size => 
    svgToPng(
      config.sourceFile,
      path.join(config.outputDir, `android-chrome-${size}x${size}.png`),
      size
    )
  );
  
  await Promise.all(promises);
}

/**
 * Generate Microsoft Tile Icons
 */
async function generateMsTileIcons() {
  console.log('\n🪟 Generating Microsoft Tile Icons...');
  
  // Generate mstile icons
  const promises = config.sizes.msTile.map(size => 
    svgToPng(
      config.sourceFile,
      path.join(config.outputDir, `mstile-${size}x${size}.png`),
      size
    )
  );
  
  await Promise.all(promises);
}

/**
 * Generate ICO file (multiple sizes in one file)
 */
async function generateIcoFile() {
  console.log('\n🔷 Generating ICO file...');
  
  try {
    // Generate individual PNG files for ICO creation
    const tempPngs = [];
    
    for (const size of config.sizes.ico) {
      const tempPath = path.join(config.outputDir, `temp-${size}.png`);
      await svgToPng(config.sourceFile, tempPath, size);
      tempPngs.push(tempPath);
    }
    
    // For now, just use the 32x32 as the main favicon.ico
    // You can use a library like png-to-ico for proper multi-size ICO generation
    await sharp(config.sourceFile)
      .resize(32, 32)
      .png()
      .toFile(path.join(config.outputDir, 'favicon.ico'));
    
    // Clean up temp files
    for (const tempPath of tempPngs) {
      await fs.unlink(tempPath).catch(() => {});
    }
    
    console.log('✓ Generated favicon.ico');
  } catch (error) {
    console.error('✗ Failed to generate favicon.ico:', error.message);
  }
}

/**
 * Generate Web App Manifest
 */
async function generateManifest() {
  console.log('\n📄 Generating Web App Manifest...');
  
  const manifest = {
    name: "WBM Band",
    short_name: "WBM",
    description: "Official website of WBM Band",
    start_url: `${config.baseURL}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: config.colors.themeColor,
    icons: [
      {
        src: `${config.baseURL}/android-chrome-192x192.png`,
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: `${config.baseURL}/android-chrome-512x512.png`,
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: `${config.baseURL}/favicon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
  
  try {
    await fs.writeFile(
      path.join(config.outputDir, 'site.webmanifest'),
      JSON.stringify(manifest, null, 2)
    );
    console.log('✓ Generated site.webmanifest');
  } catch (error) {
    console.error('✗ Failed to generate manifest:', error.message);
  }
}

/**
 * Generate browserconfig.xml for Microsoft
 */
async function generateBrowserConfig() {
  console.log('\n🔧 Generating Browser Config...');
  
  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="${config.baseURL}/mstile-70x70.png"/>
            <square150x150logo src="${config.baseURL}/mstile-150x150.png"/>
            <square310x310logo src="${config.baseURL}/mstile-310x310.png"/>
            <TileColor>${config.colors.msapplicationTileColor}</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
  
  try {
    await fs.writeFile(
      path.join(config.outputDir, 'browserconfig.xml'),
      browserConfig
    );
    console.log('✓ Generated browserconfig.xml');
  } catch (error) {
    console.error('✗ Failed to generate browserconfig.xml:', error.message);
  }
}

/**
 * Generate Safari Pinned Tab SVG (optimized)
 */
async function generateSafariPinnedTab() {
  console.log('\n🦁 Generating Safari Pinned Tab...');
  
  try {
    // Copy the source SVG as safari-pinned-tab.svg
    // In a real implementation, you might want to optimize this SVG
    const svgContent = await fs.readFile(config.sourceFile, 'utf8');
    
    // Basic optimization - make it monochrome and remove unnecessary attributes
    const optimizedSvg = svgContent
      .replace(/fill="[^"]*"/g, 'fill="black"')
      .replace(/stroke="[^"]*"/g, 'stroke="black"');
    
    await fs.writeFile(
      path.join(config.outputDir, 'safari-pinned-tab.svg'),
      optimizedSvg
    );
    
    console.log('✓ Generated safari-pinned-tab.svg');
  } catch (error) {
    console.error('✗ Failed to generate safari-pinned-tab.svg:', error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting favicon generation...\n');
  
  try {
    // Check if source file exists
    await fs.access(config.sourceFile);
    
    // Ensure output directory exists
    await ensureDir(config.outputDir);
    
    // Generate all favicon types
    await generatePngFavicons();
    await generateAppleTouchIcons();
    await generateAndroidIcons();
    await generateMsTileIcons();
    await generateIcoFile();
    await generateManifest();
    await generateBrowserConfig();
    await generateSafariPinnedTab();
    
    console.log('\n✅ Favicon generation completed successfully!');
    console.log('\n📋 Generated files:');
    console.log('   - favicon.ico');
    console.log('   - favicon-*.png (multiple sizes)');
    console.log('   - apple-touch-icon*.png');
    console.log('   - android-chrome-*.png');
    console.log('   - mstile-*.png');
    console.log('   - site.webmanifest');
    console.log('   - browserconfig.xml');
    console.log('   - safari-pinned-tab.svg');
    console.log('\n🎯 Next: Update your Nuxt config to use these favicons!');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`✗ Source file not found: ${config.sourceFile}`);
      console.error('Please make sure your SVG favicon exists at the specified path.');
    } else {
      console.error('✗ Favicon generation failed:', error.message);
    }
    process.exit(1);
  }
}

// Run the main function
main();
