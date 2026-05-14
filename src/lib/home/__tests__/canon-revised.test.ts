import { describe, expect, it } from 'vitest'
import { formatCanonRevisedLabel } from '../canon-revised'

describe('formatCanonRevisedLabel', () => {
  it('formats April 2026 as "04 / 26"', () => {
    expect(formatCanonRevisedLabel(new Date('2026-04-12T00:00:00Z'))).toBe(
      '04 / 26',
    )
  })

  it('zero-pads single-digit months', () => {
    expect(formatCanonRevisedLabel(new Date('2026-01-01T12:00:00Z'))).toBe(
      '01 / 26',
    )
  })

  it('shows two-digit year for years beyond the century', () => {
    expect(formatCanonRevisedLabel(new Date('2030-12-31T12:00:00Z'))).toBe(
      '12 / 30',
    )
  })
})
