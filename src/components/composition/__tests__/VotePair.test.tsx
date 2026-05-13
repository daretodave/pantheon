import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import { VotePair } from '../VotePair'

describe('<VotePair>', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Stub fetch — the component fires-and-forgets to /api/vote; we
    // just need the call to not throw.
    Object.defineProperty(globalThis, 'fetch', {
      value: vi.fn(() => Promise.resolve(new Response('ok'))),
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the initial count and renders enabled buttons', () => {
    render(<VotePair initialCount={10} targetType="season" targetId="survivor:20" />)
    expect(screen.getByTestId('vote-count').textContent).toBe('10')
    expect(screen.getByTestId('vote-up')).toBeEnabled()
    expect(screen.getByTestId('vote-down')).toBeEnabled()
  })

  it('clicking up increments the count, locks both buttons, and POSTs to /api/vote', () => {
    render(<VotePair initialCount={5} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-up'))
    expect(screen.getByTestId('vote-count').textContent).toBe('6')
    expect(screen.getByTestId('vote-up')).toBeDisabled()
    expect(screen.getByTestId('vote-down')).toBeDisabled()
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
  })

  it('clicking down decrements the count', () => {
    render(<VotePair initialCount={5} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-down'))
    expect(screen.getByTestId('vote-count').textContent).toBe('4')
  })

  it('unlocks the buttons after the lock window elapses', () => {
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-up'))
    expect(screen.getByTestId('vote-up')).toBeDisabled()
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(screen.getByTestId('vote-up')).toBeEnabled()
  })

  it('flashes the clicked direction during the lock window', () => {
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-up'))
    expect(screen.getByTestId('vote-up').className).toContain('flash')
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(screen.getByTestId('vote-up').className).not.toContain('flash')
  })
})
