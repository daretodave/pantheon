import Link from 'next/link'
import type { Show, Theme } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'
import { formatThemeStatus } from '@/lib/themes-format'

type ListRowProps = {
  theme: Theme
  shows: Show[]
  today?: Date
}

export function ListRow({ theme, shows, today }: ListRowProps) {
  const entryCount = theme.entries.length
  const status = formatThemeStatus(theme.status, theme.last_revised, today)

  return (
    <Link
      href={`/themes/${theme.slug}`}
      prefetch={false}
      className="list-row"
      data-testid="lists-row"
      data-slug={theme.slug}
    >
      <span className="list-row-bullets">
        {shows.map((show) => (
          <Bullet
            key={show.slug}
            color={show.palette.primary}
            size={10}
          />
        ))}
      </span>
      <span className="list-row-body">
        <span className="list-row-title">{theme.title}</span>
        <span className="list-row-blurb">{theme.description}</span>
      </span>
      <span className="list-row-meta">
        {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        <br />
        {status}
      </span>
      <span className="list-row-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
