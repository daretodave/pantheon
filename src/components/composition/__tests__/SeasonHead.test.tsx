import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonHead } from '../SeasonHead'

describe('<SeasonHead>', () => {
  it('renders crumb + title and omits optional slots when not given', () => {
    render(<SeasonHead crumb={<span>Pantheons / Survivor / S20</span>} title="Heroes vs. Villains" />)
    const head = screen.getByTestId('season-head')
    expect(head.tagName.toLowerCase()).toBe('header')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heroes vs. Villains')
    expect(head.textContent).toMatch(/pantheons \/ survivor/i)
    expect(screen.queryByTestId('season-sigil')).not.toBeInTheDocument()
    expect(screen.queryByTestId('season-rank-row')).not.toBeInTheDocument()
  })

  it('renders the optional sigil slot when provided', () => {
    render(
      <SeasonHead
        crumb="x"
        title="t"
        sigil={<svg data-testid="sigil-content" />}
      />,
    )
    expect(screen.getByTestId('season-sigil')).toBeInTheDocument()
    expect(screen.getByTestId('sigil-content')).toBeInTheDocument()
  })

  it('renders the optional rankRow slot when provided', () => {
    render(<SeasonHead crumb="x" title="t" rankRow={<span data-testid="rr">tag</span>} />)
    expect(screen.getByTestId('season-rank-row')).toBeInTheDocument()
    expect(screen.getByTestId('rr')).toBeInTheDocument()
  })
})
