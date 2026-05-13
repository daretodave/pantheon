import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FeaturedCard } from '../FeaturedCard'
import { show, theme } from './fixtures'

const today = new Date('2026-05-13T00:00:00Z')

describe('<FeaturedCard>', () => {
  it('uses "Cross-canon" when more than one show is present', () => {
    render(
      <FeaturedCard
        theme={theme()}
        shows={[show(), show({ slug: 'top-chef', name: 'Top Chef' })]}
        today={today}
      />,
    )
    expect(screen.getByTestId('lists-featured-card').textContent).toContain(
      'Cross-canon',
    )
    expect(screen.getByTestId('lists-featured-card').textContent).toContain(
      '2 entries',
    )
  })

  it('uses the show name when only one show', () => {
    render(
      <FeaturedCard theme={theme()} shows={[show()]} today={today} />,
    )
    expect(screen.getByTestId('lists-featured-card').textContent).toContain(
      'Survivor',
    )
  })

  it('renders one bullet per show', () => {
    render(
      <FeaturedCard
        theme={theme()}
        shows={[show(), show({ slug: 'top-chef', name: 'Top Chef' })]}
        today={today}
      />,
    )
    const bullets = screen
      .getByTestId('lists-featured-bullets')
      .querySelectorAll('.bullet')
    expect(bullets).toHaveLength(2)
  })

  it('applies .big class when big', () => {
    const { container } = render(
      <FeaturedCard theme={theme()} shows={[show()]} big today={today} />,
    )
    expect(container.querySelector('.feat-card.big')).toBeTruthy()
  })

  it('renders "read the list →" CTA when big, plain "read →" otherwise', () => {
    const big = render(
      <FeaturedCard theme={theme()} shows={[show()]} big today={today} />,
    )
    expect(big.getByTestId('lists-featured-card').textContent).toContain(
      'read the list',
    )
    big.unmount()
    const small = render(
      <FeaturedCard theme={theme()} shows={[show()]} today={today} />,
    )
    const card = small.getByTestId('lists-featured-card')
    expect(card.textContent).toContain('read')
    expect(card.textContent).not.toContain('read the list')
  })

  it('formats status from theme.status', () => {
    render(
      <FeaturedCard
        theme={theme({ status: 'updated', last_revised: '2026-05-10' })}
        shows={[show()]}
        today={today}
      />,
    )
    expect(screen.getByTestId('lists-featured-status').textContent).toBe(
      'updated this week',
    )
  })

  it('links to /themes/<slug>', () => {
    render(
      <FeaturedCard theme={theme()} shows={[show()]} today={today} />,
    )
    expect(
      screen.getByTestId('lists-featured-card').getAttribute('href'),
    ).toBe('/themes/firsts')
  })
})
