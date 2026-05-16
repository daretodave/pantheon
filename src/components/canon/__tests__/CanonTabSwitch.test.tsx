import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanonTabSwitch } from '../CanonTabSwitch'

function Harness({ initial }: { initial: 'canon' | 'community' }) {
  return (
    <div data-canon-page-root data-view={initial} data-testid="root">
      <CanonTabSwitch initialView={initial} />
    </div>
  )
}

afterEach(() => {
  window.history.replaceState({}, '', '/shows/survivor')
})

describe('<CanonTabSwitch>', () => {
  it('same-page toggle mutates root data-view + ?view= + hash, no nav', () => {
    window.history.replaceState({}, '', '/shows/survivor')
    render(<Harness initial="canon" />)
    const root = screen.getByTestId('root')

    fireEvent.click(screen.getByTestId('canon-tab-community'))
    expect(root).toHaveAttribute('data-view', 'community')
    expect(window.location.pathname).toBe('/shows/survivor')
    expect(new URLSearchParams(window.location.search).get('view')).toBe(
      'community',
    )
    expect(window.location.hash).toBe('#community')

    fireEvent.click(screen.getByTestId('canon-tab-canon'))
    expect(root).toHaveAttribute('data-view', 'canon')
    expect(window.location.pathname).toBe('/shows/survivor')
    expect(new URLSearchParams(window.location.search).get('view')).toBeNull()
    expect(window.location.hash).toBe('#canon')
  })

  it('reads ?view=community on mount and seeds the community view', () => {
    window.history.replaceState({}, '', '/shows/survivor?view=community')
    render(<Harness initial="canon" />)
    expect(screen.getByTestId('root')).toHaveAttribute('data-view', 'community')
    expect(screen.getByTestId('canon-tab-community')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('falls back to the location hash when no ?view= is present', () => {
    window.history.replaceState({}, '', '/shows/survivor#community')
    render(<Harness initial="canon" />)
    expect(screen.getByTestId('root')).toHaveAttribute('data-view', 'community')
  })

  it('renders both tabs as buttons (no route navigation links)', () => {
    window.history.replaceState({}, '', '/shows/survivor')
    render(<Harness initial="canon" />)
    const canonTab = screen.getByTestId('canon-tab-canon')
    const communityTab = screen.getByTestId('canon-tab-community')
    expect(canonTab.tagName).toBe('BUTTON')
    expect(communityTab.tagName).toBe('BUTTON')
    expect(canonTab).toHaveAttribute('role', 'tab')
  })
})
