// Phase 30 / 37: pure renderer for the canon scale-track inside
// SeasonInfoCard. Mirrors design/tiered.tv · Heroes vs. Villains.html
// § .scale-* — a thin rule with a primary-colored fill, the rank as a
// 38px mono number, a dot marker on the track with a #NN label, and
// two descriptive endpoint marks (#01 · canon peak / #NN · the tail).
// Fill + dot offset = rank / total (design's width:14.9% for 7/47).

type RankScaleProps = {
  rank: number
  total: number
  headLabel?: string
  meta?: string
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function rankFillPercent(rank: number, total: number): number {
  if (!Number.isFinite(rank) || !Number.isFinite(total) || total <= 0) return 0
  const clamped = Math.max(1, Math.min(rank, total))
  return (clamped / total) * 100
}

export function RankScale({
  rank,
  total,
  headLabel = "Editor's Canon",
  meta,
}: RankScaleProps) {
  const pct = rankFillPercent(rank, total)
  const metaText = meta ?? `${total} ${total === 1 ? 'season' : 'seasons'}`
  return (
    <div data-testid="rank-scale">
      <div className="info-row-head">
        <span>{headLabel}</span>
        <span className="meta">{metaText}</span>
      </div>
      <div className="scale-line">
        <span className="scale-rank" data-testid="rank-scale-rank">
          #{pad2(rank)}
        </span>
        <span className="scale-of">of {total}</span>
      </div>
      <div className="scale-track">
        <div
          className="scale-fill"
          data-testid="rank-scale-fill"
          style={{ width: `${pct.toFixed(2)}%` }}
        />
        <div className="scale-here" style={{ left: `${pct.toFixed(2)}%` }}>
          <span className="scale-here-label" data-testid="rank-scale-here">
            #{pad2(rank)}
          </span>
        </div>
      </div>
      <div className="scale-marks">
        <span>#01 · canon peak</span>
        <span className="end-r">#{pad2(total)} · the tail</span>
      </div>
    </div>
  )
}
