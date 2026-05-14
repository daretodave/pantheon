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
  theme?: string
  seasonsCount?: number
}

function listDir(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name.replace(/\.md$/, ''))
}

function listSeasons(showSlug: string): number[] {
  const dir = resolve(SHOWS_DIR, showSlug, 'seasons')
  if (!existsSync(dir)) return []
  const numbers: number[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md')) continue
    const match = entry.name.match(/^(\d+)/)
    if (!match) continue
    const n = Number.parseInt(match[1] ?? '', 10)
    if (Number.isFinite(n)) numbers.push(n)
  }
  return numbers.sort((a, b) => a - b)
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
    const seasonNumbers = listSeasons(showSlug)
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
      seasonsCount: seasonNumbers.length,
    })
    for (const n of seasonNumbers) {
      out.push({
        pattern: '/shows/[show]/season/[n]',
        path: `/shows/${showSlug}/season/${n}`,
        show: showSlug,
        season: n,
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
