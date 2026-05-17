import { describe, expect, it } from 'vitest'
import type { CanonEntry, EraBand, Season } from '@/content'
import {
  eraKeyForYear,
  makeEraOf,
  validateEraBandCoverage,
  yearOfSeason,
} from '../era-bands'

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

describe('validateEraBandCoverage', () => {
  const contiguous: EraBand[] = [
    { key: 'a', label: 'A', range: [2000, 2003] },
    { key: 'b', label: 'B', range: [2004, 2009] },
    { key: 'c', label: 'C', range: [2010, 2024] },
  ]

  it('passes for gap-free, overlap-free bands that cover the aired span', () => {
    expect(validateEraBandCoverage(contiguous, [2000, 2012, 2024])).toEqual([])
  })

  it('tolerates bands that start before the first aired season (superset)', () => {
    // The Challenge: bands open at 1998 but the first seeded season is 2011.
    const bands: EraBand[] = [
      { key: 'founding', label: 'Founding', range: [1998, 2010] },
      { key: 'modern', label: 'Modern', range: [2011, 2024] },
    ]
    expect(validateEraBandCoverage(bands, [2011, 2020, 2024])).toEqual([])
  })

  it('returns no problems when there are no bands (absence judged by caller)', () => {
    expect(validateEraBandCoverage([], [2001, 2002])).toEqual([])
  })

  it('flags a gap between adjacent bands', () => {
    const gapped: EraBand[] = [
      { key: 'a', label: 'A', range: [2003, 2005] },
      { key: 'b', label: 'B', range: [2008, 2014] },
    ]
    const problems = validateEraBandCoverage(gapped, [2003, 2010])
    expect(problems.some((p) => /gap between "a".*"b"/.test(p))).toBe(true)
  })

  it('flags overlapping bands', () => {
    const overlap: EraBand[] = [
      { key: 'a', label: 'A', range: [2000, 2006] },
      { key: 'b', label: 'B', range: [2004, 2010] },
    ]
    const problems = validateEraBandCoverage(overlap, [2002, 2008])
    expect(problems.some((p) => /overlap/.test(p))).toBe(true)
  })

  it('flags an inverted single band range', () => {
    const inverted: EraBand[] = [{ key: 'a', label: 'A', range: [2010, 2000] }]
    const problems = validateEraBandCoverage(inverted, [2005])
    expect(problems.some((p) => /inverted range/.test(p))).toBe(true)
  })

  it('flags bands that stop before the latest aired season', () => {
    // Stale bachelorette case: modern era ends 2023, S21 aired 2024.
    const stale: EraBand[] = [
      { key: 'founding', label: 'Founding', range: [2003, 2007] },
      { key: 'modern', label: 'Modern', range: [2008, 2023] },
    ]
    const problems = validateEraBandCoverage(stale, [2003, 2015, 2024])
    expect(problems.some((p) => /end at 2023.*latest aired season is 2024/.test(p))).toBe(
      true,
    )
  })

  it('flags bands that start after the earliest aired season', () => {
    const lateStart: EraBand[] = [
      { key: 'modern', label: 'Modern', range: [2010, 2024] },
    ]
    const problems = validateEraBandCoverage(lateStart, [2005, 2020])
    expect(
      problems.some((p) => /start at 2010.*earliest aired season is 2005/.test(p)),
    ).toBe(true)
  })
})
