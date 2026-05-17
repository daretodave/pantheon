import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShiftCard } from '../ShiftCard'
import type { CommunityMover } from '@/lib/community/live'
import type { Season } from '@/content'

function season(number: number, title: string): Season {
  return {
    show: 'survivor',
    number,
    slug: `season-${number}`,
    title,
    body_md: 'b',
  } as unknown as Season
}

function mover(over: Partial<CommunityMover> = {}): CommunityMover {
  return {
    season: season(20, 'Heroes vs. Villains'),
    tag: '2010',
    rank: 7,
    prevRank: 10,
    delta: 3,
    sentiment: 'warm-up',
    ...over,
  }
}

describe('<ShiftCard>', () => {
  it('renders the title, pill, padded was/now ranks and season number', () => {
    render(<ShiftCard mover={mover()} />)
    expect(screen.getByTestId('shift-card')).toBeInTheDocument()
    expect(screen.getByText('Heroes vs. Villains')).toBeInTheDocument()
    expect(screen.getByText('#10')).toBeInTheDocument()
    expect(screen.getByText('#07')).toBeInTheDocument()
    expect(screen.getByText('Season 20')).toBeInTheDocument()
    const pill = screen.getByTestId('rank-shift-pill')
    expect(pill).toHaveAttribute('data-delta', '3')
    expect(pill).toHaveAttribute('data-sentiment', 'warm-up')
  })

  it('renders the data-derived note for a climb', () => {
    render(<ShiftCard mover={mover({ delta: 3 })} />)
    expect(
      screen.getByText('Climbed 3 spots since the last weekly recompute.'),
    ).toBeInTheDocument()
  })

  it('renders the data-derived note for a slide', () => {
    render(
      <ShiftCard
        mover={mover({
          delta: -2,
          rank: 23,
          prevRank: 21,
          sentiment: 'warm-down',
          season: season(28, 'Cagayan'),
        })}
      />,
    )
    expect(
      screen.getByText('Slid 2 spots since the last weekly recompute.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Cagayan')).toBeInTheDocument()
    expect(screen.getByText('#21')).toBeInTheDocument()
    expect(screen.getByText('#23')).toBeInTheDocument()
  })

  it('shows the weekly-cadence time label', () => {
    render(<ShiftCard mover={mover()} />)
    expect(screen.getByText('this week')).toBeInTheDocument()
  })
})
