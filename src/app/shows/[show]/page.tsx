import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSeasons, getAllShows, getCanon, getShow } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import { Bullet } from '@/components/atoms/Bullet'
import {
  FilterBar,
  SeasonCard,
  SeasonGrid,
  ShiftsRow,
  ShieldBadge,
  ShowHero,
  ShowSplit,
  type SeasonCardShift,
  type ShowHeroStat,
} from '@/components/composition'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'
import { computeYearsOnAir } from '@/lib/show-format'
import { computeCommunityRank } from '@/lib/community/rank'
import { FeaturedThemes } from '@/components/featured-themes/FeaturedThemes'
import type { Season } from '@/content'

type Params = { show: string }

export function generateStaticParams(): Params[] {
  return getAllShows().map((show) => ({ show: show.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const show = getShow(params.show)
  if (!show) {
    return buildMetadata({
      title: 'Show not found',
      description: '',
      path: `/shows/${params.show}`,
      noIndex: true,
    })
  }
  return buildMetadata({
    title: `${show.name} — ranked seasons, no spoilers`,
    description: show.tagline,
    path: `/shows/${show.slug}`,
  })
}

function seasonTag(season: Season): string {
  if (season.tag) return season.tag
  if (season.premiere_date) {
    return new Date(season.premiere_date).getUTCFullYear().toString()
  }
  return `Season ${season.number}`
}

function sortByCanon(seasons: Season[]): Season[] {
  return [...seasons].sort((a, b) => {
    const ra = a.canonical_position ?? Number.MAX_SAFE_INTEGER
    const rb = b.canonical_position ?? Number.MAX_SAFE_INTEGER
    if (ra !== rb) return ra - rb
    return a.number - b.number
  })
}

export default function ShowHomePage({ params }: { params: Params }) {
  const show = getShow(params.show)
  if (!show) notFound()
  const seasons = getAllSeasons(show.slug)
  const canon = getCanon(show.slug)

  const collectionLd = buildJsonLd({
    type: 'CollectionPage',
    name: `${show.name} — tiered`,
    description: show.tagline,
    path: `/shows/${show.slug}`,
  })
  const crumbsLd = buildJsonLd({
    type: 'BreadcrumbList',
    trail: [
      { name: 'Tiers', path: '/shows' },
      { name: show.name, path: `/shows/${show.slug}` },
    ],
  })

  const years = computeYearsOnAir(seasons, show.status)
  const stats: ShowHeroStat[] = [
    { value: show.seasons, key: 'seasons aired' },
    { value: years, key: 'on the air' },
  ]

  const canonOrdered = sortByCanon(seasons)
  const community = computeCommunityRank(show, seasons, canon)

  const canonRankBySeason = new Map<number, number>()
  for (const s of canonOrdered) {
    canonRankBySeason.set(s.number, s.canonical_position ?? s.number)
  }

  function shiftFor(communityRank: number, seasonNumber: number): SeasonCardShift | null {
    const canonRank = canonRankBySeason.get(seasonNumber)
    if (canonRank == null) return null
    const delta = canonRank - communityRank
    if (delta === 0) return null
    return {
      delta,
      sentiment: delta > 0 ? 'warm-up' : 'warm-down',
    }
  }

  return (
    <ShowPaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-show-home', data: collectionLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-show-breadcrumb', data: crumbsLd })} />
      <div className="screen show-home" data-testid="show-home-screen">
        <ShowHero
          title={show.name}
          blurb={show.blurb}
          crumb={
            <>
              <Bullet color="var(--show-primary)" size={10} />
              <span>
                <a href="/shows">Tiers</a> / {show.name}
              </span>
            </>
          }
          stats={stats}
          tagline={show.tagline}
          shield={<ShieldBadge />}
        />
        <ShowSplit
          canon={{
            href: `/shows/${show.slug}/canon`,
            tag: '01 · CURATED',
            title: "Editor's Canon",
            blurb: `One ranking, written by someone who has watched every ${show.name} season twice.`,
            go: 'Read the canon →',
          }}
          community={{
            href: `/shows/${show.slug}/community`,
            tag: '02 · LIVE',
            title: 'Community Rank',
            blurb: 'Voted by readers. Updated as the votes come in.',
            go: 'See the vote →',
          }}
        />
        <ShiftsRow />
        <section
          className="show-seasons"
          aria-labelledby="seasons-heading"
          data-season-ordering-host
          data-active-filter="canon"
          data-testid="show-seasons"
        >
          <div className="section-head">
            <h2 id="seasons-heading">All seasons, ranked</h2>
            <span className="sec-meta">
              Sorted by Editor&rsquo;s Canon · spoilers shielded
            </span>
          </div>
          <FilterBar />
          {seasons.length === 0 ? (
            <p
              data-testid="season-grid"
              data-empty="true"
              style={{ margin: '0 32px 56px', color: 'var(--show-ink)', opacity: 0.7 }}
            >
              Seasons haven&rsquo;t been added yet — this page populates as the loop ships
              them.
            </p>
          ) : (
            <>
              <div data-season-ordering="canon" data-testid="season-ordering-canon">
                <SeasonGrid>
                  {canonOrdered.map((season) => (
                    <SeasonCard
                      key={season.number}
                      rank={season.canonical_position ?? season.number}
                      title={season.title}
                      tag={seasonTag(season)}
                      seasonNumber={season.number}
                      href={`/shows/${show.slug}/season/${season.slug}`}
                    />
                  ))}
                </SeasonGrid>
              </div>
              <div data-season-ordering="community" data-testid="season-ordering-community">
                <SeasonGrid data-testid="season-grid-community">
                  {community.entries.map((entry) => (
                    <SeasonCard
                      key={entry.season.number}
                      rank={entry.rank}
                      title={entry.season.title}
                      tag={entry.tag}
                      seasonNumber={entry.season.number}
                      href={`/shows/${show.slug}/season/${entry.season.slug}`}
                      shift={shiftFor(entry.rank, entry.season.number)}
                    />
                  ))}
                </SeasonGrid>
              </div>
            </>
          )}
        </section>
        <FeaturedThemes show={show.slug} showName={show.name} />
      </div>
    </ShowPaletteScope>
  )
}
