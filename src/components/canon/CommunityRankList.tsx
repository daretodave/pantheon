import type { CommunityRankEntry, CommunityRankSource } from '@/lib/community/rank'

type CommunityRankListProps = {
  entries: CommunityRankEntry[]
  showSlug: string
  source: CommunityRankSource
}

type RowVoteData = {
  approval: number
  trend: 'up' | 'down' | 'hold'
  votes: number
}

function padRank(rank: number): string {
  return String(rank).padStart(2, '0')
}

function rowVoteData(_entry: CommunityRankEntry, source: CommunityRankSource): RowVoteData | null {
  if (source !== 'votes') return null
  return null
}

export function CommunityRankList({
  entries,
  showSlug,
  source,
}: CommunityRankListProps) {
  const empty = source !== 'votes'
  return (
    <div className="cp-community-list" data-testid="community-rank-list" data-source={source}>
      <div className="cp-community-list-head">
        <h2>The full ranking.</h2>
        <span className="meta">
          {empty
            ? 'No community votes yet — list mirrors the editor canon.'
            : 'Recomputed as votes land · approval %'}
        </span>
      </div>
      <div className="cp-cl-cols" data-testid="community-rank-cols">
        <span>Rank</span>
        <span>Season</span>
        <span className="col-bar">Approval</span>
        <span className="col-pct col-r">%</span>
        <span className="col-trend col-r">7d</span>
        <span className="col-r">Votes</span>
      </div>
      <div className="cp-cl-rows" data-testid="community-rank-rows">
        {entries.map((entry) => {
          const vote = rowVoteData(entry, source)
          const subtitle = entry.tag
          return (
            <a
              key={entry.season.number}
              className="cp-cl-row"
              href={`/shows/${showSlug}/season/${entry.season.slug}`}
              data-testid="community-rank-row"
              data-rank={entry.rank}
            >
              <div className="cp-clr-rank">{padRank(entry.rank)}</div>
              <div className="cp-clr-title">
                {entry.season.title}
                <span className="sub">{subtitle}</span>
              </div>
              <div className="cp-clr-bar" data-empty={vote ? 'false' : 'true'}>
                <div className="cp-clr-bar-track">
                  {vote ? (
                    <div
                      className="cp-clr-bar-fill"
                      style={{ width: `${vote.approval}%` }}
                    />
                  ) : null}
                </div>
              </div>
              {vote ? (
                <div className="cp-clr-pct">{vote.approval}%</div>
              ) : (
                <div className="cp-clr-pct cp-cl-cell--empty" aria-hidden="true">
                  —
                </div>
              )}
              {vote ? (
                <div className={`cp-clr-trend ${vote.trend}`}>
                  {vote.trend === 'hold' ? '◆' : vote.trend === 'up' ? '↑' : '↓'}
                </div>
              ) : (
                <div className="cp-clr-trend cp-cl-cell--empty" aria-hidden="true">
                  —
                </div>
              )}
              {vote ? (
                <div className="cp-clr-votes">{vote.votes.toLocaleString()}</div>
              ) : (
                <div className="cp-clr-votes cp-cl-cell--empty" aria-hidden="true">
                  —
                </div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
