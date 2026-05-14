import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Show } from '@/content'
import { ShowTile } from '../ShowTile'

function show(overrides: Partial<Show> = {}): Show {
  return {
    slug: 'survivor',
    name: 'Survivor',
    palette: { primary: '#D55E36', ink: '#EFE2BD', paper: '#0E2A2A' },
    seasons: 47,
    status: 'airing',
    blurb: '47 seasons. One torch at a time.',
    tagline: 'The mother format.',
    tier: 'S',
    network: 'CBS',
    est_year: 2000,
    genre_tag: 'Reality competition',
    featured: true,
    ...overrides,
  }
}

describe('<ShowTile>', () => {
  it('links to /shows/<slug>', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    const link = screen.getByTestId('home-show-tile')
    expect(link.getAttribute('href')).toBe('/shows/survivor')
    expect(link.dataset['show']).toBe('survivor')
  })

  it('defaults to the featured variant and renders the show.blurb', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    const tile = screen.getByTestId('home-show-tile')
    expect(tile.dataset['variant']).toBe('featured')
    expect(tile.textContent).toContain('47 seasons. One torch at a time.')
  })

  it('compact variant drops the blurb', () => {
    render(<ShowTile show={show()} seasonCount={4} variant="compact" />)
    const tile = screen.getByTestId('home-show-tile')
    expect(tile.dataset['variant']).toBe('compact')
    expect(tile.querySelector('.show-tile-blurb')).toBeNull()
  })

  it('renders the genre_tag in the head', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    expect(screen.getByTestId('home-show-tile').textContent).toContain(
      'Reality competition',
    )
  })

  it('renders a bullet primitive in the tile head', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    expect(screen.getAllByTestId('bullet').length).toBeGreaterThan(0)
  })

  it('featured meta line names canon + community', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toBe(
      '4 seasons · canon + community',
    )
  })

  it('singular season noun in the featured meta line', () => {
    render(<ShowTile show={show()} seasonCount={1} />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toBe(
      '1 season · canon + community',
    )
  })

  it('compact meta line is just the season count', () => {
    render(<ShowTile show={show()} seasonCount={36} variant="compact" />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toBe(
      '36 seasons',
    )
  })

  it('zero seasons renders the loading placeholder in either variant', () => {
    const { rerender } = render(<ShowTile show={show()} seasonCount={0} />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toBe(
      'season count loading',
    )
    rerender(<ShowTile show={show()} seasonCount={0} variant="compact" />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toBe(
      'season count loading',
    )
  })

  it('exposes the show palette via --tile-* custom properties', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    const tile = screen.getByTestId('home-show-tile') as HTMLAnchorElement
    expect(tile.style.getPropertyValue('--tile-paper')).toBe('#0E2A2A')
    expect(tile.style.getPropertyValue('--tile-ink')).toBe('#EFE2BD')
    expect(tile.style.getPropertyValue('--tile-primary')).toBe('#D55E36')
  })
})
