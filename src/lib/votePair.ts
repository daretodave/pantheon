// Pure state machine for the per-season vote pair.
//
// The component layer mounts a useReducer over this module. Phase 9
// ships the working component; phases 11–12 will swap the network
// path for real Supabase writes — the reducer signature stays the
// same.

export type VoteSentiment = 'up' | 'down' | null

export type VoteValue = 1 | -1 | 0

export type VotePhase = 'idle' | 'locked'

export type VotePairState = {
  phase: VotePhase
  value: VoteValue
  count: number
  lockedUntil: number | null
  flash: VoteSentiment
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
  }
}

type Action =
  | { type: 'click'; direction: 'up' | 'down'; now: number }
  | { type: 'tick'; now: number }

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
  }
}

export function isDisabled(s: VotePairState, now: number): boolean {
  return isLocked(s, now)
}
