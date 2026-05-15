import type { CommunityRankSource } from '@/lib/community/rank'

type CommunityLiveStripProps = {
  source: CommunityRankSource
}

export function CommunityLiveStrip({ source }: CommunityLiveStripProps) {
  return (
    <div className="cp-live-strip" data-testid="community-live-strip" data-source={source}>
      <div className="cp-live-left">
        <span>
          <span className="cp-live-dot" />
          live
        </span>
        <span>
          last recompute · <b>votes pending</b>
        </span>
        <span>
          next recompute · <b>when votes land</b>
        </span>
        <span>
          status ·{' '}
          <b>
            {source === 'canon'
              ? 'mirroring the canon'
              : source === 'seasons'
                ? 'air order'
                : 'live votes'}
          </b>
        </span>
      </div>
      <div className="cp-live-right">
        <b>open</b> to anyone
      </div>
    </div>
  )
}
