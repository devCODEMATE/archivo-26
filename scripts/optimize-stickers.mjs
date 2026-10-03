import sharp from 'sharp'
import {
  mkdir,
  readdir,
  copyFile,
  readFile,
  writeFile,
} from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const stickerFolder = join(projectRoot, 'public', 'stickers', 'promo')
const backupFolder = join(projectRoot, 'backups', 'stickers-originals')

await mkdir(backupFolder, { recursive: true })

const files = (await readdir(stickerFolder))
  .filter((name) => name.toLowerCase().endsWith('.png'))
  .sort()

// Guardar todos los originales antes de modificar las imágenes.
for (const name of files) {
  try {
    await copyFile(
      join(stickerFolder, name),
      join(backupFolder, name),
      constants.COPYFILE_EXCL
    )
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

let originalTotal = 0
let optimizedTotal = 0

for (const name of files) {
  const original = await readFile(join(backupFolder, name))
  const originalMetadata = await sharp(original).metadata()

  const optimized = await sharp(original)
    .resize({
      width: 512,
      height: 512,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toBuffer()

  const optimizedMetadata = await sharp(optimized).metadata()

  if (originalMetadata.hasAlpha && !optimizedMetadata.hasAlpha) {
    throw new Error(`Se perdió la transparencia de ${name}`)
  }

  const result =
    optimized.length < original.length ? optimized : original

  await writeFile(join(stickerFolder, name), result)

  originalTotal += original.length
  optimizedTotal += result.length

  console.log(
    `${name}: ${Math.round(original.length / 1000)} KB → ` +
    `${Math.round(result.length / 1000)} KB`
  )
}

if (originalTotal > 0) {
  const reduction = (1 - optimizedTotal / originalTotal) * 100

  console.log(
    `\nTotal: ${(originalTotal / 1000000).toFixed(2)} MB → ` +
    `${(optimizedTotal / 1000000).toFixed(2)} MB`
  )
  console.log(`Reducción: ${reduction.toFixed(1)}%`)
}

console.log(`Originales conservados en: ${backupFolder}`)