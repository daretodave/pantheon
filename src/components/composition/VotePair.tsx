'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import {
  initialState,
  nextValue,
  reduce,
  type VotePairState,
  type VoteValue,
} from '@/lib/votePair'

function asVoteValue(n: unknown): VoteValue {
  return n === 1 ? 1 : n === -1 ? -1 : 0
}

type VotePairProps = {
  initialCount?: number
  targetType: 'season' | 'comment'
  targetId: string
  label?: string
}

type Action =
  | { type: 'click'; direction: 'up' | 'down'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'hydrate'; value: VoteValue; count: number }
  | { type: 'reconcile'; value: VoteValue; count: number }

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
 * Phase 35 stage 3 wires the read-back path. On mount it GETs
 * `/api/vote` to seed the viewer's existing vote + the true net
 * (so a refresh stops showing the static 0). A click POSTs the
 * *resolved* value (a re-click sends 0 — a retract — not the raw
 * direction) and reconciles the count to the server's aggregate
 * on response. The optimistic flash still runs immediately;
 * network failures fall back to optimistic-only without a toast
 * (a proper error affordance is still on the backlog).
 */
export function VotePair({
  initialCount = 0,
  targetType,
  targetId,
  label = 'net votes',
}: VotePairProps) {
  const [state, dispatch] = useReducer(reducer, { initialCount }, initialState)
  const reduced = useRef(false)
  // Until the mount read-back resolves (or the viewer acts), the
  // number is a placeholder, not the true net. `hydrated` gates a
  // one-time opacity fade so it doesn't pop 0 -> <X> (issue #64).
  const [hydrated, setHydrated] = useState(false)

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

  // Mount read-back: seed the viewer's current vote + the true
  // net from the server. The reducer's `hydrate` is a no-op once
  // the viewer has clicked, so a fast vote that races this fetch
  // is never clobbered by the (now stale) snapshot.
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ targetType, targetId })
    fetch(`/api/vote?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { ok?: boolean; value?: unknown; count?: unknown } | null) => {
        if (cancelled || !json || json.ok !== true) return
        dispatch({
          type: 'hydrate',
          value: asVoteValue(json.value),
          count: Number(json.count) || 0,
        })
        setHydrated(true)
      })
      .catch(() => {
        /* Optimistic-only fallback — keep the static initialCount. */
      })
    return () => {
      cancelled = true
    }
  }, [targetType, targetId])

  const onClick = (direction: 'up' | 'down') => () => {
    const now = Date.now()
    // POST the value the click *resolves* to, not the button
    // direction — a re-click is a retract (0), and sending the
    // raw direction was the root of the "re-up drops the net" bug.
    const sent = nextValue(state.value, direction)
    dispatch({ type: 'click', direction, now })
    // The viewer acted — the optimistic number is now authoritative
    // even if the mount fetch hasn't landed; show it, don't fade.
    setHydrated(true)
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, value: sent }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { ok?: boolean; value?: unknown; count?: unknown } | null) => {
        if (!json || json.ok !== true) return
        dispatch({
          type: 'reconcile',
          value: asVoteValue(json.value),
          count: Number(json.count) || 0,
        })
      })
      .catch(() => {
        /* Optimistic-only path — the flash already ran. */
      })
  }

  const disabled = state.phase === 'locked'
  const votedUp = state.value === 1
  const votedDown = state.value === -1
  const votedDir = votedUp ? 'up' : votedDown ? 'down' : 'none'
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
      data-voted={votedDir}
      data-hydrated={hydrated ? 'true' : 'false'}
      aria-label={`Vote on ${label}`}
    >
      <button
        type="button"
        className={`vote-btn vote-down${flashDownClass}${votedDown ? ' voted' : ''}`}
        onClick={onClick('down')}
        disabled={disabled}
        aria-pressed={votedDown}
        aria-label={
          votedDown ? `Remove your down vote on ${label}` : `Vote down ${label}`
        }
        title={votedDown ? 'You voted this down — click to undo' : undefined}
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
          {Math.round(state.count).toLocaleString()}
        </span>
        <span className="vote-label">{label}</span>
      </div>
      <button
        type="button"
        className={`vote-btn vote-up${flashUpClass}${votedUp ? ' voted' : ''}`}
        onClick={onClick('up')}
        disabled={disabled}
        aria-pressed={votedUp}
        aria-label={
          votedUp ? `Remove your up vote on ${label}` : `Vote up ${label}`
        }
        title={votedUp ? 'You voted this up — click to undo' : undefined}
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
