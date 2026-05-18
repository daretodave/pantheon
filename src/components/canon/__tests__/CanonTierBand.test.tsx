import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CanonEntry } from '@/content'
import { DEFAULT_TIER_HEADINGS, type TierBand } from '@/lib/canon/tier-bands'
import { CanonTierBand } from '../CanonTierBand'

function e(rank: number): CanonEntry {
  return {
    rank,
    season: rank,
    title: `Season ${rank}`,
    rationale: 'rationale body',
    tag: 'optional tag',
  }
}

function band(overrides: Partial<TierBand> & Pick<TierBand, 'key'>): TierBand {
  return {
    entries: [e(1)],
    blurb: null,
    ...overrides,
  }
}

const noop = () => undefined
const props = {
  seasonHref: () => '/x',
  seasonOf: noop,
  eraOf: noop,
  communitySignal: () => null,
}

describe('<CanonTierBand>', () => {
  it('renders the fixed headline for each tier key', () => {
    const cases: Array<[TierBand['key'], string]> = [
      ['S', 'The seasons that defend the show.'],
      ['A', 'The seasons we would watch again next week.'],
      ['B', 'The seasons that count.'],
      ['C', 'The seasons we have made peace with.'],
    ]
    for (const [key, headline] of cases) {
      const { unmount } = render(
        <CanonTierBand band={band({ key })} {...props} />,
      )
      expect(
        screen.getByRole('heading', { level: 2 }),
      ).toHaveTextContent(headline)
      unmount()
    }
  })

  it('stamps data-tier with the band key', () => {
    render(<CanonTierBand band={band({ key: 'B' })} {...props} />)
    expect(screen.getByTestId('canon-tier')).toHaveAttribute(
      'data-tier',
      'B',
    )
  })

  it('uses the band blurb when present', () => {
    render(
      <CanonTierBand
        band={band({ key: 'A', blurb: 'A curated, show-specific blurb.' })}
        {...props}
      />,
    )
    expect(
      screen.getByText('A curated, show-specific blurb.'),
    ).toBeInTheDocument()
  })

  it('falls back to the default tier heading when blurb is null', () => {
    render(<CanonTierBand band={band({ key: 'A', blurb: null })} {...props} />)
    expect(
      screen.getByText(DEFAULT_TIER_HEADINGS.A),
    ).toBeInTheDocument()
  })

  it('singularizes the count for a one-entry band', () => {
    render(
      <CanonTierBand
        band={band({ key: 'S', entries: [e(1)] })}
        {...props}
      />,
    )
    expect(screen.getByText(/01 · one entry/)).toBeInTheDocument()
  })

  it('pluralizes the count and renders the rank range for a multi-entry band', () => {
    render(
      <CanonTierBand
        band={band({ key: 'A', entries: [e(6), e(7), e(8)] })}
        {...props}
      />,
    )
    expect(screen.getByText(/06 — 08 · 3 entries/)).toBeInTheDocument()
  })

  it('dispatches the body layout by tier key', () => {
    const dispatch: Array<[TierBand['key'], string]> = [
      ['S', 'canon-hero-entries'],
      ['A', 'canon-mid-entries'],
      ['B', 'canon-compact-entries'],
      ['C', 'canon-tail-entries'],
    ]
    for (const [key, testid] of dispatch) {
      const { unmount } = render(
        <CanonTierBand band={band({ key, entries: [e(1)] })} {...props} />,
      )
      expect(screen.getByTestId(testid)).toBeInTheDocument()
      unmount()
    }
  })
})
