import { describe, expect, it } from 'vitest'
import type { CanonEntry, EraBand, Season } from '@/content'
import { eraKeyForYear, makeEraOf, yearOfSeason } from '../era-bands'

const BANDS: EraBand[] = [
  { key: 'pioneer', label: 'Pioneer', range: [2000, 2003] },
  { key: 'classic', label: 'Classic', range: [2004, 2009] },
  { key: 'new-era', label: 'New era', range: [2021, 2026] },
]

function season(number: number, premiere_date: string | null): Season {
  return { number, premiere_date } as unknown as Season
}

function entry(seasonNumber: number): CanonEntry {
  return { rank: 1, season: seasonNumber, title: 't', rationale: 'r' } as CanonEntry
}

describe('yearOfSeason', () => {
  it('extracts the UTC year from premiere_date', () => {
    expect(yearOfSeason(season(1, '2002-08-29'))).toBe(2002)
  })

  it('returns undefined when the season or date is missing', () => {
    expect(yearOfSeason(undefined)).toBeUndefined()
    expect(yearOfSeason(season(1, null))).toBeUndefined()
  })
})

describe('eraKeyForYear', () => {
  it('matches a year inside an inclusive band range', () => {
    expect(eraKeyForYear(2000, BANDS)).toBe('pioneer')
    expect(eraKeyForYear(2003, BANDS)).toBe('pioneer')
    expect(eraKeyForYear(2004, BANDS)).toBe('classic')
  })

  it('returns undefined for an uncovered year or unknown year', () => {
    expect(eraKeyForYear(2015, BANDS)).toBeUndefined()
    expect(eraKeyForYear(undefined, BANDS)).toBeUndefined()
  })
})

describe('makeEraOf', () => {
  it('derives the era key for an entry from its season premiere year', () => {
    const seasonOf = (e: CanonEntry) =>
      e.season === 1 ? season(1, '2001-01-01') : season(2, '2022-05-01')
    const eraOf = makeEraOf(seasonOf, BANDS)
    expect(eraOf(entry(1))).toBe('pioneer')
    expect(eraOf(entry(2))).toBe('new-era')
  })

  it('is a constant no-op when no era bands are authored', () => {
    const eraOf = makeEraOf(() => season(1, '2001-01-01'), [])
    expect(eraOf(entry(1))).toBeUndefined()
  })
})
