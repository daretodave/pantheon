import { describe, expect, it } from 'vitest'
import {
  buildTierBands,
  tierKeyForRank,
  tierRangeLabel,
  type TierKey,
} from '../tier-bands'
import type { CanonEntry } from '@/content'

function entry(rank: number): CanonEntry {
  return {
    rank,
    season: rank,
    title: `Season ${rank}`,
    rationale:
      'eighty to one hundred and twenty words of rationale would normally live here, but for unit-test purposes any non-empty body is enough to satisfy the renderer downstream. eighty to one hundred and twenty words. eighty to one hundred and twenty words. eighty to one hundred and twenty words. eighty to one hundred and twenty.',
  }
}

describe('tierKeyForRank', () => {
  it('maps ranks to S/A/B/C', () => {
    const cases: Array<[number, TierKey]> = [
      [1, 'S'],
      [5, 'S'],
      [6, 'A'],
      [15, 'A'],
      [16, 'B'],
      [30, 'B'],
      [31, 'C'],
      [99, 'C'],
    ]
    for (const [rank, expected] of cases) {
      expect(tierKeyForRank(rank)).toBe(expected)
    }
  })
})

describe('buildTierBands', () => {
  it('groups entries by tier and sorts within tier', () => {
    const entries = [entry(7), entry(2), entry(1), entry(20), entry(31), entry(6)]
    const bands = buildTierBands(entries)
    expect(bands.map((b) => b.key)).toEqual(['S', 'A', 'B', 'C'])
    expect(bands[0]?.entries.map((e) => e.rank)).toEqual([1, 2])
    expect(bands[1]?.entries.map((e) => e.rank)).toEqual([6, 7])
    expect(bands[2]?.entries.map((e) => e.rank)).toEqual([20])
    expect(bands[3]?.entries.map((e) => e.rank)).toEqual([31])
  })

  it('omits empty tiers', () => {
    const entries = [entry(1), entry(2), entry(20)]
    const bands = buildTierBands(entries)
    expect(bands.map((b) => b.key)).toEqual(['S', 'B'])
  })

  it('passes blurbs through to the matching tier', () => {
    const entries = [entry(1)]
    const bands = buildTierBands(entries, { s: 'S band hand-authored blurb' })
    expect(bands[0]?.blurb).toBe('S band hand-authored blurb')
  })
})

describe('tierRangeLabel', () => {
  it('formats a range as 01 — 05', () => {
    const bands = buildTierBands([entry(1), entry(2), entry(3), entry(4), entry(5)])
    expect(tierRangeLabel(bands[0]!)).toBe('01 — 05')
  })
  it('renders single-entry as the padded rank', () => {
    const bands = buildTierBands([entry(31)])
    expect(tierRangeLabel(bands[0]!)).toBe('31')
  })
})
