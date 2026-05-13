import { describe, expect, it } from 'vitest'
import {
  filterModeText,
  formatRevisedAgo,
  formatRevisedYear,
  formatThemeStatus,
  GROUP_HEAD_LABELS,
  plural,
} from '../themes-format'

describe('formatRevisedYear', () => {
  it('returns the year from an ISO date', () => {
    expect(formatRevisedYear('2026-05-01')).toBe('2026')
    expect(formatRevisedYear('2023-01-15')).toBe('2023')
  })

  it('returns empty for empty input', () => {
    expect(formatRevisedYear('')).toBe('')
  })
})

describe('formatRevisedAgo', () => {
  const today = new Date('2026-05-13T00:00:00Z')

  it('returns "this week" within 7 days', () => {
    expect(formatRevisedAgo('2026-05-10', today)).toBe('this week')
    expect(formatRevisedAgo('2026-05-13', today)).toBe('this week')
  })

  it('returns "this month" within 31 days', () => {
    expect(formatRevisedAgo('2026-04-20', today)).toBe('this month')
  })

  it('returns "this year" beyond 31 days', () => {
    expect(formatRevisedAgo('2026-01-01', today)).toBe('this year')
    expect(formatRevisedAgo('2024-08-01', today)).toBe('this year')
  })
})

describe('formatThemeStatus', () => {
  const today = new Date('2026-05-13T00:00:00Z')

  it('growing → "growing"', () => {
    expect(formatThemeStatus('growing', '2026-05-01', today)).toBe('growing')
  })

  it('stable → "stable list"', () => {
    expect(formatThemeStatus('stable', '2026-05-01', today)).toBe('stable list')
  })

  it('updated → "updated {ago-label}"', () => {
    expect(formatThemeStatus('updated', '2026-05-10', today)).toBe(
      'updated this week',
    )
    expect(formatThemeStatus('updated', '2026-04-20', today)).toBe(
      'updated this month',
    )
    expect(formatThemeStatus('updated', '2024-08-01', today)).toBe(
      'updated this year',
    )
  })

  it('started → "started {YYYY}"', () => {
    expect(formatThemeStatus('started', '2023-08-15', today)).toBe(
      'started 2023',
    )
  })
})

describe('filterModeText', () => {
  it('formats "all" mode with total count', () => {
    expect(
      filterModeText('all', { all: 12, tone: 4, craft: 3, era: 2, single: 3 }),
    ).toBe('view · all 12 lists')
  })

  it('formats a single category mode', () => {
    expect(
      filterModeText('tone', { all: 12, tone: 4, craft: 3, era: 2, single: 3 }),
    ).toBe('view · 4 tone lists')
    expect(
      filterModeText('single', { all: 12, tone: 4, craft: 3, era: 2, single: 3 }),
    ).toBe('view · 3 single-show lists')
  })
})

describe('GROUP_HEAD_LABELS', () => {
  it('uses "Single-show pantheons" — not "By single"', () => {
    expect(GROUP_HEAD_LABELS.single).toBe('Single-show pantheons')
  })
})

describe('plural', () => {
  it('returns singular at 1', () => {
    expect(plural(1, 'entry', 'entries')).toBe('entry')
  })

  it('returns plural at !=1', () => {
    expect(plural(0, 'entry', 'entries')).toBe('entries')
    expect(plural(2, 'entry', 'entries')).toBe('entries')
  })
})
