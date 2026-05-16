import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShowRanking } from '../ShowRanking'
import type { CanonFile, Season, Show } from '@/content'

const SHOW: Show = {
  slug: 'survivor',
  name: 'Survivor',
  palette: { paper: '#0E2A2A', ink: '#EFE2BD', primary: '#D55E36' },
  seasons: 47,
  status: 'airing',
  blurb: 'blurb',
  tagline: 'tagline',
  tier: 'S',
  network: 'CBS',
  est_year: 2000,
  genre_tag: 'Reality competition',
  featured: true,
} as unknown as Show

function season(number: number, title: string): Season {
  return {
    show: 'survivor',
    number,
    slug: `season-${number}`,
    title,
    body_md: 'body',
  } as unknown as Season
}

function canon(): CanonFile {
  return {
    show: 'survivor',
    editor: 'M. Reyes',
    last_revised: '2026-04-01',
    entries: [
      {
        rank: 1,
        season: 20,
        title: 'Heroes vs. Villains',
        rationale: 'rationale body',
        tag: 'tagline',
      },
      { rank: 6, season: 1, title: 'Borneo', rationale: 'rationale body' },
    ],
  } as unknown as CanonFile
}

describe('<ShowRanking>', () => {
  it('initial view = canon seeds data-view + SSRs both panes', () => {
    render(
      <ShowRanking
        show={SHOW}
        seasons={[season(20, 'Heroes vs. Villains'), season(1, 'Borneo')]}
        canon={canon()}
        initialView="canon"
      />,
    )
    expect(screen.getByTestId('show-ranking')).toHaveAttribute(
      'data-view',
      'canon',
    )
    // Both panes are in the DOM regardless of active view (SEO-safe;
    // CSS toggles visibility off the root data-view).
    expect(screen.getByTestId('canon-view-pane')).toBeInTheDocument()
    expect(screen.getByTestId('community-view-pane')).toBeInTheDocument()
    expect(screen.getByTestId('canon-methodology')).toBeInTheDocument()
    expect(screen.getAllByTestId('canon-tier').length).toBeGreaterThan(0)
  })

  it('?view=community seeds data-view=community', () => {
    render(
      <ShowRanking
        show={SHOW}
        seasons={[season(20, 'Heroes vs. Villains'), season(1, 'Borneo')]}
        canon={canon()}
        initialView="community"
      />,
    )
    expect(screen.getByTestId('show-ranking')).toHaveAttribute(
      'data-view',
      'community',
    )
    expect(screen.getByTestId('community-live-strip')).toBeInTheDocument()
    expect(screen.getByTestId('community-rank-list')).toBeInTheDocument()
  })

  it('ranking-intro carries both the canon and community ledes', () => {
    render(
      <ShowRanking
        show={SHOW}
        seasons={[season(20, 'Heroes vs. Villains')]}
        canon={canon()}
        initialView="canon"
      />,
    )
    const intro = screen.getByTestId('ranking-intro')
    expect(intro).toHaveTextContent('The canon, top to bottom.')
    expect(intro).toHaveTextContent('What readers are voting on.')
  })

  it('renders the empty state when canon is null', () => {
    render(
      <ShowRanking show={SHOW} seasons={[]} canon={null} initialView="canon" />,
    )
    expect(screen.getByTestId('canon-empty')).toBeInTheDocument()
  })

  it('tab click flips data-view in place without navigating', () => {
    const pathBefore = window.location.pathname
    render(
      <ShowRanking
        show={SHOW}
        seasons={[season(20, 'Heroes vs. Villains'), season(1, 'Borneo')]}
        canon={canon()}
        initialView="canon"
      />,
    )
    fireEvent.click(screen.getByTestId('canon-tab-community'))
    expect(screen.getByTestId('show-ranking')).toHaveAttribute(
      'data-view',
      'community',
    )
    expect(window.location.pathname).toBe(pathBefore)
    expect(new URLSearchParams(window.location.search).get('view')).toBe(
      'community',
    )

    fireEvent.click(screen.getByTestId('canon-tab-canon'))
    expect(screen.getByTestId('show-ranking')).toHaveAttribute(
      'data-view',
      'canon',
    )
    expect(window.location.pathname).toBe(pathBefore)
    expect(new URLSearchParams(window.location.search).get('view')).toBeNull()
  })
})
