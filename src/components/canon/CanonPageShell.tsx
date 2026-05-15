import type { CanonEntry, CanonFile, Season, Show } from '@/content'
import { computeCommunityRank } from '@/lib/community/rank'
import { buildTierBands } from '@/lib/canon/tier-bands'
import { CanonHead } from './CanonHead'
import { CanonStats } from './CanonStats'
import { CanonTabSwitch } from './CanonTabSwitch'
import { CanonMethodology } from './CanonMethodology'
import { CanonTierBand } from './CanonTierBand'
import { CommunityLiveStrip } from './CommunityLiveStrip'
import { CommunityMovers } from './CommunityMovers'
import { CommunityWeeklyQuestionCard } from './CommunityWeeklyQuestionCard'
import { CommunityRankList } from './CommunityRankList'

type View = 'canon' | 'community'

type CanonPageShellProps = {
  show: Show
  seasons: Season[]
  canon: CanonFile | null
  initialView: View
}

function seasonHrefFor(showSlug: string, seasonByNumber: Map<number, Season>, entry: CanonEntry): string {
  const season = seasonByNumber.get(entry.season)
  if (season) return `/shows/${showSlug}/season/${season.slug}`
  return `/shows/${showSlug}`
}

export function CanonPageShell({ show, seasons, canon, initialView }: CanonPageShellProps) {
  const entries = canon?.entries ?? []
  const seasonByNumber = new Map<number, Season>()
  for (const s of seasons) seasonByNumber.set(s.number, s)

  const tierBands = buildTierBands(entries, {
    s: canon?.tier_s_blurb ?? null,
    a: canon?.tier_a_blurb ?? null,
    b: canon?.tier_b_blurb ?? null,
    c: canon?.tier_c_blurb ?? null,
  })

  const community = computeCommunityRank(show, seasons, canon)

  const seasonHref = (entry: CanonEntry) => seasonHrefFor(show.slug, seasonByNumber, entry)
  const seasonOf = (entry: CanonEntry) => seasonByNumber.get(entry.season)

  return (
    <div
      className="canon-page"
      data-canon-page-root
      data-view={initialView}
      data-testid="canon-page-root"
    >
      <CanonHead
        show={show}
        stats={<CanonStats entryCount={entries.length} canon={canon} />}
      />
      <CanonTabSwitch
        initialView={initialView}
        canonHref={`/shows/${show.slug}/canon`}
        communityHref={`/shows/${show.slug}/community`}
      />

      <div data-view-pane="canon" data-testid="canon-view-pane">
        {entries.length === 0 ? (
          <div
            className="cp-canon-empty"
            data-testid="canon-empty"
            data-empty="true"
          >
            The canon hasn&rsquo;t been ranked yet — this page populates as the loop ships
            it.
          </div>
        ) : (
          <>
            <CanonMethodology canon={canon} />
            {tierBands.map((band) => (
              <CanonTierBand
                key={band.key}
                band={band}
                seasonHref={seasonHref}
                seasonOf={seasonOf}
              />
            ))}
          </>
        )}
      </div>

      <div data-view-pane="community" data-testid="community-view-pane">
        <CommunityLiveStrip source={community.source} />
        <CommunityMovers />
        <div className="cp-community-list" data-testid="community-weekly-wrapper">
          <CommunityWeeklyQuestionCard question={canon?.weekly_question ?? null} />
        </div>
        {community.entries.length > 0 ? (
          <CommunityRankList
            entries={community.entries}
            showSlug={show.slug}
            source={community.source}
          />
        ) : (
          <div
            className="cp-canon-empty"
            data-testid="community-empty"
            data-empty="true"
          >
            Seasons haven&rsquo;t been added yet — this page populates as the loop ships
            them.
          </div>
        )}
      </div>
    </div>
  )
}
