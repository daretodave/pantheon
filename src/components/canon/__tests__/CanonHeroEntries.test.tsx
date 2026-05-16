import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanonHeroEntries } from '../CanonHeroEntries'
import type { CanonEntry, Season } from '@/content'

function entry(overrides: Partial<CanonEntry> & { rank: number; season: number; title: string }): CanonEntry {
  return {
    rationale:
      'eighty to one hundred and twenty words of rationale; the renderer treats this as a string and does not enforce length here, but production schemas do.',
    ...overrides,
  }
}

function season(number: number, title: string): Season {
  return {
    show: 'survivor',
    number,
    slug: `season-${number}`,
    title,
    body_md: 'body',
  } as unknown as Season
}

describe('<CanonHeroEntries>', () => {
  it('renders one row per entry with title and rank padded', () => {
    const entries = [
      entry({ rank: 1, season: 1, title: 'Borneo', tag: 'genre, invented mid-air' }),
      entry({ rank: 2, season: 20, title: 'Heroes vs. Villains' }),
    ]
    const seasons = new Map<number, Season>([
      [1, season(1, 'Borneo')],
      [20, season(20, 'Heroes vs. Villains')],
    ])
    render(
      <CanonHeroEntries
        entries={entries}
        seasonHref={(e) => `/shows/survivor/season/${seasons.get(e.season)?.slug ?? e.season}`}
        seasonOf={(e) => seasons.get(e.season)}
        eraOf={() => undefined}
      />,
    )
    const rows = screen.getAllByTestId('canon-hero-entry')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute('data-rank', '1')
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('Borneo')).toBeInTheDocument()
    expect(screen.getByText('Heroes vs. Villains')).toBeInTheDocument()
  })

  it('collapses absent tag / slot_argument / community_rank_hint', () => {
    const entries = [
      entry({ rank: 1, season: 1, title: 'Borneo' }),
    ]
    render(
      <CanonHeroEntries
        entries={entries}
        seasonHref={() => '/x'}
        seasonOf={() => undefined}
        eraOf={() => undefined}
      />,
    )
    expect(screen.queryByTestId('canon-hero-mini-community')).toBeNull()
    expect(screen.queryByTestId('canon-hero-mini-slot')).toBeNull()
    expect(screen.queryByText(/tag/i)).toBeNull()
  })

  it('renders community + slot mini-cards when present', () => {
    const entries = [
      entry({
        rank: 1,
        season: 1,
        title: 'Borneo',
        slot_argument: 'genre defined here',
        community_rank_hint: { rank: 2, delta: 1, sentiment: 'up' },
      }),
    ]
    render(
      <CanonHeroEntries
        entries={entries}
        seasonHref={() => '/x'}
        seasonOf={() => undefined}
        eraOf={() => undefined}
      />,
    )
    expect(screen.getByTestId('canon-hero-mini-community')).toBeInTheDocument()
    expect(screen.getByTestId('canon-hero-mini-slot')).toBeInTheDocument()
    expect(screen.getByText('#02')).toBeInTheDocument()
  })
})
