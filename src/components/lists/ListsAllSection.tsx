import type { Show, Theme, ThemeCategory } from '@/content'
import { GROUP_HEAD_LABELS } from '@/lib/themes-format'
import { ListRow } from './ListRow'

const ORDERED_CATEGORIES: ThemeCategory[] = ['tone', 'craft', 'era', 'single']

type ListsAllSectionProps = {
  byCategory: Record<ThemeCategory, Theme[]>
  showsByTheme: Record<string, Show[]>
  today?: Date
}

export function ListsAllSection({
  byCategory,
  showsByTheme,
  today,
}: ListsAllSectionProps) {
  const groups = ORDERED_CATEGORIES.filter(
    (cat) => byCategory[cat].length > 0,
  )

  if (groups.length === 0) return null

  return (
    <section className="lists-all-section" data-testid="lists-all-section">
      <div className="lists-section-head">
        <h2>All lists.</h2>
        <span className="lists-section-meta">
          Organized by what they&rsquo;re admiring
        </span>
      </div>
      <div className="lists-all-wrap">
        {groups.map((cat) => {
          const themes = byCategory[cat]
          return (
            <div
              key={cat}
              className="list-group"
              data-testid="lists-group"
              data-category={cat}
            >
              <div className="list-group-head">
                {GROUP_HEAD_LABELS[cat]} · {themes.length}
              </div>
              <div className="list-stack">
                {themes.map((theme) => (
                  <ListRow
                    key={theme.slug}
                    theme={theme}
                    shows={showsByTheme[theme.slug] ?? []}
                    today={today}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
