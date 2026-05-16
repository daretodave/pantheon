import type { CanonEntry } from '@/content'

type CanonTailEntriesProps = {
  entries: CanonEntry[]
  seasonHref: (entry: CanonEntry) => string
  eraOf: (entry: CanonEntry) => string | undefined
}

function padRank(rank: number): string {
  return String(rank).padStart(2, '0')
}

export function CanonTailEntries({
  entries,
  seasonHref,
  eraOf,
}: CanonTailEntriesProps) {
  return (
    <div className="cp-tail-table" data-testid="canon-tail-entries">
      {entries.map((entry) => {
        const hint = entry.community_rank_hint
        return (
          <a
            key={entry.rank}
            className="cp-tail-row"
            href={seasonHref(entry)}
            data-testid="canon-tail-row"
            data-rank={entry.rank}
            data-era={eraOf(entry) ?? ''}
          >
            <div className="cp-tr-rank">{padRank(entry.rank)}</div>
            <div className="cp-tr-title">{entry.title}</div>
            <div className="cp-tr-tag">{entry.tag ?? ''}</div>
            <div className="cp-tr-num">
              S{padRank(entry.season)}
              {hint ? ` · Community #${padRank(hint.rank)}` : ''}
            </div>
          </a>
        )
      })}
    </div>
  )
}
