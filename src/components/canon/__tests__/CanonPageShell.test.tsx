import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanonPageShell } from '../CanonPageShell'
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
      {
        rank: 6,
        season: 1,
        title: 'Borneo',
        rationale: 'rationale body',
      },
    ],
  } as unknown as CanonFile
}

describe('<CanonPageShell>', () => {
  it('initial view = canon shows canon pane', () => {
    render(
      <CanonPageShell
        show={SHOW}
        seasons={[season(20, 'Heroes vs. Villains'), season(1, 'Borneo')]}
        canon={canon()}
        initialView="canon"
      />,
    )
    expect(screen.getByTestId('canon-page-root')).toHaveAttribute('data-view', 'canon')
    expect(screen.getByTestId('canon-methodology')).toBeInTheDocument()
    expect(screen.getAllByTestId('canon-tier').length).toBeGreaterThan(0)
  })

  it('initial view = community shows community pane', () => {
    render(
      <CanonPageShell
        show={SHOW}
        seasons={[season(20, 'Heroes vs. Villains'), season(1, 'Borneo')]}
        canon={canon()}
        initialView="community"
      />,
    )
    expect(screen.getByTestId('canon-page-root')).toHaveAttribute('data-view', 'community')
    expect(screen.getByTestId('community-live-strip')).toBeInTheDocument()
    expect(screen.getByTestId('community-movers')).toBeInTheDocument()
    expect(screen.getByTestId('community-rank-list')).toBeInTheDocument()
  })

  it('renders the empty state when canon is null', () => {
    render(
      <CanonPageShell
        show={SHOW}
        seasons={[]}
        canon={null}
        initialView="canon"
      />,
    )
    expect(screen.getByTestId('canon-empty')).toBeInTheDocument()
  })

  it('tab click flips view + URL', () => {
    render(
      <CanonPageShell
        show={SHOW}
        seasons={[season(20, 'Heroes vs. Villains'), season(1, 'Borneo')]}
        canon={canon()}
        initialView="canon"
      />,
    )
    fireEvent.click(screen.getByTestId('canon-tab-community'))
    expect(screen.getByTestId('canon-page-root')).toHaveAttribute('data-view', 'community')
    expect(window.location.pathname).toBe('/shows/survivor/community')

    fireEvent.click(screen.getByTestId('canon-tab-canon'))
    expect(screen.getByTestId('canon-page-root')).toHaveAttribute('data-view', 'canon')
    expect(window.location.pathname).toBe('/shows/survivor/canon')
  })
})
