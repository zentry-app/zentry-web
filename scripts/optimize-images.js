#!/usr/bin/env node
/**
 * Script para optimizar imágenes de la landing.
 * Comprime webp y png reduciendo tamaño sin perder calidad visible.
 * 
 * Uso: node scripts/optimize-images.js
 * Requiere: npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const LOGO_DIR = path.join(ASSETS_DIR, 'logo');

// Imágenes a optimizar con sus configuraciones
const IMAGE_CONFIG = {
  // WebP - calidad 80, máximo ahorro sin artefactos visibles
  webp: {
    quality: 80,
    effort: 6,
    smartSubsample: true,
  },
  // PNG - compresión agresiva para logos
  png: {
    compressionLevel: 9,
    effort: 10,
  },
};

async function optimizeImages() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('❌ sharp no está instalado. Ejecuta: npm install sharp --save-dev');
    process.exit(1);
  }

  const images = [];
  const processDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        processDir(fullPath);
      } else if (/\.(webp|png|jpg|jpeg)$/i.test(ent.name)) {
        images.push(fullPath);
      }
    }
  };
  processDir(ASSETS_DIR);

  if (images.length === 0) {
    console.log('No se encontraron imágenes para optimizar.');
    return;
  }

  console.log(`\n🖼️  Optimizando ${images.length} imágenes...\n`);

  let totalSaved = 0;
  for (const imgPath of images) {
    const ext = path.extname(imgPath).toLowerCase();
    const relPath = path.relative(process.cwd(), imgPath);
    const originalSize = fs.statSync(imgPath).size;

    try {
      let pipeline = sharp(imgPath);
      let outputPath = imgPath;

      if (ext === '.webp') {
        // Re-encodear webp con mejor compresión
        const buffer = await pipeline
          .webp(IMAGE_CONFIG.webp)
          .toBuffer();
        fs.writeFileSync(outputPath, buffer);
      } else if (ext === '.png') {
        const buffer = await pipeline
          .png(IMAGE_CONFIG.png)
          .toBuffer();
        fs.writeFileSync(outputPath, buffer);
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        const buffer = await pipeline
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
        fs.writeFileSync(outputPath, buffer);
      } else {
        continue;
      }

      const newSize = fs.statSync(outputPath).size;
      const saved = originalSize - newSize;
      totalSaved += saved;
      const pct = ((saved / originalSize) * 100).toFixed(1);
      const sign = saved >= 0 ? '-' : '+';
      console.log(`  ✓ ${relPath}: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${sign}${pct}%)`);
    } catch (err) {
      console.error(`  ✗ ${relPath}: ${err.message}`);
    }
  }

  console.log(`\n✅ Listo. Ahorro total: ${formatBytes(totalSaved)}\n`);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KiB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MiB';
}

optimizeImages().catch(console.error);
