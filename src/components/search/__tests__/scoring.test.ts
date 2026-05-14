import { describe, expect, it } from 'vitest'
import type { SearchIndexItem } from '@/lib/searchIndex'
import {
  TYPE_DISPLAY,
  SEARCH_TYPE_ORDER,
  filterAndRank,
  groupByType,
  scoreItem,
} from '../scoring'

const SAMPLE: SearchIndexItem[] = [
  { type: 'show', name: 'Survivor', meta: '47 seasons', color: '#000', href: '/shows/survivor' },
  { type: 'show', name: 'Top Chef', meta: '21 seasons', color: '#000', href: '/shows/top-chef' },
  { type: 'show', name: 'The Amazing Race', meta: '36 seasons', color: '#000', href: '/shows/amazing-race' },
  {
    type: 'season',
    name: 'Heroes vs. Villains',
    meta: 'Survivor · season 20',
    color: '#000',
    href: '/shows/survivor/season/20',
    tier: 'S',
  },
  { type: 'list', name: 'Best premieres ever', meta: '3 shows · 18 entries', color: '#000', href: '/themes/best-premieres' },
  { type: 'tier', name: 'S tier', meta: '2 shows · format-defining', color: '#000', href: '/shows#tier-S' },
]

describe('scoreItem', () => {
  it('rewards exact name match highest', () => {
    expect(scoreItem(SAMPLE[0]!, 'survivor')).toBe(1000)
  })

  it('rewards prefix matches', () => {
    expect(scoreItem(SAMPLE[0]!, 'surv')).toBe(500)
  })

  it('rewards word-boundary prefix matches', () => {
    expect(scoreItem(SAMPLE[2]!, 'amaz')).toBe(300)
    expect(scoreItem(SAMPLE[2]!, 'race')).toBe(300)
  })

  it('still matches name substring', () => {
    expect(scoreItem(SAMPLE[3]!, 'villain')).toBeGreaterThan(0)
  })

  it('falls back to meta match', () => {
    expect(scoreItem(SAMPLE[3]!, 'season 20')).toBe(20)
  })

  it('returns 0 when nothing matches', () => {
    expect(scoreItem(SAMPLE[0]!, 'zzzz')).toBe(0)
  })
})

describe('filterAndRank', () => {
  it('returns every item with the all filter when query is empty', () => {
    const out = filterAndRank(SAMPLE, '', 'all')
    expect(out.length).toBe(SAMPLE.length)
  })

  it('narrows by filter type', () => {
    const out = filterAndRank(SAMPLE, '', 'show')
    expect(out.every((i) => i.type === 'show')).toBe(true)
    expect(out.length).toBe(3)
  })

  it('orders by score, highest first', () => {
    const out = filterAndRank(SAMPLE, 'survivor', 'all')
    expect(out[0]?.name).toBe('Survivor')
  })

  it('omits zero-score items when a query is given', () => {
    const out = filterAndRank(SAMPLE, 'survivor', 'all')
    expect(out.every((i) => i.name.toLowerCase().includes('survivor') || i.meta.toLowerCase().includes('survivor'))).toBe(
      true,
    )
  })
})

describe('groupByType', () => {
  it('buckets items into the four supported types', () => {
    const grouped = groupByType(SAMPLE)
    expect(grouped.show.length).toBe(3)
    expect(grouped.season.length).toBe(1)
    expect(grouped.list.length).toBe(1)
    expect(grouped.tier.length).toBe(1)
  })
})

describe('constants', () => {
  it('exposes a stable display label per type', () => {
    expect(TYPE_DISPLAY.show).toBe('Shows')
    expect(TYPE_DISPLAY.season).toBe('Seasons')
    expect(TYPE_DISPLAY.list).toBe('Lists')
    expect(TYPE_DISPLAY.tier).toBe('Tiers')
  })

  it('renders types in show → season → list → tier order', () => {
    expect([...SEARCH_TYPE_ORDER]).toEqual(['show', 'season', 'list', 'tier'])
  })
})
