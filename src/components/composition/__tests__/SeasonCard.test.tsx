import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonCard } from '../SeasonCard'

describe('<SeasonCard>', () => {
  it('renders rank, title, tag, season number, and href', () => {
    render(
      <SeasonCard
        rank={7}
        title="Pearl Islands"
        tag="pirates, marooning, theater"
        seasonNumber={7}
        href="/shows/survivor/season/7"
      />,
    )
    const card = screen.getByTestId('season-card')
    expect(card).toHaveAttribute('href', '/shows/survivor/season/7')
    expect(card).toHaveAttribute('data-rank', '7')
    expect(card.textContent).toContain('#07')
    expect(card.textContent).toContain('Pearl Islands')
    expect(card.textContent).toContain('pirates, marooning, theater')
    expect(card.textContent).toContain('Season 07')
  })

  it('renders a RankShiftPill when shift is provided', () => {
    render(
      <SeasonCard
        rank={1}
        title="Borneo"
        tag="the genre, invented mid-air"
        seasonNumber={1}
        href="/x"
        shift={{ delta: 3, sentiment: 'warm-up' }}
      />,
    )
    expect(screen.getByTestId('rank-shift-pill')).toBeInTheDocument()
  })

  it('omits the RankShiftPill when no shift', () => {
    render(
      <SeasonCard rank={1} title="t" tag="x" seasonNumber={1} href="/x" />,
    )
    expect(screen.queryByTestId('rank-shift-pill')).not.toBeInTheDocument()
  })

  it('accepts a string seasonNumber for irregular cases', () => {
    render(<SeasonCard rank={1} title="t" tag="x" seasonNumber="40 (winners)" href="/x" />)
    expect(screen.getByTestId('season-card').textContent).toContain('Season 40 (winners)')
  })
})
