import { canonicalUrls } from './canonical-urls'

// 31a: digit-form season URLs that the season page 308s to its
// canonical slug form (`/shows/<show>/season/<n>` →
// `/shows/<show>/season/<slug>`). One row per show — the smoke
// walker hits each and asserts the redirect status + Location.
//
// We pick one season per show (the lowest-number aired season) so
// the assertion catches the redirect contract without exploding
// fixture size.

export type SeasonRedirect = {
  show: string
  fromPath: string
  toPath: string
}

function buildSeasonRedirects(): SeasonRedirect[] {
  const firstByShow = new Map<string, SeasonRedirect>()
  for (const row of canonicalUrls) {
    if (row.pattern !== '/shows/[show]/season/[slug]') continue
    if (!row.show || !row.seasonSlug || row.season == null) continue
    if (firstByShow.has(row.show)) continue
    firstByShow.set(row.show, {
      show: row.show,
      fromPath: `/shows/${row.show}/season/${row.season}`,
      toPath: `/shows/${row.show}/season/${row.seasonSlug}`,
    })
  }
  return [...firstByShow.values()].sort((a, b) =>
    a.show.localeCompare(b.show),
  )
}

export const seasonRedirects: SeasonRedirect[] = buildSeasonRedirects()
