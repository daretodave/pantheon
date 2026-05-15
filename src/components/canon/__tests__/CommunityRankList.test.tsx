import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommunityRankList } from '../CommunityRankList'
import type { CommunityRankEntry } from '@/lib/community/rank'
import type { Season } from '@/content'

function season(number: number, title: string): Season {
  return {
    show: 'survivor',
    number,
    slug: `season-${number}`,
    title,
    body_md: 'body',
  } as unknown as Season
}

function entry(rank: number, n: number, title: string): CommunityRankEntry {
  return { rank, season: season(n, title), tag: '2010' }
}

describe('<CommunityRankList>', () => {
  it('renders header + rows', () => {
    const entries = [entry(1, 20, 'Heroes vs. Villains'), entry(2, 1, 'Borneo')]
    render(<CommunityRankList entries={entries} showSlug="survivor" source="canon" />)
    expect(screen.getByTestId('community-rank-list')).toHaveAttribute('data-source', 'canon')
    expect(screen.getByTestId('community-rank-cols')).toBeInTheDocument()
    expect(screen.getAllByTestId('community-rank-row')).toHaveLength(2)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('Heroes vs. Villains')).toBeInTheDocument()
  })

  it('hides approval/pct/trend/votes cells when no vote data', () => {
    const entries = [entry(1, 20, 'Heroes vs. Villains')]
    const { container } = render(
      <CommunityRankList entries={entries} showSlug="survivor" source="canon" />,
    )
    expect(container.querySelector('.cp-clr-bar-fill')).toBeNull()
    // empty placeholders render — but contain only an em-dash, hidden from a11y tree
    const placeholders = container.querySelectorAll('.cp-cl-cell--empty')
    expect(placeholders.length).toBeGreaterThanOrEqual(3)
  })
})
