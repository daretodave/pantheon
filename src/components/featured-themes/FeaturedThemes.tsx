import Link from 'next/link'
import { Bullet } from '@/components/atoms/Bullet'
import { themesContainingShow } from '@/lib/themes/byShow'

type FeaturedThemesProps = {
  show: string
  showName?: string
}

function formatRevised(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toLowerCase()
}

export function FeaturedThemes({ show, showName }: FeaturedThemesProps) {
  const themes = themesContainingShow(show)
  if (themes.length === 0) return null

  const headingId = `show-themes-${show}`
  const title = showName ?? show

  return (
    <section
      className="show-themes"
      aria-labelledby={headingId}
    >
      <div className="section-head">
        <h2 id={headingId}>Themed lists for {title}.</h2>
        <span className="sec-meta">
          Cross-canon &middot; curated by tiered.tv editors
        </span>
      </div>
      <div className="lists-grid" data-testid="featured-themes">
        {themes.map((theme) => {
          const count = theme.entries?.length ?? 0
          const revised = formatRevised(theme.last_revised)
          return (
            <Link
              key={theme.slug}
              href={`/themes/${theme.slug}`}
              prefetch={false}
              className="list-card"
              data-testid="featured-theme-link"
            >
              <div className="list-card-tag">
                <Bullet color="var(--show-primary)" size={9} />
                <span>
                  list &middot; {count} {count === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <h4>{theme.title}</h4>
              {theme.description ? (
                <p className="list-card-blurb">{theme.description}</p>
              ) : null}
              <div className="list-card-foot">
                <span>{revised ? `updated ${revised}` : ''}</span>
                <b>read the list &rarr;</b>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
