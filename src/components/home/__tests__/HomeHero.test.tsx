import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomeHero } from '../HomeHero'

describe('<HomeHero>', () => {
  it('renders the eyebrow with the featured show name', () => {
    render(<HomeHero featuredShowName="Survivor" />)
    expect(screen.getByTestId('home-hero-eyebrow').textContent).toContain('Survivor')
  })

  it('renders the locked headline + blurb', () => {
    render(<HomeHero featuredShowName="Survivor" />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/The seasons,.*ranked\..*No spoilers\./)
  })

  it('CTAs link to /shows and /about', () => {
    render(<HomeHero featuredShowName="Survivor" />)
    expect(screen.getByTestId('home-cta-shows').getAttribute('href')).toBe('/shows')
    expect(screen.getByTestId('home-cta-about').getAttribute('href')).toBe('/about')
  })
})
