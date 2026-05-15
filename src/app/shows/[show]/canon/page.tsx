import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSeasons, getAllShows, getCanon, getShow } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import { CanonPageShell } from '@/components/canon'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

type Params = { show: string }

export function generateStaticParams(): Params[] {
  return getAllShows().map((show) => ({ show: show.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const show = getShow(params.show)
  if (!show) {
    return buildMetadata({
      title: 'Canon',
      description: '',
      path: `/shows/${params.show}/canon`,
      noIndex: true,
    })
  }
  return buildMetadata({
    title: `${show.name} — Editor's Canon`,
    description: `Editor's Canon for ${show.name}, ranked with spoiler-safe rationales for each placement.`,
    path: `/shows/${show.slug}/canon`,
  })
}

export default function CanonPage({ params }: { params: Params }) {
  const show = getShow(params.show)
  if (!show) notFound()
  const seasons = getAllSeasons(show.slug)
  const canon = getCanon(show.slug)
  const entries = canon?.entries ?? []

  const seasonByNumber = new Map<number, ReturnType<typeof getAllSeasons>[number]>()
  for (const s of seasons) seasonByNumber.set(s.number, s)

  const itemListLd = buildJsonLd({
    type: 'ItemList',
    name: `${show.name} — Editor's Canon`,
    description: `Spoiler-safe editorial ranking for ${show.name}.`,
    path: `/shows/${show.slug}/canon`,
    items:
      entries.length > 0
        ? entries.map((entry) => {
            const season = seasonByNumber.get(entry.season)
            const path = season
              ? `/shows/${show.slug}/season/${season.slug}`
              : `/shows/${show.slug}`
            return {
              position: entry.rank,
              name: entry.title,
              path,
              description: entry.rationale.slice(0, 200),
            }
          })
        : [
            {
              position: 1,
              name: `${show.name} — canon pending`,
              path: `/shows/${show.slug}`,
            },
          ],
  })
  const crumbsLd = buildJsonLd({
    type: 'BreadcrumbList',
    trail: [
      { name: 'Tiers', path: '/shows' },
      { name: show.name, path: `/shows/${show.slug}` },
      { name: "Editor's Canon", path: `/shows/${show.slug}/canon` },
    ],
  })

  return (
    <ShowPaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-canon', data: itemListLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-canon-breadcrumb', data: crumbsLd })} />
      <div
        className="screen canon-page-screen"
        data-testid="canon-page-screen"
      >
        <CanonPageShell
          show={show}
          seasons={seasons}
          canon={canon}
          initialView="canon"
        />
      </div>
    </ShowPaletteScope>
  )
}
