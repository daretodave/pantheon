import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSeasons, getAllShows, getCanon, getShow } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import { Bullet } from '@/components/atoms/Bullet'
import {
  ShiftCard,
  ShiftsRow,
  ShieldBadge,
  ShowHero,
  type ShowHeroStat,
} from '@/components/composition'
import { ShowRanking } from '@/components/canon'
import {
  buildJsonLd,
  buildMetadata,
  canonicalUrl,
  jsonLdScriptProps,
} from '@/lib/seo'
import { getCommunityRanking } from '@/lib/community/ranking'
import { pickMovers } from '@/lib/community/live'
import { FeaturedThemes } from '@/components/featured-themes/FeaturedThemes'
import type { Season } from '@/content'

// Phase 35 stage 3: the consolidated show page reads the live,
// Supabase-derived community ranking (getCommunityRanking) at render.
// A statically prerendered page would bake the canon-mirror fallback
// at build time and never reflect votes on refresh — that staleness
// IS the user-reported "refresh always shows 0" bug (the same
// reasoning the stage-1 commit used to keep /api/ranking dynamic
// rather than ISR). Render per request; the aggregate is a cheap
// indexed SUM and the canon-mirror still serves on any DB failure
// (always-working rule).
export const dynamic = 'force-dynamic'

type Params = { show: string }
type Search = { view?: string }

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
    title: `${show.name} — the canon + the community vote, no spoilers`,
    description: `${show.name}, every season ranked: the Editor's Canon and the live community vote on one page. ${show.tagline}`,
    path: `/shows/${show.slug}`,
    feeds: [
      {
        url: canonicalUrl(`/feed/${show.slug}.xml`),
        title: `${show.name} — tiered.tv`,
      },
    ],
  })
}

function canonRevisedYear(iso: string | undefined): number | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.getUTCFullYear()
}

export default async function ShowHomePage({
  params,
  searchParams,
}: {
  params: Params
  searchParams?: Promise<Search>
}) {
  const show = getShow(params.show)
  if (!show) notFound()
  const seasons = getAllSeasons(show.slug)
  const canon = getCanon(show.slug)

  const sp = (await searchParams) ?? {}
  const initialView: 'canon' | 'community' =
    sp.view === 'community' ? 'community' : 'canon'

  const seasonByNumber = new Map<number, Season>()
  for (const s of seasons) seasonByNumber.set(s.number, s)
  const seasonPath = (n: number): string => {
    const s = seasonByNumber.get(n)
    return s ? `/shows/${show.slug}/season/${s.slug}` : `/shows/${show.slug}`
  }

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

  const canonEntries = canon?.entries ?? []
  const canonItemListLd = buildJsonLd({
    type: 'ItemList',
    name: `${show.name} — Editor's Canon`,
    description: `Spoiler-safe editorial ranking for ${show.name}.`,
    path: `/shows/${show.slug}`,
    items:
      canonEntries.length > 0
        ? canonEntries.map((entry) => ({
            position: entry.rank,
            name: entry.title,
            path: seasonPath(entry.season),
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

  const community = await getCommunityRanking(show, seasons, canon)
  const shiftMovers = pickMovers(community.entries)
  const communityItemListLd = buildJsonLd({
    type: 'ItemList',
    name: `${show.name} — Community Rank`,
    description: `Reader-voted ranking for ${show.name}.`,
    path: `/shows/${show.slug}?view=community`,
    items:
      community.entries.length > 0
        ? community.entries.map((entry) => ({
            position: entry.rank,
            name: entry.season.title,
            path: `/shows/${show.slug}/season/${entry.season.slug}`,
          }))
        : [
            {
              position: 1,
              name: `${show.name} — community vote opening`,
              path: `/shows/${show.slug}?view=community`,
            },
          ],
  })

  const stats: ShowHeroStat[] = [{ value: show.seasons, key: 'seasons aired' }]
  const revisedYear = canonRevisedYear(canon?.last_revised)
  if (revisedYear != null) {
    stats.push({ value: revisedYear, key: 'Canon last revised' })
  }

  return (
    <ShowPaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-show-home', data: collectionLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-show-breadcrumb', data: crumbsLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-show-canon', data: canonItemListLd })} />
      <script
        {...jsonLdScriptProps({ id: 'ld-show-community', data: communityItemListLd })}
      />
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
        <ShiftsRow
          cards={
            shiftMovers.length > 0
              ? shiftMovers.map((m) => (
                  <ShiftCard key={m.season.number} mover={m} />
                ))
              : undefined
          }
        />
        <ShowRanking
          show={show}
          seasons={seasons}
          canon={canon}
          initialView={initialView}
          community={community}
        />
        <FeaturedThemes show={show.slug} showName={show.name} />
      </div>
    </ShowPaletteScope>
  )
}
