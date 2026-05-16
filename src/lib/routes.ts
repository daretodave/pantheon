import { getAllSeasons, getAllShows, getAllThemes } from '@/content'

export type RouteEntry = {
  pattern: string
  path: string
  show?: string
  season?: number
  seasonSlug?: string
  theme?: string
}

const STATIC_ROUTES: RouteEntry[] = [
  { pattern: '/', path: '/' },
  { pattern: '/shows', path: '/shows' },
  { pattern: '/themes', path: '/themes' },
  { pattern: '/about', path: '/about' },
  { pattern: '/terms', path: '/terms' },
  { pattern: '/privacy', path: '/privacy' },
  { pattern: '/sign-in', path: '/sign-in' },
  { pattern: '/mod', path: '/mod' },
]

// Enumerated routes that come from content + (optionally) env. The
// e2e harness consumes this via apps/e2e/src/fixtures/canonical-urls.ts.
export function getAllRoutes(): RouteEntry[] {
  const out: RouteEntry[] = [...STATIC_ROUTES]

  for (const show of getAllShows()) {
    // Phase 33: /canon + /community consolidated into /shows/[show]
    // (the standalone routes now 308 there). Intentionally not
    // emitted as canonical routes — no sitemap entry, no smoke row;
    // the redirect fixture covers the 308 contract instead.
    out.push({ pattern: '/shows/[show]', path: `/shows/${show.slug}`, show: show.slug })
    for (const season of getAllSeasons(show.slug)) {
      out.push({
        pattern: '/shows/[show]/season/[slug]',
        path: `/shows/${show.slug}/season/${season.slug}`,
        show: show.slug,
        season: season.number,
        seasonSlug: season.slug,
      })
    }
  }

  for (const theme of getAllThemes()) {
    out.push({ pattern: '/themes/[theme]', path: `/themes/${theme.slug}`, theme: theme.slug })
  }

  const handle = process.env['E2E_USER_HANDLE']
  if (handle) {
    out.push({ pattern: '/u/[handle]', path: `/u/${handle}` })
  }

  return out
}

// Routes excluded from the public sitemap (auth-gated or low-value).
const SITEMAP_EXCLUDE_PATTERNS = new Set<string>([
  '/sign-in',
  '/mod',
  '/u/[handle]',
])

export function getSitemapRoutes(): RouteEntry[] {
  return getAllRoutes().filter((r) => !SITEMAP_EXCLUDE_PATTERNS.has(r.pattern))
}
