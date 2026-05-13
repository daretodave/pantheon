import Image from 'next/image'
import Link from 'next/link'
import type { Show } from '@/content'

type ShowTileProps = {
  show: Show
  seasonCount: number
  artSrc: string
}

// Mirrors the .show-tile composition in screens.jsx. Each tile
// uses the per-show palette via inline CSS vars so dark/light
// shows render correctly inside the same grid.

export function ShowTile({ show, seasonCount, artSrc }: ShowTileProps) {
  const blurb = show.tagline ?? show.format
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
      <div className="show-tile-art">
        <Image
          src={artSrc}
          alt=""
          aria-hidden="true"
          width={96}
          height={96}
          loading="lazy"
          unoptimized
        />
      </div>
      <div className="show-tile-body">
        <div className="show-tile-name">{show.name}</div>
        <div className="show-tile-blurb">{blurb}</div>
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
