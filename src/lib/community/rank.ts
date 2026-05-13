import type { CanonFile, Season, Show } from '@/content'

export type CommunityRankSource = 'canon' | 'seasons' | 'votes'

export type CommunityRankEntry = {
  rank: number
  season: Season
  tag: string
}

export type CommunityRankResult = {
  entries: CommunityRankEntry[]
  source: CommunityRankSource
}

function tagForSeason(season: Season, show: Show): string {
  if (season.premiere_date) {
    return new Date(season.premiere_date).getUTCFullYear().toString()
  }
  return show.format
}

export function computeCommunityRank(
  show: Show,
  seasons: Season[],
  canon: CanonFile | null,
): CommunityRankResult {
  if (seasons.length === 0) {
    return { entries: [], source: 'seasons' }
  }

  const seasonByNumber = new Map<number, Season>()
  for (const s of seasons) seasonByNumber.set(s.number, s)

  if (canon && canon.entries.length > 0) {
    const sorted = [...canon.entries].sort((a, b) => a.rank - b.rank)
    const seen = new Set<number>()
    const entries: CommunityRankEntry[] = []
    for (const c of sorted) {
      const season = seasonByNumber.get(c.season)
      if (!season || seen.has(c.season)) continue
      seen.add(c.season)
      entries.push({ rank: entries.length + 1, season, tag: tagForSeason(season, show) })
    }
    const trailing = [...seasons]
      .filter((s) => !seen.has(s.number))
      .sort((a, b) => a.number - b.number)
    for (const season of trailing) {
      entries.push({ rank: entries.length + 1, season, tag: tagForSeason(season, show) })
    }
    return { entries, source: 'canon' }
  }

  const ordered = [...seasons].sort((a, b) => a.number - b.number)
  return {
    entries: ordered.map((season, ix) => ({
      rank: ix + 1,
      season,
      tag: tagForSeason(season, show),
    })),
    source: 'seasons',
  }
}

export function sourceBannerCopy(source: CommunityRankSource): string {
  switch (source) {
    case 'canon':
      return "Mirrors the Editor's Canon until enough community votes land."
    case 'votes':
      return 'Updated as the votes come in.'
    case 'seasons':
      return 'Showing seasons in air order until enough community votes land.'
  }
}
