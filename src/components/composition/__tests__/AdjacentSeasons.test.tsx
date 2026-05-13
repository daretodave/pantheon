import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdjacentSeasons } from '../AdjacentSeasons'

describe('<AdjacentSeasons>', () => {
  it('returns null when neither prev nor next is provided', () => {
    const { container } = render(<AdjacentSeasons />)
    expect(container.firstChild).toBeNull()
  })

  it('renders only prev when next is omitted', () => {
    render(
      <AdjacentSeasons
        prev={{ href: '/shows/survivor/season/6', rank: 6, title: 'The Amazon', caption: 'cap' }}
      />,
    )
    expect(screen.getByTestId('adjacent-prev')).toHaveAttribute(
      'href',
      '/shows/survivor/season/6',
    )
    expect(screen.queryByTestId('adjacent-next')).not.toBeInTheDocument()
    expect(screen.getByTestId('adjacent-prev').textContent).toContain('#06 in Canon')
    expect(screen.getByTestId('adjacent-prev').textContent).toContain('The Amazon')
  })

  it('zero-pads the rank label and switches arrow direction', () => {
    render(
      <AdjacentSeasons
        prev={{ href: '/a', rank: 6, title: 'A' }}
        next={{ href: '/b', rank: 8, title: 'B' }}
      />,
    )
    expect(screen.getByTestId('adjacent-prev').textContent).toContain('← #06')
    expect(screen.getByTestId('adjacent-next').textContent).toContain('#08 in Canon →')
  })

  it('falls back to neutral labels when rank is null', () => {
    render(
      <AdjacentSeasons
        prev={{ href: '/a', rank: null, title: 'A' }}
        next={{ href: '/b', rank: null, title: 'B' }}
      />,
    )
    expect(screen.getByTestId('adjacent-prev').textContent).toContain('Previous season')
    expect(screen.getByTestId('adjacent-next').textContent).toContain('Next season')
  })
})
