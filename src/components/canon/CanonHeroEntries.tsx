import type { CanonEntry, Season } from '@/content'

type CanonHeroEntriesProps = {
  entries: CanonEntry[]
  seasonHref: (entry: CanonEntry) => string
  seasonOf: (entry: CanonEntry) => Season | undefined
  eraOf: (entry: CanonEntry) => string | undefined
}

function padRank(rank: number): string {
  return String(rank).padStart(2, '0')
}

function seasonLine(entry: CanonEntry, season: Season | undefined): string {
  const parts: string[] = []
  parts.push(`Season ${entry.season}`)
  if (season?.premiere_date) {
    parts.push(new Date(season.premiere_date).getUTCFullYear().toString())
  }
  if (season?.location) {
    parts.push(season.location)
  }
  return parts.join(' · ')
}

function trendSymbol(sentiment: 'up' | 'down' | 'hold', delta: number): string {
  if (sentiment === 'hold') return '◆ hold'
  if (sentiment === 'up') return `↑ ${Math.abs(delta)}`
  return `↓ ${Math.abs(delta)}`
}

export function CanonHeroEntries({
  entries,
  seasonHref,
  seasonOf,
  eraOf,
}: CanonHeroEntriesProps) {
  return (
    <div className="cp-hero-entries" data-testid="canon-hero-entries">
      {entries.map((entry) => {
        const season = seasonOf(entry)
        const hint = entry.community_rank_hint
        return (
          <a
            key={entry.rank}
            className="cp-hero-entry"
            href={seasonHref(entry)}
            data-testid="canon-hero-entry"
            data-rank={entry.rank}
            data-era={eraOf(entry) ?? ''}
          >
            <div className="cp-he-rank">{padRank(entry.rank)}</div>
            <div className="cp-he-body">
              <h3 className="cp-he-title">{entry.title}</h3>
              <div className="cp-he-season">{seasonLine(entry, season)}</div>
              {entry.tag ? <p className="cp-he-tag">{entry.tag}</p> : null}
              <p className="cp-he-blurb">{entry.rationale}</p>
            </div>
            <div className="cp-he-aside">
              {hint ? (
                <div className="cp-he-mini" data-testid="canon-hero-mini-community">
                  <div className="cp-he-mini-k">
                    <span>Community</span>
                    <span className={`cp-mini-trend ${hint.sentiment}`}>
                      {trendSymbol(hint.sentiment, hint.delta)}
                    </span>
                  </div>
                  <div className="cp-he-mini-v mono">#{padRank(hint.rank)}</div>
                </div>
              ) : null}
              {entry.slot_argument ? (
                <div className="cp-he-mini" data-testid="canon-hero-mini-slot">
                  <div className="cp-he-mini-k">Why this slot</div>
                  <div className="cp-he-mini-v">{entry.slot_argument}</div>
                </div>
              ) : null}
            </div>
          </a>
        )
      })}
    </div>
  )
}
