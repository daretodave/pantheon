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
    tagline:
      "47 seasons of strangers on a beach. We've ranked every one.",
    tier: 'S',
    network: 'CBS',
    est_year: 2000,
    genre_tag: 'Reality competition',
    featured: true,
    ...overrides,
  }
}

const CANON_LABEL = '04 / 26'

describe('<HomeHero>', () => {
  it('renders the cover wordmark with the featured show name', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    const cover = screen.getByTestId('home-hero-cover')
    expect(cover.textContent).toContain('Survivor')
  })

  it('renders the cover tag "Currently featured"', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    expect(screen.getByTestId('home-hero-eyebrow').textContent).toMatch(
      /currently featured/i,
    )
  })

  it('cover bleeds the show palette via inline styles', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    const cover = screen.getByTestId('home-hero-cover') as HTMLDivElement
    expect(cover.style.background).toBe('rgb(14, 42, 42)')
    expect(cover.style.color).toBe('rgb(239, 226, 189)')
  })

  it('cover-sub prefers the longer tagline over the short blurb', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    const cover = screen.getByTestId('home-hero-cover')
    expect(cover.textContent).toContain('strangers on a beach')
  })

  it('go-pill links to /shows/<slug>', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    const go = screen.getByTestId('home-cover-go')
    expect(go.getAttribute('href')).toBe('/shows/survivor')
    expect(go.textContent).toContain('Survivor')
  })

  it('renders the stat strip with seasons + canon revised', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    const stats = screen.getByTestId('home-hero-stats')
    expect(stats.textContent).toContain('47')
    expect(stats.textContent).toContain('Seasons ranked')
    expect(stats.textContent).toContain('Canon revised')
    expect(screen.getByTestId('home-hero-canon-revised').textContent).toBe(
      CANON_LABEL,
    )
  })

  it('respects seasonsRanked override when supplied', () => {
    render(
      <HomeHero
        featured={survivor()}
        seasonsRanked={12}
        canonRevisedLabel={CANON_LABEL}
      />,
    )
    expect(screen.getByTestId('home-hero-stats').textContent).toContain('12')
  })

  it('renders blurb line breaks where the tagline contains a newline', () => {
    render(
      <HomeHero
        featured={survivor({ tagline: 'line one\nline two' })}
        canonRevisedLabel={CANON_LABEL}
      />,
    )
    const cover = screen.getByTestId('home-hero-cover')
    const subs = cover.querySelectorAll('.cover-sub br')
    expect(subs.length).toBe(1)
  })

  it('renders the locked headline + ranked-promise', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/The seasons,.*ranked\..*no spoilers\./)
  })

  it('CTAs link to /shows and /about', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    expect(screen.getByTestId('home-cta-shows').getAttribute('href')).toBe('/shows')
    expect(screen.getByTestId('home-cta-about').getAttribute('href')).toBe('/about')
  })

  it('renders the est-2026 eyebrow on the copy column', () => {
    render(<HomeHero featured={survivor()} canonRevisedLabel={CANON_LABEL} />)
    const hero = screen.getByTestId('home-hero')
    expect(hero.textContent).toContain('tiered.tv · est. 2026')
  })
})
