#!/usr/bin/env node
// scripts/check-triage-labels.mjs
//
// Drift guard for the 13 canonical /triage labels. Reads the
// repo's actual labels via `gh label list` and reports any
// missing entries. Does NOT report extras as errors — the repo
// can carry legacy labels (the un-prefixed loop-queued /
// needs-user from phase-0 setup) without breaking /triage.
//
// Exit 0: all 13 canonical labels present.
// Exit 1: one or more canonical labels missing.
// Exit 3: GH_TOKEN missing or gh not authed.
//
// Not in `pnpm verify` — remote-network-dependent.

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CANONICAL_LABELS,
  canonicalNames,
  diffLabels,
} from './lib/triage-labels.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')

function loadDotenv(path = resolve(REPO_ROOT, '.env')) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

loadDotenv()

const GH_TOKEN = process.env['GH_TOKEN']
const GH_REPO = process.env['GH_REPO'] ?? 'daretodave/pantheon'

if (!GH_TOKEN) {
  console.error('GH_TOKEN missing from .env. Aborting.')
  process.exit(3)
}

try {
  execSync('gh auth status', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GH_TOKEN },
  })
} catch {
  console.error('gh CLI not authenticated. Run `gh auth login` or check GH_TOKEN.')
  process.exit(3)
}

const raw = execSync(`gh label list --repo "${GH_REPO}" --json name --limit 200`, {
  encoding: 'utf8',
  env: { ...process.env, GH_TOKEN },
})
const labels = JSON.parse(raw)
const actualNames = labels.map((l) => l.name)

const { missing, extra } = diffLabels(actualNames)

console.log(
  `repo: ${GH_REPO} — canonical: ${canonicalNames().length}, present: ${
    canonicalNames().length - missing.length
  }`,
)
if (missing.length === 0) {
  console.log('all 13 canonical labels present')
  if (extra.length > 0) {
    console.log(`extras (non-canonical, not a failure): ${extra.join(', ')}`)
  }
  process.exit(0)
}

console.error(`missing: ${missing.join(', ')}`)
console.error('\nRun `node scripts/create-triage-labels.mjs` to provision.')
process.exit(1)
