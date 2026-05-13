#!/usr/bin/env node
// scripts/size.mjs
//
// Phase 18 — homepage gzip size budget. Reads .next/app-build-manifest.json
// (or app-paths-manifest.json depending on Next version), resolves the
// chunks that load on `/`, gzips each one's static file, and fails if
// the total exceeds the budget. NOT in the verify chain (flaky against
// upstream package bumps).

import { existsSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()
const BUDGET_BYTES = 250 * 1024
const NEXT_DIR = join(ROOT, '.next')

if (!existsSync(NEXT_DIR)) {
  console.error('.next/ not found — run `pnpm build` first.')
  process.exit(2)
}

// Newer Next.js builds emit `.next/app-build-manifest.json` for the
// App Router; older builds use `.next/build-manifest.json`. We try
// both and merge.
function loadManifest() {
  const candidates = ['app-build-manifest.json', 'build-manifest.json']
  for (const name of candidates) {
    const p = join(NEXT_DIR, name)
    if (existsSync(p)) {
      const data = JSON.parse(readFileSync(p, 'utf8'))
      return { name, data }
    }
  }
  throw new Error('no build manifest found in .next/')
}

const { name: manifestName, data: manifest } = loadManifest()

// Find chunks for the `/` route. The App Router manifest keys pages by
// app path (`/page` for `/`). With route groups (e.g. the (default)
// group introduced in phase 19b), the manifest key includes the group:
// `/(default)/page`. Match both. Older Pages-router uses `/`.
function chunksForHome(m) {
  const set = new Set()
  const pageKeys = ['/page', '/(default)/page']
  for (const pageKey of pageKeys) {
    if (m.pages && Array.isArray(m.pages[pageKey])) {
      for (const c of m.pages[pageKey]) set.add(c)
    }
  }
  if (m['/'] && Array.isArray(m['/'])) {
    for (const c of m['/']) set.add(c)
  }
  // Always include the shared "main" chunks for the App Router.
  for (const key of ['pages/_app', '/_app', 'main', 'main-app', 'webpack', 'webpack-runtime']) {
    if (Array.isArray(m[key])) for (const c of m[key]) set.add(c)
  }
  if (m.rootMainFiles && Array.isArray(m.rootMainFiles)) {
    for (const c of m.rootMainFiles) set.add(c)
  }
  return [...set]
}

const chunks = chunksForHome(manifest)
if (chunks.length === 0) {
  console.error(`No chunks resolved for / from ${manifestName}`)
  process.exit(2)
}

let total = 0
const rows = []
for (const c of chunks) {
  const filePath = resolve(NEXT_DIR, c)
  if (!existsSync(filePath)) {
    rows.push({ chunk: c, found: false, gz: 0 })
    continue
  }
  // Only JS chunks matter for first-load JS budget.
  if (!c.endsWith('.js')) continue
  const raw = readFileSync(filePath)
  const gz = gzipSync(raw).length
  total += gz
  rows.push({ chunk: c, found: true, gz })
}

console.log(`size budget: 250 KB gzipped for / first-load JS`)
console.log(`manifest: ${manifestName}, chunks scanned: ${rows.length}`)
for (const r of rows) {
  const tag = r.found ? `${(r.gz / 1024).toFixed(1)} KB` : 'missing'
  console.log(`  ${r.chunk}: ${tag}`)
}
console.log(`total: ${(total / 1024).toFixed(1)} KB / 250 KB`)

if (total > BUDGET_BYTES) {
  console.error(
    `\nFAIL — first-load JS at ${(total / 1024).toFixed(1)} KB exceeds the 250 KB budget by ${((total - BUDGET_BYTES) / 1024).toFixed(1)} KB.`,
  )
  process.exit(1)
}

console.log('\nOK — under budget.')
