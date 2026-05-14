import { describe, expect, it } from 'vitest'
import { computeYearsOnAir } from './show-format'

describe('computeYearsOnAir', () => {
  it('returns "<min>–present" when status is airing', () => {
    const seasons = [
      { premiere_date: '2000-05-31' },
      { premiere_date: '2023-09-27' },
    ]
    expect(computeYearsOnAir(seasons, 'airing')).toBe('2000–present')
  })

  it('renders "present" even if airing show has only one season', () => {
    const seasons = [{ premiere_date: '2024-01-15' }]
    expect(computeYearsOnAir(seasons, 'airing')).toBe('2024–present')
  })

  it('returns "<min>–<max>" when status is ended', () => {
    const seasons = [
      { premiere_date: '2009-02-12' },
      { premiere_date: '2020-08-12' },
    ]
    expect(computeYearsOnAir(seasons, 'ended')).toBe('2009–2020')
  })

  it('returns a single year when ended show has one year', () => {
    const seasons = [{ premiere_date: '2018-06-01' }]
    expect(computeYearsOnAir(seasons, 'ended')).toBe('2018')
  })

  it('returns "<min>–<max>" when status is hiatus', () => {
    const seasons = [
      { premiere_date: '2014-07-01' },
      { premiere_date: '2019-04-01' },
    ]
    expect(computeYearsOnAir(seasons, 'hiatus')).toBe('2014–2019')
  })

  it('falls back to em-dash when no premiere dates known', () => {
    const seasons = [{ premiere_date: undefined }, {}]
    expect(computeYearsOnAir(seasons, 'airing')).toBe('—')
    expect(computeYearsOnAir([], 'ended')).toBe('—')
  })

  it('ignores seasons with missing dates but uses any present', () => {
    const seasons = [
      { premiere_date: undefined },
      { premiere_date: '2017-02-08' },
    ]
    expect(computeYearsOnAir(seasons, 'airing')).toBe('2017–present')
  })
})
