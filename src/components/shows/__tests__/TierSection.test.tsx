import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Show, ShowTier } from '@/content'
import { TierSection } from '../TierSection'

function show(overrides: Partial<Show> = {}): Show {
  return {
    slug: 'survivor',
    name: 'Survivor',
    palette: { primary: '#D55E36', ink: '#EFE2BD', paper: '#0E2A2A' },
    seasons: 47,
    status: 'airing',
    blurb: 'b',
    tagline: '47 seasons of strangers on a beach.',
    tier: 'S',
    network: 'CBS',
    est_year: 2000,
    genre_tag: 'Reality competition',
    featured: true,
    ...overrides,
  }
}

describe('<TierSection>', () => {
  it('renders nothing when the tier holds no shows', () => {
    const { container } = render(<TierSection tier="S" shows={[]} />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByTestId('tier-section')).not.toBeInTheDocument()
  })

  it('stamps the tier, renders a TierHead with the count, and one tile per show', () => {
    render(
      <TierSection
        tier="S"
        shows={[
          show({ slug: 'survivor', name: 'Survivor' }),
          show({ slug: 'top-chef', name: 'Top Chef' }),
        ]}
      />,
    )
    const section = screen.getByTestId('tier-section')
    expect(section.dataset['tier']).toBe('S')
    expect(screen.getByTestId('tier-count').textContent).toContain('2')
    expect(screen.getAllByTestId('shows-tile')).toHaveLength(2)
  })

  it('S tier → cols-2 grid, tall tiles, no canon-progress status pill', () => {
    render(<TierSection tier="S" shows={[show({ tier: 'S' })]} />)
    expect(screen.getByTestId('shows-grid').className).toBe('shows-grid cols-2')
    expect(screen.getByTestId('shows-tile').dataset['variant']).toBe('tall')
    expect(screen.queryByTestId('show-tile-status')).not.toBeInTheDocument()
  })

  it('A tier (default branch) → cols-2 grid, regular tiles, no status pill', () => {
    render(
      <TierSection tier={'A' as ShowTier} shows={[show({ tier: 'A' })]} />,
    )
    expect(screen.getByTestId('shows-grid').className).toBe('shows-grid cols-2')
    expect(screen.getByTestId('shows-tile').dataset['variant']).toBe('regular')
    expect(screen.queryByTestId('show-tile-status')).not.toBeInTheDocument()
  })

  it('B tier → cols-3 grid, small tiles, canon-progress status pill passed through', () => {
    render(
      <TierSection
        tier="B"
        shows={[
          show({ slug: 'no-canon-show', name: 'No Canon Show', tier: 'B' }),
        ]}
      />,
    )
    expect(screen.getByTestId('shows-grid').className).toBe('shows-grid cols-3')
    expect(screen.getByTestId('shows-tile').dataset['variant']).toBe('small')
    const pill = screen.getByTestId('show-tile-status')
    expect(pill.textContent).toContain('in progress')
    expect(pill.textContent).toContain('0 / 3')
  })
})
