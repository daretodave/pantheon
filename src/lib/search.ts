import { getAllSeasons, getAllShows, getAllThemes } from '@/content'
import type { Season, Show, Theme } from '@/content'

// In-memory search lib. Walks loaded content at request time
// and serves a ranked hit list. v1 — fine for ~10 docs; the
// search() API is the seam for a future Supabase-fulltext
// migration when content count justifies it.

export type SearchHit =
  | {
      type: 'show'
      slug: string
      title: string
      href: string
      snippet: string
      score: number
    }
  | {
      type: 'season'
      show: string
      number: number
      title: string
      href: string
      snippet: string
      score: number
    }
  | {
      type: 'theme'
      slug: string
      title: string
      href: string
      snippet: string
      score: number
    }

export type SearchOptions = {
  limit?: number
}

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'from',
  'by',
  'with',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

const TITLE_WEIGHT = 10
const TAGLINE_WEIGHT = 5
const META_WEIGHT = 3 // location, host, format
const BLURB_WEIGHT = 2
const BODY_WEIGHT = 1

type FieldHit = { tokens: Set<string>; weight: number; text: string }

function fieldMatches(field: string, queryTokens: Set<string>): Set<string> {
  const hits = new Set<string>()
  const fieldTokens = new Set(tokenize(field))
  for (const q of queryTokens) {
    if (fieldTokens.has(q)) hits.add(q)
  }
  return hits
}

function scoreFields(
  fields: { text: string; weight: number }[],
  queryTokens: Set<string>,
): { score: number; matched: Set<string>; firstHitField: string | null } {
  let score = 0
  const matched = new Set<string>()
  let firstHitField: string | null = null
  for (const f of fields) {
    const hits = fieldMatches(f.text, queryTokens)
    if (hits.size > 0) {
      score += hits.size * f.weight
      for (const h of hits) matched.add(h)
      if (firstHitField === null) firstHitField = f.text
    }
  }
  return { score, matched, firstHitField }
}

function snippetFromField(field: string, matched: Set<string>): string {
  const lower = field.toLowerCase()
  for (const token of matched) {
    const idx = lower.indexOf(token)
    if (idx === -1) continue
    const start = Math.max(0, idx - 60)
    const end = Math.min(field.length, idx + token.length + 60)
    const prefix = start === 0 ? '' : '…'
    const suffix = end === field.length ? '' : '…'
    return `${prefix}${field.slice(start, end)}${suffix}`
  }
  return field.length > 120 ? `${field.slice(0, 117)}…` : field
}

function scoreShow(show: Show, queryTokens: Set<string>): SearchHit | null {
  const fields: { text: string; weight: number }[] = [
    { text: show.name, weight: TITLE_WEIGHT },
    { text: show.slug, weight: TITLE_WEIGHT },
    { text: show.tagline, weight: TAGLINE_WEIGHT },
    { text: show.blurb, weight: BLURB_WEIGHT },
  ]
  const { score, matched, firstHitField } = scoreFields(fields, queryTokens)
  if (score === 0) return null
  const snippet = firstHitField
    ? snippetFromField(firstHitField, matched)
    : show.tagline
  return {
    type: 'show',
    slug: show.slug,
    title: show.name,
    href: `/shows/${show.slug}`,
    snippet,
    score,
  }
}

function scoreSeason(season: Season, queryTokens: Set<string>): SearchHit | null {
  const fields: { text: string; weight: number }[] = [
    { text: season.title, weight: TITLE_WEIGHT },
    { text: `${season.show} season ${season.number}`, weight: META_WEIGHT },
    ...(season.location ? [{ text: season.location, weight: META_WEIGHT }] : []),
    ...(season.host ? [{ text: season.host, weight: META_WEIGHT }] : []),
    { text: season.blurb_md, weight: BLURB_WEIGHT },
    ...season.format_changes.map((c) => ({ text: c, weight: BODY_WEIGHT })),
  ]
  const { score, matched, firstHitField } = scoreFields(fields, queryTokens)
  if (score === 0) return null
  const snippet = firstHitField ? snippetFromField(firstHitField, matched) : season.title
  return {
    type: 'season',
    show: season.show,
    number: season.number,
    title: season.title,
    href: `/shows/${season.show}/season/${season.number}`,
    snippet,
    score,
  }
}

function scoreTheme(theme: Theme, queryTokens: Set<string>): SearchHit | null {
  const fields: { text: string; weight: number }[] = [
    { text: theme.title, weight: TITLE_WEIGHT },
    { text: theme.slug, weight: TITLE_WEIGHT },
    { text: theme.description, weight: TAGLINE_WEIGHT },
    ...theme.entries.map((e) => ({ text: e.blurb, weight: BLURB_WEIGHT })),
    ...theme.entries.map((e) => ({ text: e.show, weight: META_WEIGHT })),
  ]
  const { score, matched, firstHitField } = scoreFields(fields, queryTokens)
  if (score === 0) return null
  const snippet = firstHitField ? snippetFromField(firstHitField, matched) : theme.description
  return {
    type: 'theme',
    slug: theme.slug,
    title: theme.title,
    href: `/themes/${theme.slug}`,
    snippet,
    score,
  }
}

const TYPE_RANK: Record<SearchHit['type'], number> = {
  show: 0,
  season: 1,
  theme: 2,
}

function compareHits(a: SearchHit, b: SearchHit): number {
  if (a.score !== b.score) return b.score - a.score
  if (a.type !== b.type) return TYPE_RANK[a.type] - TYPE_RANK[b.type]
  return a.title.localeCompare(b.title)
}

export function search(query: string, opts: SearchOptions = {}): SearchHit[] {
  const tokens = new Set(tokenize(query))
  if (tokens.size === 0) return []

  const hits: SearchHit[] = []
  for (const show of getAllShows()) {
    const h = scoreShow(show, tokens)
    if (h) hits.push(h)
  }
  for (const show of getAllShows()) {
    for (const season of getAllSeasons(show.slug)) {
      const h = scoreSeason(season, tokens)
      if (h) hits.push(h)
    }
  }
  for (const theme of getAllThemes()) {
    const h = scoreTheme(theme, tokens)
    if (h) hits.push(h)
  }

  hits.sort(compareHits)
  const limit = opts.limit ?? 20
  return hits.slice(0, limit)
}

export function groupByType(hits: SearchHit[]): {
  shows: SearchHit[]
  seasons: SearchHit[]
  themes: SearchHit[]
} {
  const shows = hits.filter((h) => h.type === 'show')
  const seasons = hits.filter((h) => h.type === 'season')
  const themes = hits.filter((h) => h.type === 'theme')
  return { shows, seasons, themes }
}
