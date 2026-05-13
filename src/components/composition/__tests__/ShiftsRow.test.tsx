import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShiftsRow } from '../ShiftsRow'

describe('<ShiftsRow>', () => {
  it('renders the heading + empty state when no cards', () => {
    render(<ShiftsRow />)
    expect(screen.getByTestId('shifts-row')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /What changed this week/i,
    )
    expect(screen.getByTestId('shifts-empty')).toHaveTextContent('No shifts this week.')
    expect(screen.queryByTestId('shifts-cards')).not.toBeInTheDocument()
  })

  it('renders cards when provided and drops the empty line', () => {
    render(<ShiftsRow cards={<div data-testid="card">card</div>} />)
    expect(screen.queryByTestId('shifts-empty')).not.toBeInTheDocument()
    expect(screen.getByTestId('shifts-cards')).toBeInTheDocument()
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })
})
