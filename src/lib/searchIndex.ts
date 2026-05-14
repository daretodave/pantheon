import { getAllSeasons, getAllShows, getAllThemes } from '@/content'
import { TIER_ORDER, tierMeta } from '@/components/shows/tierMeta'
import type { ShowTier } from '@/content'

// Flat client-side index for the cmd+K search overlay. The full
// `search()` engine still lives in `src/lib/search.ts` and powers
// the server-rendered surfaces; this helper produces a serializable
// summary the overlay client component can filter without a
// round-trip. v1 — fine for ~10 shows + ~200 seasons + ~20 themes.

export type SearchIndexItemType = 'show' | 'season' | 'list' | 'tier'

export type SearchIndexItem = {
  type: SearchIndexItemType
  name: string
  meta: string
  color: string
  href: string
  // Optional badges. Only seasons carry a tier letter today.
  tier?: ShowTier
}

function showMeta(seasons: number, status: string): string {
  const left = `${seasons} season${seasons === 1 ? '' : 's'}`
  if (status === 'airing') return `${left} · canon + community`
  if (status === 'ended') return `${left} · canon + community`
  return `${left} · in review`
}

export function getSearchIndex(): SearchIndexItem[] {
  const out: SearchIndexItem[] = []
  const shows = getAllShows()
  const showByslug = new Map(shows.map((s) => [s.slug, s]))

  for (const show of shows) {
    out.push({
      type: 'show',
      name: show.name,
      meta: showMeta(show.seasons, show.status),
      color: show.palette.primary,
      href: `/shows/${show.slug}`,
    })
  }

  for (const show of shows) {
    for (const season of getAllSeasons(show.slug)) {
      out.push({
        type: 'season',
        name: season.title,
        meta: `${show.name} · season ${String(season.number).padStart(2, '0')}`,
        color: show.palette.primary,
        href: `/shows/${show.slug}/season/${season.number}`,
        tier: show.tier,
      })
    }
  }

  for (const theme of getAllThemes()) {
    const entries = theme.entries.length
    const showsInList = new Set(theme.entries.map((e) => e.show)).size
    out.push({
      type: 'list',
      name: theme.title,
      meta: `${showsInList} show${showsInList === 1 ? '' : 's'} · ${entries} entr${
        entries === 1 ? 'y' : 'ies'
      }`,
      color: themeColor(theme.sentiment),
      href: `/themes/${theme.slug}`,
    })
  }

  // Tier pseudo-results — each tier links to /shows. The `meta`
  // surfaces how many shows live in that tier today.
  const tierCounts: Record<ShowTier, number> = { S: 0, A: 0, B: 0 }
  for (const show of shows) tierCounts[show.tier]++
  for (const tier of TIER_ORDER) {
    const count = tierCounts[tier]
    if (count === 0) continue
    const meta = tierMeta(tier)
    out.push({
      type: 'tier',
      name: `${tier} tier`,
      meta: `${count} show${count === 1 ? '' : 's'} · ${meta.tag.toLowerCase()}`,
      color: '#E8B65A',
      href: `/shows#tier-${tier}`,
    })
  }

  // Touch the showByslug ref so TS keeps the lookup map for future
  // consumers (e.g. when seasons grow a show-name field of their own).
  void showByslug

  return out
}

const SENTIMENT_COLORS: Record<string, string> = {
  'warm-up': '#E0843A',
  'warm-down': '#5A8FA6',
  neutral: '#8C8275',
  hold: '#7A8F5C',
  verdict: '#B57FB8',
  consensus: '#D5A93D',
}

function themeColor(sentiment: string | undefined): string {
  if (sentiment && SENTIMENT_COLORS[sentiment]) return SENTIMENT_COLORS[sentiment]
  return '#E8B65A'
}
