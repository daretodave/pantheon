import Link from 'next/link'
import type { Show } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'

type ShowTileProps = {
  show: Show
  seasonCount: number
}

// Phase 19a placeholder: the rich tile composition (per-show
// paper, big serif name, blurb) is rebuilt in phase 19e against
// the new visual law. For now the tile renders name + blurb +
// bullet, so the e2e harness keeps its anchor while design
// re-grounds.

export function ShowTile({ show, seasonCount }: ShowTileProps) {
  return (
    <Link
      href={`/shows/${show.slug}`}
      prefetch={false}
      className="show-tile"
      data-testid="home-show-tile"
      data-show={show.slug}
      style={
        {
          '--show-paper': show.palette.paper,
          '--show-ink': show.palette.ink,
          '--show-primary': show.palette.primary,
        } as React.CSSProperties
      }
    >
      <div className="show-tile-body">
        <div className="show-tile-name">
          <Bullet color={show.palette.primary} />
          {' '}
          {show.name}
        </div>
        <div className="show-tile-blurb">{show.blurb}</div>
        <div className="show-tile-meta">
          <span data-testid="home-show-tile-meta">
            {seasonCount > 0
              ? `${seasonCount} season${seasonCount === 1 ? '' : 's'} · ranked`
              : 'season count loading'}
          </span>
          <span className="show-tile-arrow" aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
