import { describe, expect, it } from 'vitest'
import { parseIsoDate, seasonDate, yearStart } from '../dates'

describe('parseIsoDate', () => {
  it('parses a valid ISO date at UTC midnight', () => {
    const d = parseIsoDate('2026-05-17')
    expect(d?.toISOString()).toBe('2026-05-17T00:00:00.000Z')
  })

  it('rejects malformed / empty / nullish input', () => {
    expect(parseIsoDate('2026-5-1')).toBeNull()
    expect(parseIsoDate('not-a-date')).toBeNull()
    expect(parseIsoDate('')).toBeNull()
    expect(parseIsoDate(undefined)).toBeNull()
    expect(parseIsoDate(null)).toBeNull()
  })

  it('rejects an ISO-shaped but impossible date', () => {
    expect(parseIsoDate('2026-13-40')).toBeNull()
  })
})

describe('yearStart', () => {
  it('returns Jan 1 UTC of the year', () => {
    expect(yearStart(2000).toISOString()).toBe('2000-01-01T00:00:00.000Z')
  })
})

describe('seasonDate', () => {
  it('prefers premiere_date', () => {
    expect(
      seasonDate({ premiere_date: '2024-06-03', aired_year: 2024 }, 2000)
        .toISOString(),
    ).toBe('2024-06-03T00:00:00.000Z')
  })

  it('falls back to aired_year when premiere_date is absent/invalid', () => {
    expect(
      seasonDate({ aired_year: 2019 }, 2000).toISOString(),
    ).toBe('2019-01-01T00:00:00.000Z')
    expect(
      seasonDate({ premiere_date: 'bad', aired_year: 2019 }, 2000)
        .toISOString(),
    ).toBe('2019-01-01T00:00:00.000Z')
  })

  it('falls back to the show est_year when nothing else resolves', () => {
    expect(seasonDate({}, 2001).toISOString()).toBe(
      '2001-01-01T00:00:00.000Z',
    )
  })
})
