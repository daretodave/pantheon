// Pure state machine for the per-season vote pair.
//
// The component layer mounts a useReducer over this module.
// Phase 9 shipped the optimistic-only component; phase 35
// stage 3 wires the read-back path:
//   - `hydrate` seeds value + count from GET /api/vote on mount,
//     but only while the viewer hasn't acted yet (a click that
//     races the fetch must win — the fetch is stale by then).
//   - `reconcile` snaps value + count to the server's truth after
//     a POST resolves, so a refresh and the live pill agree and a
//     re-click can never drift the net.
// The reducer signature is otherwise unchanged.

export type VoteSentiment = 'up' | 'down' | null

export type VoteValue = 1 | -1 | 0

export type VotePhase = 'idle' | 'locked'

export type VotePairState = {
  phase: VotePhase
  value: VoteValue
  count: number
  lockedUntil: number | null
  flash: VoteSentiment
  // True once the viewer has clicked. Gates `hydrate`: a vote
  // that races the mount fetch must not be overwritten by the
  // (now stale) server snapshot the fetch carries.
  userActed: boolean
}

export const LOCK_MS = 800

export function initialState(args: {
  initialCount: number
  initialValue?: VoteValue
}): VotePairState {
  return {
    phase: 'idle',
    value: args.initialValue ?? 0,
    count: args.initialCount,
    lockedUntil: null,
    flash: null,
    userActed: false,
  }
}

type Action =
  | { type: 'click'; direction: 'up' | 'down'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'hydrate'; value: VoteValue; count: number }
  | { type: 'reconcile'; value: VoteValue; count: number }

function isLocked(s: VotePairState, now: number): boolean {
  return s.phase === 'locked' && (s.lockedUntil ?? 0) > now
}

export function reduce(s: VotePairState, action: Action): VotePairState {
  if (action.type === 'tick') {
    if (s.phase === 'locked' && (s.lockedUntil ?? 0) <= action.now) {
      return { ...s, phase: 'idle', lockedUntil: null, flash: null }
    }
    return s
  }

  if (action.type === 'hydrate') {
    // Stale-fetch guard: once the viewer has voted, the mount
    // snapshot is behind the optimistic state — drop it.
    if (s.userActed) return s
    if (s.value === action.value && s.count === action.count) return s
    return { ...s, value: action.value, count: action.count }
  }

  if (action.type === 'reconcile') {
    // Server truth wins after a write. Leave phase/lock/flash
    // alone so the in-flight flash + lock window still play out;
    // the subsequent `tick` clears them.
    if (s.value === action.value && s.count === action.count) return s
    return { ...s, value: action.value, count: action.count }
  }

  if (isLocked(s, action.now)) return s

  const delta: VoteValue = action.direction === 'up' ? 1 : -1
  const newValue: VoteValue = s.value === delta ? 0 : delta
  const newCount = s.count + (newValue - s.value)
  return {
    phase: 'locked',
    value: newValue,
    count: newCount,
    lockedUntil: action.now + LOCK_MS,
    flash: action.direction,
    userActed: true,
  }
}

// The value a click would resolve to, given the current value.
// Exported so the component POSTs the *resulting* vote (which may
// be 0 — a retract) instead of the raw button direction. Sending
// the raw direction was the root of the "re-up makes the net go
// down" bug: the UI toggled to 0 but the server kept the +1.
export function nextValue(current: VoteValue, direction: 'up' | 'down'): VoteValue {
  const delta: VoteValue = direction === 'up' ? 1 : -1
  return current === delta ? 0 : delta
}

export function isDisabled(s: VotePairState, now: number): boolean {
  return isLocked(s, now)
}
