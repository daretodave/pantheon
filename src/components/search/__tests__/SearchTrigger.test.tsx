import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchTrigger } from '../SearchTrigger'
import { SEARCH_OPEN_EVENT } from '../events'

describe('<SearchTrigger>', () => {
  it('renders a button with the search affordance + cmd+K hint', () => {
    render(<SearchTrigger />)
    const button = screen.getByTestId('site-header-search-trigger')
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveTextContent('Search')
    expect(button.textContent).toMatch(/⌘K/)
  })

  it('dispatches the search-open event on click', () => {
    const listener = vi.fn()
    window.addEventListener(SEARCH_OPEN_EVENT, listener)
    render(<SearchTrigger />)
    fireEvent.click(screen.getByTestId('site-header-search-trigger'))
    expect(listener).toHaveBeenCalled()
    window.removeEventListener(SEARCH_OPEN_EVENT, listener)
  })
})
