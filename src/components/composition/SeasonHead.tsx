import type { ReactNode } from 'react'

type SeasonHeadProps = {
  crumb: ReactNode
  title: string
  rankRow?: ReactNode
}

// Phase 19a placeholder: the per-show sigil slot is removed —
// per-show illustration is prohibited (design/CLAUDE.md Hard
// Rule 1). The crumb + h1 + rankRow remain; phase 19c rebuilds
// the eyebrow + rank composition against
// design/Pantheon · Heroes vs. Villains.html.

export function SeasonHead({ crumb, title, rankRow }: SeasonHeadProps) {
  return (
    <header className="season-head" data-testid="season-head">
      <div className="season-crumb">{crumb}</div>
      <h1 className="season-h1">{title}</h1>
      {rankRow ? (
        <div className="season-rankrow" data-testid="season-rank-row">
          {rankRow}
        </div>
      ) : null}
    </header>
  )
}
