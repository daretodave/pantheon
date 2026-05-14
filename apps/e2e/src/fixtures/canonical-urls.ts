import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// canonical-urls is the single source of truth for the smoke walker.
// It enumerates every URL the site serves by walking content/ directly
// — that keeps the e2e package free of any dependency on src/.
// `src/lib/routes.ts` does the same expansion server-side; both lists
// stay in sync because they both read the same content directory.

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../../..')
const CONTENT_ROOT = resolve(REPO_ROOT, 'content')
const SHOWS_DIR = resolve(CONTENT_ROOT, 'shows')
const THEMES_DIR = resolve(CONTENT_ROOT, 'themes')

export type CanonicalUrl = {
  pattern: string
  path: string
  show?: string
  season?: number
  seasonSlug?: string
  theme?: string
  seasonsCount?: number
}

function listDir(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name.replace(/\.md$/, ''))
}

type SeasonRow = { number: number; slug: string }

// 31a: walk every season filename in the show's seasons/ directory
// matching the `NN-<slug>.md` convention; both the number and the
// slug travel through so the smoke walker hits the slug-form URL
// (canonical) and the redirect fixture hits the digit-form (legacy).
function listSeasons(showSlug: string): SeasonRow[] {
  const dir = resolve(SHOWS_DIR, showSlug, 'seasons')
  if (!existsSync(dir)) return []
  const rows: SeasonRow[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md')) continue
    const match = entry.name.match(/^(\d+)-(.+)\.md$/)
    if (!match) continue
    const n = Number.parseInt(match[1] ?? '', 10)
    const slug = match[2] ?? ''
    if (Number.isFinite(n) && slug.length > 0) rows.push({ number: n, slug })
  }
  return rows.sort((a, b) => a.number - b.number)
}

function build(): CanonicalUrl[] {
  const out: CanonicalUrl[] = [
    { pattern: '/', path: '/' },
    { pattern: '/shows', path: '/shows' },
    { pattern: '/themes', path: '/themes' },
    { pattern: '/about', path: '/about' },
    { pattern: '/terms', path: '/terms' },
    { pattern: '/privacy', path: '/privacy' },
    { pattern: '/sign-in', path: '/sign-in' },
    { pattern: '/mod', path: '/mod' },
  ]

  for (const showSlug of listDir(SHOWS_DIR)) {
    const seasonRows = listSeasons(showSlug)
    out.push({ pattern: '/shows/[show]', path: `/shows/${showSlug}`, show: showSlug })
    out.push({
      pattern: '/shows/[show]/canon',
      path: `/shows/${showSlug}/canon`,
      show: showSlug,
    })
    out.push({
      pattern: '/shows/[show]/community',
      path: `/shows/${showSlug}/community`,
      show: showSlug,
      seasonsCount: seasonRows.length,
    })
    for (const row of seasonRows) {
      out.push({
        pattern: '/shows/[show]/season/[slug]',
        path: `/shows/${showSlug}/season/${row.slug}`,
        show: showSlug,
        season: row.number,
        seasonSlug: row.slug,
      })
    }
  }

  for (const themeSlug of listDir(THEMES_DIR)) {
    out.push({
      pattern: '/themes/[theme]',
      path: `/themes/${themeSlug}`,
      theme: themeSlug,
    })
  }

  const handle = process.env['E2E_USER_HANDLE']
  if (handle) {
    out.push({ pattern: '/u/[handle]', path: `/u/${handle}` })
  }

  return out
}

export const canonicalUrls: CanonicalUrl[] = build()
