import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanonMidEntries } from '../CanonMidEntries'
import type { CanonEntry } from '@/content'

function e(rank: number): CanonEntry {
  return {
    rank,
    season: rank,
    title: `Season ${rank}`,
    rationale: 'rationale body for the renderer',
  }
}

describe('<CanonMidEntries>', () => {
  it('renders one row per entry', () => {
    render(
      <CanonMidEntries
        entries={[e(6), e(7), e(8)]}
        seasonHref={() => '/x'}
        seasonOf={() => undefined}
        eraOf={() => undefined}
      />,
    )
    const rows = screen.getAllByTestId('canon-mid-entry')
    expect(rows).toHaveLength(3)
    expect(rows[0]?.querySelector('.cp-mid-rank')).toHaveTextContent('06')
    expect(rows[1]?.querySelector('.cp-mid-rank')).toHaveTextContent('07')
  })

  it('stacks the season tag under the rank numeral', () => {
    render(
      <CanonMidEntries
        entries={[e(6)]}
        seasonHref={() => '/x'}
        seasonOf={() => undefined}
        eraOf={() => undefined}
      />,
    )
    const tag = screen.getByTestId('canon-mid-season-tag')
    expect(tag).toHaveTextContent('S06')
    expect(tag.closest('.cp-mid-rank')).not.toBeNull()
  })
})
