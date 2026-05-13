import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSeasons, getAllShows, getCanon, getShow } from '@/content'
import { PaletteScope } from '@/components/facade'
import {
  SeasonCard,
  SeasonGrid,
  ShieldBadge,
  ShowHero,
} from '@/components/composition'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'
import { computeCommunityRank, sourceBannerCopy } from '@/lib/community/rank'
import { ShowSigilArt } from '../ShowSigilArt'

type Params = { show: string }

export function generateStaticParams(): Params[] {
  return getAllShows().map((show) => ({ show: show.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const show = getShow(params.show)
  if (!show) {
    return buildMetadata({
      title: 'Community Rank',
      description: '',
      path: `/shows/${params.show}/community`,
      noIndex: true,
    })
  }
  return buildMetadata({
    title: `${show.name} — Community Rank`,
    description: `Vote-driven ranking for ${show.name}. Spoiler-free.`,
    path: `/shows/${show.slug}/community`,
  })
}

export default function CommunityPage({ params }: { params: Params }) {
  const show = getShow(params.show)
  if (!show) notFound()
  const seasons = getAllSeasons(show.slug)
  const canon = getCanon(show.slug)
  const result = computeCommunityRank(show, seasons, canon)

  const itemListLd = buildJsonLd({
    type: 'ItemList',
    name: `${show.name} — Community Rank`,
    description: `Community-voted ranking for ${show.name}.`,
    path: `/shows/${show.slug}/community`,
    items:
      result.entries.length > 0
        ? result.entries.map((entry) => ({
            position: entry.rank,
            name: entry.season.title,
            path: `/shows/${show.slug}/season/${entry.season.number}`,
          }))
        : [
            {
              position: 1,
              name: `${show.name} — community pending`,
              path: `/shows/${show.slug}`,
            },
          ],
  })
  const crumbsLd = buildJsonLd({
    type: 'BreadcrumbList',
    trail: [
      { name: 'Pantheons', path: '/shows' },
      { name: show.name, path: `/shows/${show.slug}` },
      { name: 'Community Rank', path: `/shows/${show.slug}/community` },
    ],
  })

  const banner = sourceBannerCopy(result.source)

  return (
    <PaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-community', data: itemListLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-community-breadcrumb', data: crumbsLd })} />
      <div className="screen community-page" data-testid="community-page-screen">
        <ShowHero
          crumb={
            <>
              <a href="/shows">Pantheons</a> / <a href={`/shows/${show.slug}`}>{show.name}</a> /{' '}
              Community Rank
            </>
          }
          title="Community Rank"
          lede={`Voted by people who've watched it. ${show.name}'s ranking shifts as the community weighs in — be the first to push it.`}
          art={<ShowSigilArt slug={show.slug} name={show.name} />}
          shield={<ShieldBadge />}
        />

        <p
          className="community-source"
          data-testid="community-source-banner"
          data-rank-source={result.source}
        >
          {banner}
        </p>

        {result.entries.length > 0 ? (
          <section className="show-seasons" aria-labelledby="community-heading">
            <div className="section-head">
              <h2 id="community-heading">Ranked by the community</h2>
            </div>
            <SeasonGrid data-rank-source={result.source}>
              {result.entries.map((entry) => (
                <SeasonCard
                  key={entry.season.number}
                  rank={entry.rank}
                  title={entry.season.title}
                  tag={entry.tag}
                  seasonNumber={entry.season.number}
                  href={`/shows/${show.slug}/season/${entry.season.number}`}
                />
              ))}
            </SeasonGrid>
          </section>
        ) : (
          <p
            data-testid="season-grid"
            data-empty="true"
            style={{
              margin: '24px 32px 80px',
              color: 'var(--show-ink)',
              opacity: 0.7,
            }}
          >
            Seasons haven&rsquo;t been added yet — this page populates as the loop ships them.
          </p>
        )}
      </div>
    </PaletteScope>
  )
}
