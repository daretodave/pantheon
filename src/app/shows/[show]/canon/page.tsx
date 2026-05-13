import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllShows, getCanon, getShow } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import {
  CanonEntry,
  CanonList,
  ShieldBadge,
  ShowHero,
} from '@/components/composition'
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
  const canon = getCanon(show.slug)
  const entries = canon?.entries ?? []

  const itemListLd = buildJsonLd({
    type: 'ItemList',
    name: `${show.name} — Editor's Canon`,
    description: `Spoiler-safe editorial ranking for ${show.name}.`,
    path: `/shows/${show.slug}/canon`,
    items:
      entries.length > 0
        ? entries.map((entry) => ({
            position: entry.rank,
            name: entry.title,
            path: `/shows/${show.slug}/season/${entry.season}`,
            description: entry.rationale.slice(0, 200),
          }))
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
      { name: 'Pantheons', path: '/shows' },
      { name: show.name, path: `/shows/${show.slug}` },
      { name: "Editor's Canon", path: `/shows/${show.slug}/canon` },
    ],
  })

  return (
    <ShowPaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-canon', data: itemListLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-canon-breadcrumb', data: crumbsLd })} />
      <div className="screen canon-page" data-testid="canon-page-screen">
        <ShowHero
          crumb={
            <>
              <a href="/shows">Pantheons</a> / <a href={`/shows/${show.slug}`}>{show.name}</a> /{' '}
              Editor&rsquo;s Canon
            </>
          }
          title="Editor's Canon"
          blurb={`${show.name}, ranked with confidence.`}
          tagline="Every placement is spoiler-safe, every rationale is on the record."
          shield={<ShieldBadge />}
        />

        {entries.length > 0 ? (
          <CanonList>
            {[...entries]
              .sort((a, b) => a.rank - b.rank)
              .map((entry) => (
                <CanonEntry
                  key={entry.rank}
                  rank={entry.rank}
                  title={entry.title}
                  seasonNumber={entry.season}
                  rationale={entry.rationale}
                  href={`/shows/${show.slug}/season/${entry.season}`}
                />
              ))}
          </CanonList>
        ) : (
          <p
            className="canon-empty"
            data-testid="canon-list"
            data-empty="true"
          >
            The canon hasn&rsquo;t been ranked yet — this page populates as the loop ships it.
          </p>
        )}
      </div>
    </ShowPaletteScope>
  )
}
