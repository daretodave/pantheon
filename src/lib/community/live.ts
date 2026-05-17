import type { Season } from '@/content'
import type { RankSentiment } from '@/components/composition/RankShiftPill'
import type { CommunityRankRow } from './ranking'

// Phase 35 stage 3 — presentation helpers for the live community
// surfaces. Pure, no DB, no React. Every counter the live-strip /
// movers / RankShiftPill renders flows through these so the math is
// unit-tested without a database.

// trend is the snapshot delta: baseline rank minus current rank, so
// a positive number means the season climbed (better slot).
export function trendSentiment(trend: number | null): RankSentiment {
  if (trend == null || trend === 0) return 'hold'
  return trend > 0 ? 'warm-up' : 'warm-down'
}

export type CommunityMover = {
  season: Season
  tag: string
  rank: number
  prevRank: number
  delta: number
  sentiment: RankSentiment
}

// The biggest absolute movers since the baseline snapshot, climbers
// and fallers alike, strongest move first; ties broken by current
// (better) rank. Holds and seasons absent from the baseline are
// excluded — they did not move.
export function pickMovers(
  entries: CommunityRankRow[],
  limit = 4,
): CommunityMover[] {
  const moved = entries.filter((e) => e.trend != null && e.trend !== 0)
  moved.sort((a, b) => {
    const da = Math.abs(a.trend as number)
    const db = Math.abs(b.trend as number)
    if (db !== da) return db - da
    return a.rank - b.rank
  })
  return moved.slice(0, limit).map((e) => {
    const delta = e.trend as number
    return {
      season: e.season,
      tag: e.tag,
      rank: e.rank,
      // trend = prevRank - rank  =>  prevRank = rank + trend
      prevRank: e.rank + delta,
      delta,
      sentiment: trendSentiment(delta),
    }
  })
}

// The recompute cadence is weekly (Thursday 9pm ET, v1 contract), so
// a move measured against the >= 7d baseline snapshot is, by
// construction, "this week's" change. This label is the contract,
// not a computed countdown — the same honesty posture as
// NEXT_RECOMPUTE_LABEL below.
export const SHIFT_TIME_LABEL = 'this week'

// The shift-card note. Strictly data-derived from the snapshot delta
// — no invented editorial copy (same posture as CommunityMovers).
// pickMovers only ever yields nonzero-delta movers, so there is no
// "held" branch here.
export function moverNote(mover: CommunityMover): string {
  const n = Math.abs(mover.delta)
  const spots = n === 1 ? 'one spot' : `${n} spots`
  return mover.delta > 0
    ? `Climbed ${spots} since the last weekly recompute.`
    : `Slid ${spots} since the last weekly recompute.`
}

// "2h 14m ago" relative label for the last recompute timestamp.
// Null timestamp = no snapshot has ever been written.
export function formatLastRecompute(
  iso: string | null,
  now: Date = new Date(),
): string {
  if (!iso) return 'votes pending'
  const then = new Date(iso)
  const ms = now.getTime() - then.getTime()
  if (Number.isNaN(ms) || ms < 0) return 'just now'
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  if (hrs < 24) return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? '1d ago' : `${days}d ago`
}

// The recompute cadence is the v1 contract (Thursday 9pm ET, Vercel
// Cron). The next-recompute label is the cadence, not a computed
// countdown — "fresh within the cadence" per the phase brief.
export const NEXT_RECOMPUTE_LABEL = 'Thursday 9pm ET'

export function formatVersion(version: number | null): string {
  return version == null ? 'pending' : `v${version}`
}
