#!/usr/bin/env node
// scripts/create-triage-labels.mjs
//
// One-shot bootstrap that creates / updates the 13 canonical
// labels the /triage skill expects on the target GitHub repo.
// Idempotent: re-runs converge to the canonical color +
// description for each label.
//
// Reads env via .env loader pattern from deploy-check.mjs.
// Required: GH_TOKEN (PAT), GH_REPO (defaults to
// daretodave/pantheon).

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CANONICAL_LABELS } from './lib/triage-labels.mjs'

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

function gh(args) {
  return execSync(`gh ${args}`, {
    encoding: 'utf8',
    env: { ...process.env, GH_TOKEN },
  })
}

let created = 0
let updated = 0
let errors = 0

for (const { name, description, color } of CANONICAL_LABELS) {
  try {
    // Create returns non-zero if the label exists; we handle
    // that by always running an edit after the create.
    try {
      gh(
        `label create "${name}" --repo "${GH_REPO}" --description "${description}" --color "${color}"`,
      )
      created++
    } catch {
      gh(
        `label edit "${name}" --repo "${GH_REPO}" --description "${description}" --color "${color}"`,
      )
      updated++
    }
  } catch (err) {
    errors++
    console.error(
      `  [error] ${name}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}

console.log(
  `triage labels: ${created} created, ${updated} updated, ${errors} errored on ${GH_REPO}`,
)
process.exit(errors > 0 ? 1 : 0)
