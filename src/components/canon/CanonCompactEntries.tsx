import type { CanonEntry } from '@/content'

type CanonCompactEntriesProps = {
  entries: CanonEntry[]
  seasonHref: (entry: CanonEntry) => string
  eraOf: (entry: CanonEntry) => string | undefined
}

function padRank(rank: number): string {
  return String(rank).padStart(2, '0')
}

export function CanonCompactEntries({
  entries,
  seasonHref,
  eraOf,
}: CanonCompactEntriesProps) {
  return (
    <div className="cp-compact-entries" data-testid="canon-compact-entries">
      {entries.map((entry) => {
        const hint = entry.community_rank_hint
        return (
          <a
            key={entry.rank}
            className="cp-compact-entry"
            href={seasonHref(entry)}
            data-testid="canon-compact-entry"
            data-rank={entry.rank}
            data-era={eraOf(entry) ?? ''}
          >
            <div className="cp-ce-rank">{padRank(entry.rank)}</div>
            <div className="cp-ce-title">{entry.title}</div>
            <div className="cp-ce-tag">{entry.tag ?? ''}</div>
            <div className="cp-ce-meta">
              S{padRank(entry.season)}
              {hint ? ` · Community #${padRank(hint.rank)}` : ''}
            </div>
          </a>
        )
      })}
    </div>
  )
}
