'use client'

import { useEffect, useReducer } from 'react'
import { initialState, reduce, type VotePairState } from '@/lib/votePair'

type VotePairProps = {
  initialCount?: number
  targetType: 'season' | 'comment'
  targetId: string
  label?: string
}

type Action =
  | { type: 'click'; direction: 'up' | 'down'; now: number }
  | { type: 'tick'; now: number }

function reducer(state: VotePairState, action: Action): VotePairState {
  return reduce(state, action)
}

export function VotePair({
  initialCount = 0,
  targetType,
  targetId,
  label = 'votes',
}: VotePairProps) {
  const [state, dispatch] = useReducer(reducer, { initialCount }, initialState)

  useEffect(() => {
    if (state.phase !== 'locked' || state.lockedUntil == null) return
    const delay = Math.max(0, state.lockedUntil - Date.now())
    const t = window.setTimeout(() => dispatch({ type: 'tick', now: Date.now() }), delay)
    return () => window.clearTimeout(t)
  }, [state])

  const onClick = (direction: 'up' | 'down') => () => {
    const now = Date.now()
    dispatch({ type: 'click', direction, now })
    void fetch('/api/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, value: direction === 'up' ? 1 : -1 }),
    }).catch(() => {
      /* phase 9 ships the optimistic update only — network failures are
         tolerated; the user sees the count change either way. phase 11
         wires real persistence + error recovery. */
    })
  }

  const disabled = state.phase === 'locked'
  const flashUp = state.flash === 'up' ? ' flash' : ''
  const flashDown = state.flash === 'down' ? ' flash' : ''

  return (
    <div className="vote-pair" data-testid="vote-pair" data-vote-value={state.value}>
      <button
        type="button"
        className={`vote-btn vote-down${flashDown}`}
        onClick={onClick('down')}
        disabled={disabled}
        aria-label="Vote down"
        data-testid="vote-down"
      >
        −
      </button>
      <div className="vote-count">
        <span className="vote-num" data-testid="vote-count">
          {state.count}
        </span>
        <span className="vote-label">{label}</span>
      </div>
      <button
        type="button"
        className={`vote-btn vote-up${flashUp}`}
        onClick={onClick('up')}
        disabled={disabled}
        aria-label="Vote up"
        data-testid="vote-up"
      >
        +
      </button>
    </div>
  )
}
