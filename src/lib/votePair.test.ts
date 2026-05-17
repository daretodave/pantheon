import { describe, expect, it } from 'vitest'
import { LOCK_MS, initialState, isDisabled, nextValue, reduce } from './votePair'

describe('votePair.initialState', () => {
  it('starts idle with the given count and value 0 by default', () => {
    const s = initialState({ initialCount: 12 })
    expect(s).toMatchObject({ phase: 'idle', value: 0, count: 12, lockedUntil: null, flash: null })
  })

  it('honors an explicit initialValue', () => {
    const s = initialState({ initialCount: 5, initialValue: 1 })
    expect(s.value).toBe(1)
  })
})

describe('votePair.reduce — click', () => {
  it('clicking up from neutral increments and locks', () => {
    const s = reduce(initialState({ initialCount: 10 }), { type: 'click', direction: 'up', now: 100 })
    expect(s.value).toBe(1)
    expect(s.count).toBe(11)
    expect(s.phase).toBe('locked')
    expect(s.lockedUntil).toBe(100 + LOCK_MS)
    expect(s.flash).toBe('up')
  })

  it('clicking down from neutral decrements and locks', () => {
    const s = reduce(initialState({ initialCount: 10 }), { type: 'click', direction: 'down', now: 100 })
    expect(s.value).toBe(-1)
    expect(s.count).toBe(9)
    expect(s.flash).toBe('down')
  })

  it('clicking the same direction again retracts (value 1 → 0) and decreases count', () => {
    const after = reduce(initialState({ initialCount: 10, initialValue: 1 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    expect(after.value).toBe(0)
    expect(after.count).toBe(9)
  })

  it('clicking the opposite direction swaps (value 1 → -1) and shifts count by 2', () => {
    const after = reduce(initialState({ initialCount: 10, initialValue: 1 }), {
      type: 'click',
      direction: 'down',
      now: 100,
    })
    expect(after.value).toBe(-1)
    expect(after.count).toBe(8)
  })

  it('ignores clicks while locked', () => {
    const locked = reduce(initialState({ initialCount: 0 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    const ignored = reduce(locked, { type: 'click', direction: 'up', now: 200 })
    expect(ignored).toBe(locked)
  })
})

describe('votePair.reduce — tick', () => {
  it('returns the same state when not locked', () => {
    const s = initialState({ initialCount: 0 })
    expect(reduce(s, { type: 'tick', now: 100 })).toBe(s)
  })

  it('returns the same state when locked and lock window not yet elapsed', () => {
    const locked = reduce(initialState({ initialCount: 0 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    expect(reduce(locked, { type: 'tick', now: 200 })).toBe(locked)
  })

  it('unlocks and clears flash when the lock window has elapsed', () => {
    const locked = reduce(initialState({ initialCount: 0 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    const unlocked = reduce(locked, { type: 'tick', now: 100 + LOCK_MS })
    expect(unlocked.phase).toBe('idle')
    expect(unlocked.lockedUntil).toBeNull()
    expect(unlocked.flash).toBeNull()
    expect(unlocked.value).toBe(1)
    expect(unlocked.count).toBe(1)
  })
})

describe('votePair.reduce — hydrate (mount read-back)', () => {
  it('seeds value + count from the server before the viewer acts', () => {
    const s = reduce(initialState({ initialCount: 0 }), {
      type: 'hydrate',
      value: 1,
      count: 7,
    })
    expect(s.value).toBe(1)
    expect(s.count).toBe(7)
    expect(s.userActed).toBe(false)
  })

  it('is a no-op once the viewer has clicked (stale-fetch guard)', () => {
    const clicked = reduce(initialState({ initialCount: 0 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    expect(clicked.userActed).toBe(true)
    const after = reduce(clicked, { type: 'hydrate', value: -1, count: 99 })
    expect(after).toBe(clicked)
  })

  it('returns the same state reference when the snapshot matches', () => {
    const s = initialState({ initialCount: 5, initialValue: 1 })
    expect(reduce(s, { type: 'hydrate', value: 1, count: 5 })).toBe(s)
  })
})

describe('votePair.reduce — reconcile (post-write server truth)', () => {
  it('snaps value + count to the server aggregate, leaving the lock intact', () => {
    const clicked = reduce(initialState({ initialCount: 0 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    // Optimistic count was 1; server says the weighted net is 0.3.
    const reconciled = reduce(clicked, { type: 'reconcile', value: 1, count: 0.3 })
    expect(reconciled.value).toBe(1)
    expect(reconciled.count).toBe(0.3)
    expect(reconciled.phase).toBe('locked')
    expect(reconciled.flash).toBe('up')
  })
})

describe('votePair.nextValue', () => {
  it('resolves a fresh up-click to +1 and a fresh down-click to -1', () => {
    expect(nextValue(0, 'up')).toBe(1)
    expect(nextValue(0, 'down')).toBe(-1)
  })

  it('resolves a re-click in the same direction to 0 (retract)', () => {
    expect(nextValue(1, 'up')).toBe(0)
    expect(nextValue(-1, 'down')).toBe(0)
  })

  it('resolves an opposite click to the opposite value (swap)', () => {
    expect(nextValue(1, 'down')).toBe(-1)
    expect(nextValue(-1, 'up')).toBe(1)
  })
})

describe('votePair.isDisabled', () => {
  it('returns false when state is idle', () => {
    expect(isDisabled(initialState({ initialCount: 0 }), 0)).toBe(false)
  })

  it('returns true while locked and now < lockedUntil', () => {
    const locked = reduce(initialState({ initialCount: 0 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    expect(isDisabled(locked, 200)).toBe(true)
  })

  it('returns false once now >= lockedUntil', () => {
    const locked = reduce(initialState({ initialCount: 0 }), {
      type: 'click',
      direction: 'up',
      now: 100,
    })
    expect(isDisabled(locked, 100 + LOCK_MS)).toBe(false)
  })
})
