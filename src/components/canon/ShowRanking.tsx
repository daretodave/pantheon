import type { CanonEntry, CanonFile, Season, Show } from '@/content'
import { computeCommunityRank } from '@/lib/community/rank'
import { buildTierBands } from '@/lib/canon/tier-bands'
import { makeEraOf } from '@/lib/canon/era-bands'
import { CanonTabSwitch } from './CanonTabSwitch'
import { CanonEraToolbar } from './CanonEraToolbar'
import { CanonMethodology } from './CanonMethodology'
import { CanonTierBand } from './CanonTierBand'
import { CommunityLiveStrip } from './CommunityLiveStrip'
import { CommunityMovers } from './CommunityMovers'
import { CommunityWeeklyQuestionCard } from './CommunityWeeklyQuestionCard'
import { CommunityRankList } from './CommunityRankList'

type View = 'canon' | 'community'

type ShowRankingProps = {
  show: Show
  seasons: Season[]
  canon: CanonFile | null
  initialView: View
}

function seasonHrefFor(
  showSlug: string,
  seasonByNumber: Map<number, Season>,
  entry: CanonEntry,
): string {
  const season = seasonByNumber.get(entry.season)
  if (season) return `/shows/${showSlug}/season/${season.slug}`
  return `/shows/${showSlug}`
}

// Phase 33: the canon/community internals (shipped phase 31c as
// CanonPageShell, route-coupled to /canon + /community) are lifted
// onto the consolidated show page. CanonHead/CanonStats are gone —
// the show hero owns the title/stats now. The `.ranking-intro` block
// (dual canon/community copy, CSS-toggled by the root `data-view`)
// replaces them. Both panes are SSR'd; visibility is a CSS toggle, so
// both rankings are always in the static HTML (SEO-safe). The
// `.canon-page` class stays on the root because all the ported
// `[data-view]` / `[data-view-pane]` CSS keys off it (the body
// element is owned by the App Router root layout — the phase-31c
// adaptation note in canon.css).
export function ShowRanking({ show, seasons, canon, initialView }: ShowRankingProps) {
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
  const hasLiveVotes = community.source === 'votes'

  const seasonHref = (entry: CanonEntry) =>
    seasonHrefFor(show.slug, seasonByNumber, entry)
  const seasonOf = (entry: CanonEntry) => seasonByNumber.get(entry.season)
  const eraBands = canon?.era_bands ?? []
  const eraOf = makeEraOf(seasonOf, eraBands)

  return (
    <section
      className="ranking canon-page"
      data-canon-page-root
      data-view={initialView}
      data-testid="show-ranking"
      aria-label="The ranking"
    >
      <div className="ranking-intro" data-testid="ranking-intro">
        <h2>
          <span className="cp-canon-only">The canon, top to bottom.</span>
          <span className="cp-community-only">What readers are voting on.</span>
        </h2>
        <p className="meta">
          <span className="cp-canon-only">
            One ranking, written by editors who have rewatched every season at
            least twice. We argue with the community out loud — but we ship one
            number.
          </span>
          <span className="cp-community-only">
            {hasLiveVotes
              ? 'Recomputed every Thursday at 9pm ET. Approval is the share of voters who would keep a season in its slot or move it up.'
              : 'Recomputed every Thursday at 9pm ET. Until enough votes land, this mirrors the canon — be the first to move it.'}
          </span>
        </p>
      </div>

      <CanonTabSwitch initialView={initialView} />

      <div data-view-pane="canon" data-testid="canon-view-pane">
        {entries.length === 0 ? (
          <div
            className="cp-canon-empty"
            data-testid="canon-empty"
            data-empty="true"
          >
            The canon hasn&rsquo;t been ranked yet — this page populates as the
            loop ships it.
          </div>
        ) : (
          <>
            <CanonMethodology canon={canon} />
            <CanonEraToolbar bands={eraBands} total={entries.length} />
            {tierBands.map((band) => (
              <CanonTierBand
                key={band.key}
                band={band}
                seasonHref={seasonHref}
                seasonOf={seasonOf}
                eraOf={eraOf}
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
            Seasons haven&rsquo;t been added yet — this page populates as the
            loop ships them.
          </div>
        )}
      </div>
    </section>
  )
}
