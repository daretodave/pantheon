import { describe, expect, it } from 'vitest'
import { highlightSegments } from '../highlight'

describe('highlightSegments', () => {
  it('returns the whole text as one non-match segment when query is empty', () => {
    expect(highlightSegments('Survivor', '')).toEqual([
      { text: 'Survivor', match: false },
    ])
  })

  it('splits around a single case-insensitive match', () => {
    expect(highlightSegments('Survivor', 'surv')).toEqual([
      { text: 'Surv', match: true },
      { text: 'ivor', match: false },
    ])
  })

  it('handles multiple occurrences', () => {
    expect(highlightSegments('abacus', 'a')).toEqual([
      { text: 'a', match: true },
      { text: 'b', match: false },
      { text: 'a', match: true },
      { text: 'cus', match: false },
    ])
  })

  it('preserves text when no match', () => {
    expect(highlightSegments('Survivor', 'zz')).toEqual([
      { text: 'Survivor', match: false },
    ])
  })
})
