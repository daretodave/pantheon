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

  it('surfaces the community hint beside the season when present', () => {
    render(
      <CanonCompactEntries
        entries={[
          { ...e(16), community_rank_hint: { rank: 16, delta: 0, sentiment: 'hold' } },
        ]}
        seasonHref={() => '/x'}
        eraOf={() => undefined}
      />,
    )
    const row = screen.getByTestId('canon-compact-entry')
    expect(row.querySelector('.cp-ce-meta')).toHaveTextContent('S16 · Community #16')
  })

  it('degrades to bare S## when no community hint', () => {
    render(
      <CanonCompactEntries
        entries={[e(17)]}
        seasonHref={() => '/x'}
        eraOf={() => undefined}
      />,
    )
    const meta = screen.getByTestId('canon-compact-entry').querySelector('.cp-ce-meta')
    expect(meta).toHaveTextContent('S17')
    expect(meta?.textContent).not.toContain('Community')
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

  it('appends the community hint only when present', () => {
    render(
      <CanonTailEntries
        entries={[
          { ...e(31), community_rank_hint: { rank: 28, delta: -3, sentiment: 'down' } },
          e(32),
        ]}
        seasonHref={() => '/x'}
        eraOf={() => undefined}
      />,
    )
    const rows = screen.getAllByTestId('canon-tail-row')
    expect(rows[0]?.querySelector('.cp-tr-num')).toHaveTextContent('S31 · Community #28')
    const tail = rows[1]?.querySelector('.cp-tr-num')
    expect(tail).toHaveTextContent('S32')
    expect(tail?.textContent).not.toContain('Community')
  })
})
