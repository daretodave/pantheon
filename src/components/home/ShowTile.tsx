import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Show } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'

export type ShowTileVariant = 'featured' | 'compact'

type ShowTileProps = {
  show: Show
  seasonCount: number
  variant?: ShowTileVariant
}

function metaCopy(show: Show, seasonCount: number, variant: ShowTileVariant) {
  if (variant === 'compact') {
    if (seasonCount <= 0) return 'season count loading'
    return `${seasonCount} season${seasonCount === 1 ? '' : 's'}`
  }
  if (seasonCount <= 0) return 'season count loading'
  return `${seasonCount} season${seasonCount === 1 ? '' : 's'} · canon + community`
}

export function ShowTile({
  show,
  seasonCount,
  variant = 'featured',
}: ShowTileProps) {
  const tileStyle = {
    '--tile-paper': show.palette.paper,
    '--tile-ink': show.palette.ink,
    '--tile-primary': show.palette.primary,
  } as CSSProperties
  const bulletSize = variant === 'compact' ? 10 : 12
  const className = variant === 'compact' ? 'show-tile compact' : 'show-tile'

  return (
    <Link
      href={`/shows/${show.slug}`}
      prefetch={false}
      className={className}
      data-testid="home-show-tile"
      data-variant={variant}
      data-show={show.slug}
      style={tileStyle}
    >
      <div>
        <div className="show-tile-head">
          <Bullet color={show.palette.primary} size={bulletSize} />
          <span className="show-tile-tag">{show.genre_tag}</span>
        </div>
        <h3 className="show-tile-name">{show.name}</h3>
      </div>
      {variant === 'featured' ? (
        <p className="show-tile-blurb">{show.blurb}</p>
      ) : null}
      <div className="show-tile-foot">
        <span className="show-tile-meta" data-testid="home-show-tile-meta">
          {metaCopy(show, seasonCount, variant)}
        </span>
        <span className="show-tile-arrow" aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  )
}
