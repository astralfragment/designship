import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = readFileSync(join(root, 'resources', 'icon.svg'))

mkdirSync(join(root, 'build'), { recursive: true })
mkdirSync(join(root, 'resources'), { recursive: true })

// Generate PNG sizes
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(root, 'build', `icon-${size}.png`))
}

// Main icon.png (256x256 for Linux + tray)
await sharp(svg).resize(256, 256).png().toFile(join(root, 'build', 'icon.png'))

// Tray icon (16x16)
await sharp(svg).resize(16, 16).png().toFile(join(root, 'resources', 'tray-icon.png'))

// ICO for Windows (multi-size)
// sharp can't make .ico directly, but electron-builder accepts .png and generates .ico
// We'll use the 256px as the base
await sharp(svg).resize(256, 256).png().toFile(join(root, 'build', 'icon.ico.png'))

console.log('Icons generated successfully')
