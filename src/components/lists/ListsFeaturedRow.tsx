import type { Show, Theme } from '@/content'
import { FeaturedCard } from './FeaturedCard'

type ListsFeaturedRowProps = {
  featured: Theme[]
  showsByTheme: Record<string, Show[]>
  today?: Date
}

export function ListsFeaturedRow({
  featured,
  showsByTheme,
  today,
}: ListsFeaturedRowProps) {
  if (featured.length === 0) return null

  return (
    <section
      className="lists-featured-section"
      data-testid="lists-featured-section"
    >
      <div className="lists-section-head">
        <h2>Featured this month.</h2>
        <span className="lists-section-meta">
          Editor-selected · refreshed every 1st
        </span>
      </div>
      <div className="lists-featured-row" data-testid="lists-featured-row">
        {featured.map((theme, i) => (
          <FeaturedCard
            key={theme.slug}
            theme={theme}
            shows={showsByTheme[theme.slug] ?? []}
            big={i === 0}
            today={today}
          />
        ))}
      </div>
    </section>
  )
}
