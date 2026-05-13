import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SearchHit } from '@/lib/search'
import { SearchResults } from '../SearchResults'

const showHit: SearchHit = {
  type: 'show',
  slug: 'survivor',
  title: 'Survivor',
  href: '/shows/survivor',
  snippet: 'reality competition',
  score: 100,
}
const seasonHit: SearchHit = {
  type: 'season',
  show: 'survivor',
  number: 1,
  title: 'Borneo',
  href: '/shows/survivor/season/1',
  snippet: 'season blurb',
  score: 50,
}
const themeHit: SearchHit = {
  type: 'theme',
  slug: 'firsts',
  title: 'Firsts that hold up',
  href: '/themes/firsts',
  snippet: 'reality competitions',
  score: 20,
}

describe('<SearchResults>', () => {
  it('renders the empty-results message when no hits', () => {
    render(<SearchResults hits={[]} query="zzz" />)
    expect(screen.getByTestId('search-empty-results')).toBeTruthy()
  })

  it('partitions hits into shows / seasons / themes groups', () => {
    render(<SearchResults hits={[showHit, seasonHit, themeHit]} query="x" />)
    expect(screen.getByTestId('search-group-shows')).toBeTruthy()
    expect(screen.getByTestId('search-group-seasons')).toBeTruthy()
    expect(screen.getByTestId('search-group-themes')).toBeTruthy()
  })

  it('omits groups with no hits', () => {
    render(<SearchResults hits={[showHit]} query="x" />)
    expect(screen.getByTestId('search-group-shows')).toBeTruthy()
    expect(screen.queryByTestId('search-group-seasons')).toBeNull()
    expect(screen.queryByTestId('search-group-themes')).toBeNull()
  })

  it('each hit links to its href and shows its snippet', () => {
    render(<SearchResults hits={[showHit]} query="x" />)
    const link = screen.getByTestId('search-hit-link')
    expect(link.getAttribute('href')).toBe('/shows/survivor')
    expect(screen.getByTestId('search-hit-snippet').textContent).toBe('reality competition')
  })
})
