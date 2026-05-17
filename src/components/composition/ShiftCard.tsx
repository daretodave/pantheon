import type { CommunityMover } from '@/lib/community/live'
import { SHIFT_TIME_LABEL, moverNote } from '@/lib/community/live'
import { RankShiftPill } from './RankShiftPill'

// Phase 35 stage 3c — one card in the show-page "What changed this
// week." row. Faithful port of `design/tiered.tv · Survivor.html`
// §SHIFTS .shift-card. Every value is the snapshot delta (live rank
// vs. the >= 7d baseline) — the pill, the was/now ranks, and a
// strictly data-derived note. No editorial copy is invented; the
// shift-pill is the production RankShiftPill (consistent with
// CommunityMovers), not the design's static markup.

type ShiftCardProps = {
  mover: CommunityMover
}

function padRank(rank: number): string {
  return String(rank).padStart(2, '0')
}

export function ShiftCard({ mover }: ShiftCardProps) {
  return (
    <div className="shift-card" data-testid="shift-card">
      <div className="shift-top">
        <RankShiftPill delta={mover.delta} sentiment={mover.sentiment} />
        <span className="shift-time">{SHIFT_TIME_LABEL}</span>
      </div>
      <div className="shift-title">{mover.season.title}</div>
      <p className="shift-note">{moverNote(mover)}</p>
      <div className="ranks">
        <span>
          was <b>#{padRank(mover.prevRank)}</b>
        </span>
        <span>
          now <b>#{padRank(mover.rank)}</b>
        </span>
        <span>Season {mover.season.number}</span>
      </div>
    </div>
  )
}
