import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonGrid } from '../SeasonGrid'

describe('<SeasonGrid>', () => {
  it('renders a season-grid div with children', () => {
    render(
      <SeasonGrid>
        <div data-testid="child-1" />
        <div data-testid="child-2" />
      </SeasonGrid>,
    )
    const grid = screen.getByTestId('season-grid')
    expect(grid).toHaveClass('season-grid')
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('merges a custom className', () => {
    render(
      <SeasonGrid className="extra-class">
        <div />
      </SeasonGrid>,
    )
    expect(screen.getByTestId('season-grid')).toHaveClass('extra-class')
    expect(screen.getByTestId('season-grid')).toHaveClass('season-grid')
  })
})
