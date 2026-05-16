import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonInfoCard } from '../SeasonInfoCard'

describe('<SeasonInfoCard>', () => {
  const voteSlot = <div data-testid="vote-slot">vote</div>

  it('renders all four rows with canon scale, vote, and shield', () => {
    render(
      <SeasonInfoCard
        canonRank={7}
        canonTotal={47}
        voteQuestion="Top 10?"
        voteSlot={voteSlot}
      />,
    )
    expect(screen.getByTestId('info-card')).toBeInTheDocument()
    expect(screen.getByTestId('info-row-canon')).toBeInTheDocument()
    expect(screen.getByTestId('info-row-vote')).toBeInTheDocument()
    expect(screen.getByTestId('info-row-shield')).toBeInTheDocument()
    expect(screen.getByTestId('vote-slot')).toBeInTheDocument()
    // Phase 37 nit 5: the canon scale renders a dot marker + #NN label
    // on the track and two descriptive endpoint marks.
    expect(screen.getByTestId('rank-scale-here')).toHaveTextContent('#07')
    expect(screen.getByText('#01 · canon peak')).toBeInTheDocument()
    expect(screen.getByText('#47 · the tail')).toBeInTheDocument()
  })

  it('hides the community row by default', () => {
    render(
      <SeasonInfoCard
        canonRank={7}
        canonTotal={47}
        voteQuestion="Q?"
        voteSlot={voteSlot}
      />,
    )
    expect(screen.queryByTestId('info-row-community')).toBeNull()
  })

  it('renders the community row when communityRank is supplied', () => {
    render(
      <SeasonInfoCard
        canonRank={7}
        canonTotal={47}
        communityRank={4}
        communityCount={17402}
        communityShift="↑ 3 this month"
        communityCaption="readers rank it higher than the editors do."
        voteQuestion="Q?"
        voteSlot={voteSlot}
      />,
    )
    expect(screen.getByTestId('info-row-community')).toBeInTheDocument()
    expect(screen.getByText('#04')).toBeInTheDocument()
    expect(screen.getByTestId('community-shift')).toHaveTextContent('↑ 3 this month')
    expect(screen.getByText('17,402 votes')).toBeInTheDocument()
  })

  it('falls back to a "not yet ranked" placeholder when canonRank is null', () => {
    render(
      <SeasonInfoCard
        canonRank={null}
        canonTotal={47}
        voteQuestion="Q?"
        voteSlot={voteSlot}
      />,
    )
    expect(screen.getByTestId('info-row-canon')).toBeInTheDocument()
    expect(screen.getByText('not yet ranked')).toBeInTheDocument()
  })

  it('renders two shield lines by default', () => {
    render(
      <SeasonInfoCard
        canonRank={1}
        canonTotal={1}
        voteQuestion="Q?"
        voteSlot={voteSlot}
      />,
    )
    expect(screen.getAllByTestId('shield-line')).toHaveLength(2)
  })
})
