import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import { VotePair } from '../VotePair'

// Flush the fetch().then(json).then(dispatch) microtask chain.
// `waitFor` polls on real/fake timers and deadlocks under
// `vi.useFakeTimers`, so we drain microtasks explicitly instead.
async function flushAsync() {
  await act(async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve()
  })
}

// Mount fires a GET /api/vote read-back; a click fires a POST.
// `fetchMock` lets each test script the JSON each call resolves
// to (keyed by method) so the optimistic + reconcile paths are
// both exercised deterministically.
type VoteBody = { ok: boolean; value: number; count: number }

function jsonResponse(body: VoteBody) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as unknown as Response)
}

describe('<VotePair>', () => {
  let getBody: VoteBody
  let postBody: VoteBody
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    getBody = { ok: true, value: 0, count: 0 }
    postBody = { ok: true, value: 1, count: 1 }
    fetchMock = vi.fn((input: unknown, init?: { method?: string }) => {
      const method = init?.method ?? 'GET'
      return jsonResponse(method === 'POST' ? postBody : getBody)
    })
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
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
    const postCalls = fetchMock.mock.calls.filter(
      (c) => (c[1] as { method?: string } | undefined)?.method === 'POST',
    )
    expect(postCalls.length).toBe(1)
  })

  it('clicking down decrements the count', () => {
    render(<VotePair initialCount={5} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-down'))
    expect(screen.getByTestId('vote-count').textContent).toBe('4')
  })

  it('reads the viewer existing vote + true net on mount and reflects it', async () => {
    getBody = { ok: true, value: 1, count: 42 }
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    await flushAsync()
    expect(screen.getByTestId('vote-count').textContent).toBe('42')
    expect(screen.getByTestId('vote-pair').getAttribute('data-vote-value')).toBe('1')
  })

  it('POSTs the retract value 0 when re-clicking the already-voted direction', async () => {
    getBody = { ok: true, value: 1, count: 10 }
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    await flushAsync()
    expect(screen.getByTestId('vote-pair').getAttribute('data-vote-value')).toBe('1')
    fireEvent.click(screen.getByTestId('vote-up'))
    const postCall = fetchMock.mock.calls.find(
      (c) => (c[1] as { method?: string } | undefined)?.method === 'POST',
    )
    const sent = JSON.parse((postCall?.[1] as { body: string }).body)
    expect(sent.value).toBe(0)
    // Optimistic net dropped by the prior +1.
    expect(screen.getByTestId('vote-count').textContent).toBe('9')
  })

  it('reconciles the count to the server aggregate after the POST resolves', async () => {
    postBody = { ok: true, value: 1, count: 3 }
    render(<VotePair initialCount={5} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-up'))
    expect(screen.getByTestId('vote-count').textContent).toBe('6') // optimistic
    await flushAsync()
    expect(screen.getByTestId('vote-count').textContent).toBe('3')
  })

  it('a vote that races the mount fetch is not clobbered by the stale snapshot', async () => {
    getBody = { ok: true, value: 0, count: 0 }
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-up')) // before GET resolves
    await flushAsync()
    // hydrate is a no-op post-click; optimistic +1 survives.
    expect(screen.getByTestId('vote-pair').getAttribute('data-vote-value')).toBe('1')
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

  it('drops the slide transform when prefers-reduced-motion matches', () => {
    const original = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    fireEvent.click(screen.getByTestId('vote-up'))
    const num = screen.getByTestId('vote-count')
    expect(num.style.transform).toBe('none')
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: original,
    })
  })

  // --- issue #64: clean integers, voted affordance, load-in ---

  it('reflects the voted direction via aria-pressed + a voted class', async () => {
    getBody = { ok: true, value: 1, count: 7 }
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    await flushAsync()
    const up = screen.getByTestId('vote-up')
    const down = screen.getByTestId('vote-down')
    expect(up.getAttribute('aria-pressed')).toBe('true')
    expect(down.getAttribute('aria-pressed')).toBe('false')
    expect(up.className).toContain('voted')
    expect(up.getAttribute('aria-label')).toMatch(/remove your up vote/i)
    expect(screen.getByTestId('vote-pair').getAttribute('data-voted')).toBe('up')
  })

  it('gates a graceful fade-in via data-hydrated until the mount read resolves', async () => {
    getBody = { ok: true, value: 0, count: 9 }
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    expect(
      screen.getByTestId('vote-pair').getAttribute('data-hydrated'),
    ).toBe('false')
    await flushAsync()
    expect(
      screen.getByTestId('vote-pair').getAttribute('data-hydrated'),
    ).toBe('true')
    expect(screen.getByTestId('vote-count').textContent).toBe('9')
  })

  it('rounds any stray fractional server count to a clean integer', async () => {
    getBody = { ok: true, value: 0, count: 2.6 }
    render(<VotePair initialCount={0} targetType="season" targetId="survivor:20" />)
    await flushAsync()
    expect(screen.getByTestId('vote-count').textContent).toBe('3')
  })
})
