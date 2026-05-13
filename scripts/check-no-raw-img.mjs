#!/usr/bin/env node
// scripts/check-no-raw-img.mjs
//
// Phase 18 — raw <img> discipline gate. Walks src/ for any
// <img tokens in .tsx / .ts files and fails the build. The
// project's convention is next/image for all raster sources;
// inline SVG (which uses <svg> not <img>) is fine.
//
// Approved exceptions: none today. Add a filename to the
// ALLOWLIST below if a legitimate raw-img case lands (e.g.,
// a content-author tool that intentionally bypasses
// optimization).

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

const ALLOWLIST = new Set([])

const FILE_EXTS = new Set(['.tsx', '.ts'])

function walk(dir, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      walk(full, acc)
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'))
      if (FILE_EXTS.has(ext)) acc.push(full)
    }
  }
}

function relative(p) {
  return p.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '').replaceAll('\\', '/')
}

const files = []
walk(SRC, files)

const violations = []
const IMG_RE = /<img(\s|>|\/)/g

for (const file of files) {
  const rel = relative(file)
  if (ALLOWLIST.has(rel)) continue
  const src = readFileSync(file, 'utf8')
  const matches = [...src.matchAll(IMG_RE)]
  if (matches.length === 0) continue
  for (const m of matches) {
    const idx = m.index ?? 0
    const lineNumber = src.slice(0, idx).split(/\r?\n/).length
    const lineEnd = src.indexOf('\n', idx)
    const snippet = src
      .slice(idx, lineEnd === -1 ? idx + 80 : lineEnd)
      .trim()
    violations.push({ file: rel, line: lineNumber, snippet })
  }
}

if (violations.length === 0) {
  // Be terse on success; the verify chain has more important output.
  process.exit(0)
}

console.error(`check-no-raw-img: found ${violations.length} raw <img> usage(s):\n`)
for (const v of violations) {
  console.error(`  ${v.file}:${v.line} — ${v.snippet}`)
}
console.error(
  '\nUse next/image instead. If the case is intentional, add the file to the ALLOWLIST in scripts/check-no-raw-img.mjs.',
)
process.exit(1)
