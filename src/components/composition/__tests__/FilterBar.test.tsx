import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FilterBar } from '../FilterBar'

describe('<FilterBar>', () => {
  it('renders default canon/community/era chips with canon active', () => {
    render(<FilterBar />)
    const bar = screen.getByTestId('filter-bar')
    expect(bar).toHaveAttribute('data-active-filter', 'canon')
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveTextContent('Canon')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('honors an explicit activeKey', () => {
    render(<FilterBar activeKey="community" />)
    const tabs = screen.getAllByRole('tab')
    const community = tabs.find((t) => t.textContent === 'Community')
    expect(community).toHaveAttribute('aria-selected', 'true')
  })
})
