import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Theme } from '@/content'
import { HomeListRow } from '../HomeListRow'

function theme(overrides: Partial<Theme> = {}): Theme {
  return {
    slug: 'best-premieres',
    title: 'Best premieres ever',
    description: 'The cold opens that promised a season worth staying for.',
    tagline: 'Best premieres ever.',
    category: 'craft',
    sentiment: 'warm-up',
    status: 'stable',
    curator: 'tiered.tv Editors',
    last_revised: '2026-04-15',
    featured: false,
    related: [],
    entries: [
      { show: 'survivor', season: 1, rank: 1, title: 't1', blurb: 'b1' },
      { show: 'top-chef', season: 2, rank: 2, title: 't2', blurb: 'b2' },
      { show: 'dragrace', season: 3, rank: 3, title: 't3', blurb: 'b3' },
    ],
    body_md: '',
    ...overrides,
  }
}

describe('<HomeListRow>', () => {
  it('links to /themes/<slug>', () => {
    render(<HomeListRow theme={theme()} />)
    const link = screen.getByTestId('home-list-row')
    expect(link.getAttribute('href')).toBe('/themes/best-premieres')
    expect(link.dataset['theme']).toBe('best-premieres')
  })

  it('renders title + description + meta', () => {
    render(<HomeListRow theme={theme()} />)
    const link = screen.getByTestId('home-list-row')
    expect(link.textContent).toContain('Best premieres ever')
    expect(link.textContent).toContain('cold opens')
    expect(screen.getByTestId('home-list-row-meta').textContent).toBe(
      '3 shows · 3 entries',
    )
  })

  it('singular noun for one show / one entry', () => {
    render(
      <HomeListRow
        theme={theme({
          entries: [
            { show: 'survivor', season: 1, rank: 1, title: 't', blurb: 'b' },
          ],
        })}
      />,
    )
    expect(screen.getByTestId('home-list-row-meta').textContent).toBe(
      '1 show · 1 entry',
    )
  })

  it('exposes the sentiment as data-sentiment + dot background var', () => {
    render(<HomeListRow theme={theme({ sentiment: 'verdict' })} />)
    const link = screen.getByTestId('home-list-row')
    expect(link.dataset['sentiment']).toBe('verdict')
    const dot = screen.getByTestId('home-list-row-dot') as HTMLSpanElement
    expect(dot.style.background).toContain('--s-verdict')
  })
})
