import Link from 'next/link'

// Phase 19c: prev/next pair matching
// design/Pantheon · Heroes vs. Villains.html §ADJACENT. Either side
// can be omitted (first season has no prev, last has no next); the
// component renders a single column when only one side exists.

export type AdjacentSide = {
  href: string
  rank?: number | null
  title: string
  caption?: string
}

type AdjacentSeasonsProps = {
  prev?: AdjacentSide | null
  next?: AdjacentSide | null
}

function rankLabel(rank: number | null | undefined, dir: 'prev' | 'next'): string {
  if (rank == null) {
    return dir === 'prev' ? '← Previous season' : 'Next season →'
  }
  const padded = String(rank).padStart(2, '0')
  return dir === 'prev' ? `← #${padded} in Canon` : `#${padded} in Canon →`
}

export function AdjacentSeasons({ prev, next }: AdjacentSeasonsProps) {
  if (!prev && !next) return null
  return (
    <nav
      className="season-related"
      data-testid="adjacent-seasons"
      aria-label="adjacent seasons"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="related-link related-prev"
          data-testid="adjacent-prev"
        >
          <div className="related-tag">{rankLabel(prev.rank, 'prev')}</div>
          <div className="related-title">{prev.title}</div>
          {prev.caption ? <div className="related-cap">{prev.caption}</div> : null}
        </Link>
      ) : null}
      {next ? (
        <Link
          href={next.href}
          className="related-link related-next"
          data-testid="adjacent-next"
        >
          <div className="related-tag">{rankLabel(next.rank, 'next')}</div>
          <div className="related-title">{next.title}</div>
          {next.caption ? <div className="related-cap">{next.caption}</div> : null}
        </Link>
      ) : null}
    </nav>
  )
}
