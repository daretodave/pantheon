import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSeasons, getAllShows, getCanon, getShow } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import { CanonPageShell } from '@/components/canon'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'
import { computeCommunityRank } from '@/lib/community/rank'

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
            path: `/shows/${show.slug}/season/${entry.season.slug}`,
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
      { name: 'Tiers', path: '/shows' },
      { name: show.name, path: `/shows/${show.slug}` },
      { name: 'Community Rank', path: `/shows/${show.slug}/community` },
    ],
  })

  return (
    <ShowPaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-community', data: itemListLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-community-breadcrumb', data: crumbsLd })} />
      <div
        className="screen community-page-screen"
        data-testid="community-page-screen"
      >
        <CanonPageShell
          show={show}
          seasons={seasons}
          canon={canon}
          initialView="community"
        />
      </div>
    </ShowPaletteScope>
  )
}
