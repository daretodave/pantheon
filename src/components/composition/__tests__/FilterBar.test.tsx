import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from '../FilterBar'

describe('<FilterBar>', () => {
  it('renders canon and community chips (no era)', () => {
    render(<FilterBar />)
    const bar = screen.getByTestId('filter-bar')
    expect(bar).toHaveAttribute('data-active-filter', 'canon')
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveTextContent('Canon')
    expect(tabs[1]).toHaveTextContent('Community')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('honors an explicit activeKey', () => {
    render(<FilterBar activeKey="community" />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('flips active filter and writes ?view= to URL on chip click', () => {
    render(
      <div data-season-ordering-host data-active-filter="canon">
        <FilterBar />
      </div>,
    )
    const host = document.querySelector<HTMLElement>('[data-season-ordering-host]')!
    expect(host.dataset['activeFilter']).toBe('canon')

    fireEvent.click(screen.getByTestId('filter-chip-community'))
    expect(screen.getByTestId('filter-bar')).toHaveAttribute(
      'data-active-filter',
      'community',
    )
    expect(host.dataset['activeFilter']).toBe('community')
    expect(window.location.search).toContain('view=community')

    fireEvent.click(screen.getByTestId('filter-chip-canon'))
    expect(window.location.search).not.toContain('view=community')
  })
})
