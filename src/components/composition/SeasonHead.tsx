import type { ReactNode } from 'react'

type SeasonHeadProps = {
  crumb: ReactNode
  sigil?: ReactNode
  title: string
  rankRow?: ReactNode
}

export function SeasonHead({ crumb, sigil, title, rankRow }: SeasonHeadProps) {
  return (
    <header className="season-head" data-testid="season-head">
      <div className="season-crumb">{crumb}</div>
      {sigil ? (
        <div className="season-sigil" data-testid="season-sigil">
          {sigil}
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
