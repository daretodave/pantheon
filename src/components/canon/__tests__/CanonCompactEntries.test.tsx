import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanonCompactEntries } from '../CanonCompactEntries'
import { CanonTailEntries } from '../CanonTailEntries'
import type { CanonEntry } from '@/content'

function e(rank: number): CanonEntry {
  return {
    rank,
    season: rank,
    title: `Season ${rank}`,
    rationale: 'rationale body',
    tag: 'optional tag',
  }
}

describe('<CanonCompactEntries>', () => {
  it('renders compact rows', () => {
    render(
      <CanonCompactEntries
        entries={[e(16), e(17)]}
        seasonHref={() => '/x'}
        eraOf={() => undefined}
      />,
    )
    expect(screen.getAllByTestId('canon-compact-entry')).toHaveLength(2)
    expect(screen.getByText('16')).toBeInTheDocument()
  })
})

describe('<CanonTailEntries>', () => {
  it('renders tail rows', () => {
    render(
      <CanonTailEntries
        entries={[e(31), e(32)]}
        seasonHref={() => '/x'}
        eraOf={() => undefined}
      />,
    )
    expect(screen.getAllByTestId('canon-tail-row')).toHaveLength(2)
    expect(screen.getByText('31')).toBeInTheDocument()
  })
})
