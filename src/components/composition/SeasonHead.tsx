import type { ReactNode } from 'react'

type SeasonHeadProps = {
  crumb: ReactNode
  title: string
  eyebrow?: string
  rankRow?: ReactNode
}

// Phase 19c: header of the season article, matching
// design/Pantheon · Heroes vs. Villains.html §SHELL. The crumb
// includes a show-primary bullet; the optional eyebrow renders
// between crumb and h1 in show-primary; the rank row holds the
// two RankTag pills + ShieldBadge.

export function SeasonHead({ crumb, title, eyebrow, rankRow }: SeasonHeadProps) {
  return (
    <header className="season-head" data-testid="season-head">
      <div className="season-crumb">{crumb}</div>
      {eyebrow ? (
        <div className="season-eyebrow" data-testid="season-eyebrow">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="season-h1">{title}</h1>
      {rankRow ? (
        <div className="season-rankrow" data-testid="season-rank-row">
          {rankRow}
        </div>
      ) : null}
    </header>
  )
}
