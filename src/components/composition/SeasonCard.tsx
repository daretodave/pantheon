import Link from 'next/link'
import type { RankSentiment } from './RankShiftPill'
import { RankShiftPill } from './RankShiftPill'

export type SeasonCardShift = {
  delta: number
  sentiment: RankSentiment
}

type SeasonCardProps = {
  rank: number
  title: string
  tag: string
  seasonNumber: number | string
  href: string
  shift?: SeasonCardShift | null
}

function formatRank(rank: number): string {
  return `#${String(rank).padStart(2, '0')}`
}

function formatSeason(n: number | string): string {
  const padded = typeof n === 'number' ? String(n).padStart(2, '0') : n
  return `Season ${padded}`
}

export function SeasonCard({ rank, title, tag, seasonNumber, href, shift }: SeasonCardProps) {
  return (
    <Link className="season-card" href={href} data-testid="season-card" data-rank={rank}>
      <div className="season-rank" aria-label={`rank ${rank}`}>
        {formatRank(rank)}
      </div>
      <div className="season-meta">
        <div className="season-title">{title}</div>
        <div className="season-tag">{tag}</div>
        <div className="season-bottom">
          <span className="season-num">{formatSeason(seasonNumber)}</span>
          {shift ? <RankShiftPill delta={shift.delta} sentiment={shift.sentiment} /> : null}
        </div>
      </div>
    </Link>
  )
}
