import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShowHero } from '../ShowHero'

describe('<ShowHero>', () => {
  it('renders left cover (wordmark + blurb) and right meta (crumb + tagline)', () => {
    render(
      <ShowHero
        title="Survivor"
        blurb="47 seasons. One torch at a time."
        crumb={<span data-testid="crumb-content">Pantheons / Survivor</span>}
        tagline="47 seasons of strangers on a beach."
      />,
    )
    expect(screen.getByTestId('show-hero')).toBeInTheDocument()
    expect(screen.getByTestId('show-hero-cover')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Survivor')
    expect(screen.getByTestId('crumb-content')).toBeInTheDocument()
    expect(screen.getByTestId('show-hero').textContent).toMatch(/One torch/)
    expect(screen.getByTestId('show-hero').textContent).toMatch(/strangers on a beach/)
  })

  it('renders the stats strip when stats are provided', () => {
    render(
      <ShowHero
        title="Survivor"
        blurb="b"
        crumb="x"
        stats={[
          { value: 47, key: 'seasons aired' },
          { value: 2026, key: 'canon last revised' },
        ]}
      />,
    )
    const stats = screen.getByTestId('show-hero-stats')
    expect(stats).toBeInTheDocument()
    expect(stats.textContent).toContain('47')
    expect(stats.textContent).toContain('seasons aired')
    expect(stats.textContent).toContain('2026')
  })

  it('omits the stats strip when no stats given', () => {
    render(<ShowHero title="t" blurb="b" crumb="x" />)
    expect(screen.queryByTestId('show-hero-stats')).not.toBeInTheDocument()
  })

  it('renders the optional shield slot when given', () => {
    render(
      <ShowHero
        title="t"
        blurb="b"
        crumb="x"
        shield={<div data-testid="shield-content">shield</div>}
      />,
    )
    expect(screen.getByTestId('shield-content')).toBeInTheDocument()
  })

  it('does not render the rejected show-hero-art container', () => {
    render(<ShowHero title="t" blurb="b" crumb="x" />)
    expect(screen.queryByTestId('show-hero-art')).not.toBeInTheDocument()
  })
})
