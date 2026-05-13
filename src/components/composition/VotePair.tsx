'use client'

import { useEffect, useReducer, useRef } from 'react'
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

/**
 * VotePair — design port of `design/compositions/interactions.jsx`.
 *
 * Pill-shaped container with three cells: down button, count, up button.
 * Clicking flashes the button background in the matching sentiment color
 * for the lock window, and the count slides 8px in the vote's direction
 * (up vote = count slides up). `prefers-reduced-motion` collapses the
 * slide to an opacity fade per `design/tokens.json` motion.reduced.
 *
 * Wiring to `/api/vote` is fire-and-forget — the optimistic count +
 * flash always runs. Network failures (e.g. a stale Supabase RPC) do
 * not block the visual feedback, but they also don't currently warn
 * the reader; a proper error toast is on the backlog.
 */
export function VotePair({
  initialCount = 0,
  targetType,
  targetId,
  label = 'net votes',
}: VotePairProps) {
  const [state, dispatch] = useReducer(reducer, { initialCount }, initialState)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  }, [])

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
      /* Optimistic-only path for phase 9. Phase 11 wires recovery. */
    })
  }

  const disabled = state.phase === 'locked'
  // Bump derives from flash so the count slides UP for an up-vote and
  // DOWN for a down-vote. -8px translation in the slide direction.
  const bump = state.flash === 'up' ? 1 : state.flash === 'down' ? -1 : 0
  const flashUpClass = state.flash === 'up' ? ' flash' : ''
  const flashDownClass = state.flash === 'down' ? ' flash' : ''

  const numStyle = reduced.current
    ? { transform: 'none', opacity: state.flash ? 0.6 : 1 }
    : { transform: `translateY(${bump * -8}px)` }

  return (
    <div
      className="vote-pair"
      data-testid="vote-pair"
      data-vote-value={state.value}
      aria-label={`Vote on ${label}`}
    >
      <button
        type="button"
        className={`vote-btn vote-down${flashDownClass}`}
        onClick={onClick('down')}
        disabled={disabled}
        aria-label={`Vote down ${label}`}
        data-testid="vote-down"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M5 12 L12 19 L19 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="5"
            x2="12"
            y2="19"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div className={`vote-count${state.flash ? ' moving' : ''}`}>
        <span
          className={`vote-num${reduced.current ? ' reduced' : ''}`}
          data-testid="vote-count"
          style={numStyle}
        >
          {state.count.toLocaleString()}
        </span>
        <span className="vote-label">{label}</span>
      </div>
      <button
        type="button"
        className={`vote-btn vote-up${flashUpClass}`}
        onClick={onClick('up')}
        disabled={disabled}
        aria-label={`Vote up ${label}`}
        data-testid="vote-up"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M5 12 L12 5 L19 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="19"
            x2="12"
            y2="5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
