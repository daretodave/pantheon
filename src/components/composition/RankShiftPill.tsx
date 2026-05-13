import type { CSSProperties, HTMLAttributes } from 'react'

export type RankSentiment =
  | 'warm-up'
  | 'warm-down'
  | 'neutral'
  | 'hold'
  | 'verdict'
  | 'consensus'

type RankShiftPillProps = {
  delta: number
  sentiment: RankSentiment
} & Omit<HTMLAttributes<HTMLSpanElement>, 'style' | 'children'>

function arrow(delta: number): string {
  if (delta > 0) return '↑'
  if (delta < 0) return '↓'
  return '·'
}

export function RankShiftPill({ delta, sentiment, className, ...rest }: RankShiftPillProps) {
  const tokenVar = `--color-sentiment-${sentiment}`
  const style: CSSProperties = {
    color: `var(${tokenVar})`,
    background: `color-mix(in oklab, var(${tokenVar}) 18%, transparent)`,
  }
  const compiled = `rank-pill${className ? ` ${className}` : ''}`
  return (
    <span
      className={compiled}
      style={style}
      data-testid="rank-shift-pill"
      data-sentiment={sentiment}
      data-delta={delta}
      aria-label={
        delta > 0
          ? `rank up ${Math.abs(delta)}`
          : delta < 0
            ? `rank down ${Math.abs(delta)}`
            : 'no rank change'
      }
      {...rest}
    >
      <span aria-hidden="true">{arrow(delta)}</span>
      <span>{Math.abs(delta)}</span>
    </span>
  )
}
