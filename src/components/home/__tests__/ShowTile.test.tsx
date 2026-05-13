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

  it('renders the show.blurb as the tile blurb', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    expect(screen.getByTestId('home-show-tile').textContent).toContain(
      '47 seasons. One torch at a time.',
    )
  })

  it('renders a bullet primitive in the tile name', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    expect(screen.getAllByTestId('bullet').length).toBeGreaterThan(0)
  })

  it('singular season count noun', () => {
    render(<ShowTile show={show()} seasonCount={1} />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toMatch(/^1 season · ranked/)
  })

  it('plural season count noun', () => {
    render(<ShowTile show={show()} seasonCount={4} />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toMatch(/^4 seasons · ranked/)
  })

  it('zero seasons renders the loading placeholder', () => {
    render(<ShowTile show={show()} seasonCount={0} />)
    expect(screen.getByTestId('home-show-tile-meta').textContent).toBe('season count loading')
  })
})
