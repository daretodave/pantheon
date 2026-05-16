import type { CanonEntry, Season } from '@/content'

type CanonMidEntriesProps = {
  entries: CanonEntry[]
  seasonHref: (entry: CanonEntry) => string
  seasonOf: (entry: CanonEntry) => Season | undefined
  eraOf: (entry: CanonEntry) => string | undefined
}

function padRank(rank: number): string {
  return String(rank).padStart(2, '0')
}

function metaLine(entry: CanonEntry, season: Season | undefined): string {
  const year = season?.premiere_date
    ? new Date(season.premiere_date).getUTCFullYear().toString()
    : null
  const parts: string[] = [`S${padRank(entry.season)}`]
  if (year) parts.push(year)
  return parts.join(' · ')
}

export function CanonMidEntries({
  entries,
  seasonHref,
  seasonOf,
  eraOf,
}: CanonMidEntriesProps) {
  return (
    <div className="cp-mid-entries" data-testid="canon-mid-entries">
      {entries.map((entry) => {
        const season = seasonOf(entry)
        return (
          <a
            key={entry.rank}
            className="cp-mid-entry"
            href={seasonHref(entry)}
            data-testid="canon-mid-entry"
            data-rank={entry.rank}
            data-era={eraOf(entry) ?? ''}
          >
            <div className="cp-mid-rank">{padRank(entry.rank)}</div>
            <div>
              <h4 className="cp-mid-title">{entry.title}</h4>
              {entry.tag ? <p className="cp-mid-tag">{entry.tag}</p> : null}
              <p className="cp-mid-blurb">{entry.rationale}</p>
              <div className="cp-mid-meta">
                <span>{metaLine(entry, season)}</span>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
