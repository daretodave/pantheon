import Link from 'next/link'
import type { Theme } from '@/content'

type ListTileProps = {
  theme: Theme
}

export function ListTile({ theme }: ListTileProps) {
  const entryCount = theme.entries.length
  const sentiment = theme.sentiment
  return (
    <Link
      href={`/themes/${theme.slug}`}
      prefetch={false}
      className="list-tile"
      data-testid="home-list-tile"
      data-theme={theme.slug}
      data-sentiment={sentiment}
    >
      <div
        className="list-tile-dot"
        data-testid="home-list-tile-dot"
        style={{ background: `var(--s-${sentiment})` }}
      />
      <div>
        <div className="list-tile-title">{theme.title}</div>
        <div className="list-tile-meta">
          editorial · {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        </div>
      </div>
      <div className="list-tile-arrow" aria-hidden="true">
        →
      </div>
    </Link>
  )
}
