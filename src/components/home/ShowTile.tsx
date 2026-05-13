import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Show } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'

type ShowTileProps = {
  show: Show
  seasonCount: number
}

export function ShowTile({ show, seasonCount }: ShowTileProps) {
  const tileStyle = {
    background: show.palette.paper,
    color: show.palette.ink,
  } satisfies CSSProperties

  return (
    <Link
      href={`/shows/${show.slug}`}
      prefetch={false}
      className="show-tile"
      data-testid="home-show-tile"
      data-show={show.slug}
      style={tileStyle}
    >
      <div className="show-tile-head">
        <Bullet color={show.palette.primary} size={14} />
        <span className="show-tile-name">{show.name}</span>
      </div>
      <p className="show-tile-blurb">{show.blurb}</p>
      <div className="show-tile-meta">
        <span data-testid="home-show-tile-meta">
          {seasonCount > 0
            ? `${seasonCount} season${seasonCount === 1 ? '' : 's'} · ranked`
            : 'season count loading'}
        </span>
        <span
          className="show-tile-arrow"
          aria-hidden="true"
          style={{ color: show.palette.primary }}
        >
          →
        </span>
      </div>
    </Link>
  )
}
