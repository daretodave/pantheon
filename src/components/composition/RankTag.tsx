import type { ReactNode } from 'react'

// Phase 19c: pill matching design/Pantheon · Heroes vs. Villains.html
// §SHELL .rank-tag. Two cells (label + value) with an optional trailing
// slot for a <RankShiftPill>.

type RankTagProps = {
  label: string
  value: string
  trailing?: ReactNode
}

export function RankTag({ label, value, trailing }: RankTagProps) {
  return (
    <div className="rank-tag" data-testid="rank-tag">
      <span className="rank-label">{label}</span>
      <span className="rank-num">{value}</span>
      {trailing ?? null}
    </div>
  )
}
