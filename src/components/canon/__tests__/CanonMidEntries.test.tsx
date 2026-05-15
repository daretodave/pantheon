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
      />,
    )
    expect(screen.getAllByTestId('canon-mid-entry')).toHaveLength(3)
    expect(screen.getByText('06')).toBeInTheDocument()
    expect(screen.getByText('07')).toBeInTheDocument()
  })
})
