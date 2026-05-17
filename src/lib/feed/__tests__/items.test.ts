import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { __resetContentCache, setContentRoot } from '@/content'
import {
  FEED_LIMIT,
  buildGlobalFeedItems,
  buildShowFeedItems,
} from '../items'

const FIXTURE_ROOT = path.resolve(__dirname, '../../../../content')

beforeAll(() => {
  setContentRoot(FIXTURE_ROOT)
  __resetContentCache()
})

afterAll(() => {
  setContentRoot(null)
  __resetContentCache()
})

describe('buildGlobalFeedItems', () => {
  const items = buildGlobalFeedItems()

  it('is non-empty and capped at FEED_LIMIT', () => {
    expect(items.length).toBeGreaterThan(0)
    expect(items.length).toBeLessThanOrEqual(FEED_LIMIT)
  })

  it('is sorted newest-first with a stable url tiebreak', () => {
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]
      const cur = items[i]
      if (prev === undefined || cur === undefined) continue
      const a = prev.date.getTime()
      const b = cur.date.getTime()
      expect(a).toBeGreaterThanOrEqual(b)
      if (a === b) expect(prev.url.localeCompare(cur.url)).toBeLessThanOrEqual(0)
    }
  })

  it('every item has an absolute https url, title and description', () => {
    for (const it of items) {
      expect(it.url).toMatch(/^https:\/\/tiered\.tv\//)
      expect(it.title.length).toBeGreaterThan(0)
      expect(it.description.length).toBeGreaterThan(0)
      expect(Number.isNaN(it.date.getTime())).toBe(false)
    }
  })

  it('mixes seasons and themed lists', () => {
    expect(items.some((i) => i.url.includes('/season/'))).toBe(true)
    expect(items.some((i) => i.url.includes('/themes/'))).toBe(true)
  })
})

describe('buildShowFeedItems', () => {
  it('returns only that show plus its canon revision', () => {
    const items = buildShowFeedItems('survivor')
    expect(items).not.toBeNull()
    const list = items ?? []
    expect(list.length).toBeGreaterThan(0)
    for (const it of list) {
      expect(it.url).toContain('/shows/survivor')
    }
    // survivor/canon.md carries last_revised → canon revision item
    // is present, guid distinguished by the #canon fragment.
    expect(list.some((i) => i.url.endsWith('/shows/survivor#canon'))).toBe(true)
  })

  it('returns null for an unknown show', () => {
    expect(buildShowFeedItems('does-not-exist')).toBeNull()
  })
})
