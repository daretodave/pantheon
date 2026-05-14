import Link from 'next/link'
import type { Show, Theme, ThemeEntry } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'

type ListEntryStackProps = {
  theme: Theme
  showsBySlug: Map<string, Show>
  // 31a: `<show>:<season-number>` → season slug. The list-detail
  // page builds this from the loader; absent entries fall through
  // to the digit form, which the season-page 308s to the canonical
  // slug. Optional so existing unit-test fixtures keep working.
  seasonSlugByKey?: Map<string, string>
}

function defaultShowName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function defaultSeasonLabel(entry: ThemeEntry): string {
  const n = String(entry.season).padStart(2, '0')
  return `S${n}`
}

export function ListEntryStack({ theme, showsBySlug, seasonSlugByKey }: ListEntryStackProps) {
  const ordered = [...theme.entries].sort((a, b) => a.rank - b.rank)
  const count = ordered.length

  return (
    <section className="entries" data-testid="list-entries">
      <div className="entries-head">
        <h2>The {count}, in order.</h2>
        <span className="entries-meta">Ranked · Editor&rsquo;s Canon</span>
      </div>
      <ol className="entry-stack" data-testid="list-entry-stack">
        {ordered.map((entry) => {
          const show = showsBySlug.get(entry.show)
          const showName = show?.name ?? defaultShowName(entry.show)
          const bulletColor = show?.palette.primary ?? 'var(--color-ink-3)'
          const seasonLabel = entry.season_label ?? defaultSeasonLabel(entry)
          const rankStr = `#${String(entry.rank).padStart(2, '0')}`
          const slug = seasonSlugByKey?.get(`${entry.show}:${entry.season}`)
          const href = slug
            ? `/shows/${entry.show}/season/${slug}`
            : `/shows/${entry.show}/season/${entry.season}`

          return (
            <li
              key={`${entry.show}-${entry.season}-${entry.rank}`}
              data-testid="list-entry"
              data-rank={entry.rank}
              data-show={entry.show}
            >
              <Link href={href} prefetch={false} className="entry-row">
                <span className="entry-rank">{rankStr}</span>
                <span className="entry-bullet">
                  <Bullet color={bulletColor} size={14} />
                </span>
                <span className="entry-body">
                  <span className="entry-meta-line">
                    <span className="show">{showName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{seasonLabel}</span>
                  </span>
                  <span className="entry-title">{entry.title}</span>
                  <span className="entry-blurb">{entry.blurb}</span>
                </span>
                <span className="entry-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
