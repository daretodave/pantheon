import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Theme } from '@/content'
import { ListTile } from '../ListTile'

function theme(overrides: Partial<Theme> = {}): Theme {
  return {
    slug: 'survivor-pillars',
    title: 'Survivor: the load-bearing seasons',
    description: 'Four seasons that define the show.',
    sentiment: 'neutral',
    entries: [
      { show: 'survivor', season: 1, rank: 1, blurb: 'b1' },
      { show: 'survivor', season: 28, rank: 2, blurb: 'b2' },
      { show: 'survivor', season: 41, rank: 3, blurb: 'b3' },
    ],
    body_md: '',
    ...overrides,
  }
}

describe('<ListTile>', () => {
  it('links to /themes/<slug>', () => {
    render(<ListTile theme={theme()} />)
    const link = screen.getByTestId('home-list-tile')
    expect(link.getAttribute('href')).toBe('/themes/survivor-pillars')
    expect(link.dataset['theme']).toBe('survivor-pillars')
  })

  it('renders the title and entry count', () => {
    render(<ListTile theme={theme()} />)
    const link = screen.getByTestId('home-list-tile')
    expect(link.textContent).toContain('Survivor: the load-bearing seasons')
    expect(link.textContent).toContain('3 entries')
  })

  it('singular entry count noun', () => {
    render(
      <ListTile
        theme={theme({ entries: [{ show: 'survivor', season: 1, rank: 1, blurb: 'b' }] })}
      />,
    )
    expect(screen.getByTestId('home-list-tile').textContent).toContain('1 entry')
  })

  it('exposes the sentiment as data-sentiment + dot background var', () => {
    render(<ListTile theme={theme({ sentiment: 'warm-up' })} />)
    const link = screen.getByTestId('home-list-tile')
    expect(link.dataset['sentiment']).toBe('warm-up')
    const dot = screen.getByTestId('home-list-tile-dot') as HTMLDivElement
    expect(dot.style.background).toContain('--s-warm-up')
  })

  it('falls back to the neutral sentiment when not set in the data', () => {
    render(<ListTile theme={theme()} />)
    const link = screen.getByTestId('home-list-tile')
    expect(link.dataset['sentiment']).toBe('neutral')
  })
})
