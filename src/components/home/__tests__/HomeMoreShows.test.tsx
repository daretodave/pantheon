import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomeMoreShows } from '../HomeMoreShows'

describe('<HomeMoreShows>', () => {
  it('surfaces the count in the sub-row label', () => {
    render(
      <HomeMoreShows count={6}>
        <div data-testid="dummy-tile">tile</div>
      </HomeMoreShows>,
    )
    expect(screen.getByTestId('home-more-shows-label').textContent).toBe(
      '+ 6 more in the index',
    )
  })

  it('renders the "Browse all" link', () => {
    render(<HomeMoreShows count={6}>tiles</HomeMoreShows>)
    const link = screen.getByRole('link', { name: /browse all/i })
    expect(link.getAttribute('href')).toBe('/shows')
  })

  it('renders children inside the compact grid', () => {
    render(
      <HomeMoreShows count={1}>
        <span data-testid="kid">x</span>
      </HomeMoreShows>,
    )
    const grid = screen.getByTestId('home-more-shows-grid')
    expect(grid.classList.contains('rest')).toBe(true)
    expect(grid.querySelector('[data-testid="kid"]')).not.toBeNull()
  })
})
