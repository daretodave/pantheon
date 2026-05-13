#!/usr/bin/env node
// scripts/build-icons.mjs
//
// Renders the favicon set (and Apple touch icon) from a single
// canonical source SVG at `public/sigil.svg`. Idempotent — re-run
// any time the source SVG changes, all derived rasters are
// regenerated.
//
//   pnpm build:icons
//
// Outputs:
//   public/favicon.ico          # multi-size 16/32/48
//   public/icon-{16,32,48,64,96,128,180,192,256,512,1024}.png
//   public/apple-touch-icon.png # 180x180
//
// Implementation: @resvg/resvg-js (pure JS, no native deps) + png-to-ico.
//
// Phase 1 ships package.json with the dependencies. Until then this
// script exists as the contract — running it pre-phase-1 fails on
// missing imports, which is expected.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')

const SOURCE = resolve(REPO_ROOT, 'public/sigil.svg')
const OUT_DIR = resolve(REPO_ROOT, 'public')
const SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024]
const ICO_SIZES = [16, 32, 48]

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Source SVG not found: ${SOURCE}`)
    console.error(`Phase 1 must ship public/sigil.svg before this runs.`)
    process.exit(1)
  }

  const { Resvg } = await import('@resvg/resvg-js')
  const pngToIco = (await import('png-to-ico')).default

  await mkdir(OUT_DIR, { recursive: true })
  const svg = await readFile(SOURCE)

  console.log(`Rendering ${SIZES.length} PNG variants from ${SOURCE}...`)
  for (const size of SIZES) {
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: size },
      background: 'rgba(0,0,0,0)',
    })
      .render()
      .asPng()
    const out = resolve(OUT_DIR, `icon-${size}.png`)
    await writeFile(out, png)
    console.log(`  -> ${out} (${png.length} bytes)`)
  }

  // Apple touch icon: 180x180 with no transparency (iOS quirk).
  const apple = new Resvg(svg, {
    fitTo: { mode: 'width', value: 180 },
    background: '#15110C', // Pantheon paper-1 dark
  })
    .render()
    .asPng()
  const appleOut = resolve(OUT_DIR, 'apple-touch-icon.png')
  await writeFile(appleOut, apple)
  console.log(`  -> ${appleOut}`)

  // favicon.ico: bundle 16, 32, 48 PNGs.
  const ico = await pngToIco(ICO_SIZES.map(s => resolve(OUT_DIR, `icon-${s}.png`)))
  const icoOut = resolve(OUT_DIR, 'favicon.ico')
  await writeFile(icoOut, ico)
  console.log(`  -> ${icoOut} (${ico.length} bytes, ${ICO_SIZES.length} sizes)`)

  console.log('Done.')
}

main().catch(err => {
  console.error(err.message ?? err)
  process.exit(1)
})
