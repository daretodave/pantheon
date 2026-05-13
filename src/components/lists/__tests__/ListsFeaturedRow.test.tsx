import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ListsFeaturedRow } from '../ListsFeaturedRow'
import { show, theme } from './fixtures'

const today = new Date('2026-05-13T00:00:00Z')

describe('<ListsFeaturedRow>', () => {
  it('renders nothing when no themes featured', () => {
    const { container } = render(
      <ListsFeaturedRow featured={[]} showsByTheme={{}} today={today} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('marks the first card as big', () => {
    render(
      <ListsFeaturedRow
        featured={[
          theme({ slug: 'a', featured: true }),
          theme({ slug: 'b', featured: true }),
        ]}
        showsByTheme={{ a: [show()], b: [show()] }}
        today={today}
      />,
    )
    const cards = screen.getAllByTestId('lists-featured-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.getAttribute('data-big')).toBe('true')
    expect(cards[1]?.getAttribute('data-big')).toBe('false')
  })

  it('gracefully renders <3 featured (does not pad)', () => {
    render(
      <ListsFeaturedRow
        featured={[theme({ slug: 'a', featured: true })]}
        showsByTheme={{ a: [show()] }}
        today={today}
      />,
    )
    expect(screen.getAllByTestId('lists-featured-card')).toHaveLength(1)
  })
})
