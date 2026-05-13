import { describe, expect, it } from 'vitest'
import { LOCK_MS, initialState, isDisabled, reduce } from './votePair'

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
