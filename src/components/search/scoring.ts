import type { SearchIndexItem, SearchIndexItemType } from '@/lib/searchIndex'

// Lightweight matcher used by the cmd+K overlay. Mirrors the
// scoring rules in `design/tiered.tv · Home.html`:
//   - exact name match           → 1000
//   - name prefix                →  500
//   - word-boundary prefix       →  300
//   - name substring             →  100
//   - meta substring             →   20
// The richer ranked search lives in `src/lib/search.ts`; the
// overlay is intentionally simple so a stale match feels instant.

const TYPE_ORDER: readonly SearchIndexItemType[] = ['show', 'season', 'list', 'tier']

const WORD_SPLIT = /[\s.]+/

export function scoreItem(item: SearchIndexItem, qLower: string): number {
  if (!qLower) return 1
  const nameLower = item.name.toLowerCase()
  if (nameLower === qLower) return 1000
  if (nameLower.startsWith(qLower)) return 500
  const words = nameLower.split(WORD_SPLIT)
  if (words.some((w) => w.startsWith(qLower))) return 300
  if (nameLower.includes(qLower)) return 100
  if (item.meta.toLowerCase().includes(qLower)) return 20
  return 0
}

export type SearchFilter = SearchIndexItemType | 'all'

export function filterAndRank(
  items: readonly SearchIndexItem[],
  query: string,
  filter: SearchFilter,
): SearchIndexItem[] {
  const qLower = query.trim().toLowerCase()
  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter)
  if (qLower.length === 0) return [...filtered]
  const scored: { item: SearchIndexItem; score: number; tieIdx: number }[] = []
  filtered.forEach((item, tieIdx) => {
    const score = scoreItem(item, qLower)
    if (score > 0) scored.push({ item, score, tieIdx })
  })
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.tieIdx - b.tieIdx
  })
  return scored.map((s) => s.item)
}

export function groupByType(
  items: readonly SearchIndexItem[],
): Record<SearchIndexItemType, SearchIndexItem[]> {
  const groups: Record<SearchIndexItemType, SearchIndexItem[]> = {
    show: [],
    season: [],
    list: [],
    tier: [],
  }
  for (const item of items) groups[item.type].push(item)
  return groups
}

export const TYPE_DISPLAY: Record<SearchIndexItemType, string> = {
  show: 'Shows',
  season: 'Seasons',
  list: 'Lists',
  tier: 'Tiers',
}

export const SEARCH_TYPE_ORDER = TYPE_ORDER
