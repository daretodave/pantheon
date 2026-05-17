import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Phase 32: the RSS feed URL set, derived from content/ the same
// way canonical-urls.ts derives HTML routes — the e2e package
// stays free of any dependency on src/. `src/lib/routes.ts`
// (getFeedPaths) builds the identical list server-side; both read
// the same content directory so they cannot drift.

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../../..')
const SHOWS_DIR = resolve(REPO_ROOT, 'content', 'shows')

function listShows(): string[] {
  if (!existsSync(SHOWS_DIR)) return []
  return readdirSync(SHOWS_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name.replace(/\.md$/, ''))
    .sort()
}

export const GLOBAL_FEED = '/feed.xml'

export const feedUrls: string[] = [
  GLOBAL_FEED,
  ...listShows().map((slug) => `/feed/${slug}.xml`),
]
