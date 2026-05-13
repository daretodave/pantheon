import Link from 'next/link'
import type { Show, Theme } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'
import { formatThemeStatus } from '@/lib/themes-format'

type FeaturedCardProps = {
  theme: Theme
  shows: Show[]
  big?: boolean
  today?: Date
}

export function FeaturedCard({
  theme,
  shows,
  big = false,
  today,
}: FeaturedCardProps) {
  const entryCount = theme.entries.length
  const isSingleShow = shows.length === 1
  const showLabel = isSingleShow
    ? shows[0]?.name ?? 'Single-show'
    : 'Cross-canon'
  const status = formatThemeStatus(theme.status, theme.last_revised, today)
  const cta = big ? 'read the list →' : 'read →'

  return (
    <Link
      href={`/themes/${theme.slug}`}
      prefetch={false}
      className={`feat-card${big ? ' big' : ''}`}
      data-testid="lists-featured-card"
      data-slug={theme.slug}
      data-big={big ? 'true' : 'false'}
    >
      <div className="feat-tag">
        <span className="feat-bullets" data-testid="lists-featured-bullets">
          {shows.map((show) => (
            <Bullet
              key={show.slug}
              color={show.palette.primary}
              size={9}
            />
          ))}
        </span>
        <span>
          {showLabel} · {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      <h3>{theme.title}</h3>
      <p className="feat-blurb">{theme.description}</p>
      <div className="feat-foot">
        <span data-testid="lists-featured-status">{status}</span>
        <b>{cta}</b>
      </div>
    </Link>
  )
}
