import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Show } from '@/content'
import { HomeHero } from '../HomeHero'

function survivor(overrides: Partial<Show> = {}): Show {
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

describe('<HomeHero>', () => {
  it('renders the cover wordmark with the featured show name', () => {
    render(<HomeHero featured={survivor()} />)
    const cover = screen.getByTestId('home-hero-cover')
    expect(cover.textContent).toContain('Survivor')
  })

  it('renders the cover tag "Currently featured"', () => {
    render(<HomeHero featured={survivor()} />)
    expect(screen.getByTestId('home-hero-eyebrow').textContent).toMatch(
      /currently featured/i,
    )
  })

  it('cover bleeds the show palette via inline styles', () => {
    render(<HomeHero featured={survivor()} />)
    const cover = screen.getByTestId('home-hero-cover') as HTMLDivElement
    // jsdom normalizes hex to rgb(); compare on the rgb form.
    expect(cover.style.background).toBe('rgb(14, 42, 42)')
    expect(cover.style.color).toBe('rgb(239, 226, 189)')
  })

  it('go-pill links to /shows/<slug>', () => {
    render(<HomeHero featured={survivor()} />)
    const go = screen.getByTestId('home-cover-go')
    expect(go.getAttribute('href')).toBe('/shows/survivor')
    expect(go.textContent).toContain('Survivor')
  })

  it('renders blurb line breaks where the blurb contains a newline', () => {
    render(<HomeHero featured={survivor({ blurb: 'line one\nline two' })} />)
    const cover = screen.getByTestId('home-hero-cover')
    const subs = cover.querySelectorAll('.cover-sub br')
    expect(subs.length).toBe(1)
  })

  it('renders the locked headline + ranked-promise', () => {
    render(<HomeHero featured={survivor()} />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/The seasons,.*ranked\..*no spoilers\./)
  })

  it('CTAs link to /shows and /about', () => {
    render(<HomeHero featured={survivor()} />)
    expect(screen.getByTestId('home-cta-shows').getAttribute('href')).toBe('/shows')
    expect(screen.getByTestId('home-cta-about').getAttribute('href')).toBe('/about')
  })

  it('renders the est-2026 eyebrow on the copy column', () => {
    render(<HomeHero featured={survivor()} />)
    const hero = screen.getByTestId('home-hero')
    expect(hero.textContent).toContain('Pantheon · est. 2026')
  })
})
