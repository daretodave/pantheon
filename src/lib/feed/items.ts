import { getAllSeasons, getAllShows, getAllThemes, getCanon, getShow } from '@/content'
import type { CanonFile } from '@/content'
import { canonicalUrl } from '@/lib/seo'
import type { FeedItem } from './rss'
import { parseIsoDate, seasonDate } from './dates'

// RSS convention — keep feeds bounded. Per-show feeds are well
// under this; the global feed gets the newest 50 items.
export const FEED_LIMIT = 50

// First sentence of a content blurb, whitespace-collapsed, bounded.
// The source is already P0 spoiler-clean (season blurb / theme
// description / canon editor line) so no extra scrubbing is needed.
function summarize(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const m = clean.match(/^.*?[.!?](?=\s|$)/)
  return (m ? m[0] : clean).slice(0, 300)
}

function seasonItems(
  showSlug: string,
  showName: string,
  estYear: number,
): FeedItem[] {
  return getAllSeasons(showSlug).map((s) => ({
    title: `${showName} — ${s.title}`,
    url: canonicalUrl(`/shows/${showSlug}/season/${s.slug}`),
    date: seasonDate(s, estYear),
    description: summarize(s.lede ?? s.blurb_md),
  }))
}

function canonItem(
  showSlug: string,
  showName: string,
  canon: CanonFile | null,
): FeedItem | null {
  if (!canon?.last_revised) return null
  const d = parseIsoDate(canon.last_revised)
  if (!d) return null
  return {
    title: `${showName} — Editor's Canon revised`,
    // #canon fragment keeps this guid distinct from the show's
    // other items while still dereferencing to the live ranking.
    url: `${canonicalUrl(`/shows/${showSlug}`)}#canon`,
    date: d,
    description: `The ${showName} Editor's Canon was revised${
      canon.editor ? ` by ${canon.editor}` : ''
    }.`,
  }
}

function themeItem(theme: {
  slug: string
  title: string
  description: string
  last_revised: string
}): FeedItem {
  return {
    title: theme.title,
    url: canonicalUrl(`/themes/${theme.slug}`),
    date: parseIsoDate(theme.last_revised) ?? new Date(0),
    description: summarize(theme.description),
  }
}

// Newest first; guid asc tiebreak for total determinism.
function sortCap(items: FeedItem[]): FeedItem[] {
  return [...items]
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime() || a.url.localeCompare(b.url),
    )
    .slice(0, FEED_LIMIT)
}

export function buildGlobalFeedItems(): FeedItem[] {
  const out: FeedItem[] = []
  for (const show of getAllShows()) {
    out.push(...seasonItems(show.slug, show.name, show.est_year))
    const c = canonItem(show.slug, show.name, getCanon(show.slug))
    if (c) out.push(c)
  }
  for (const t of getAllThemes()) out.push(themeItem(t))
  return sortCap(out)
}

// null == unknown show (the route turns this into a 404).
export function buildShowFeedItems(showSlug: string): FeedItem[] | null {
  const show = getShow(showSlug)
  if (!show) return null
  const out: FeedItem[] = [...seasonItems(show.slug, show.name, show.est_year)]
  const c = canonItem(show.slug, show.name, getCanon(show.slug))
  if (c) out.push(c)
  return sortCap(out)
}
