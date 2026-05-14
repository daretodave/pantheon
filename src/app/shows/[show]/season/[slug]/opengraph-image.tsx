import { notFound } from 'next/navigation'
import { getCanon, getSeasonBySlug, getShow } from '@/content'
import { buildOgImage } from '@/lib/og/template'

export const runtime = 'nodejs'
export const alt = 'tiered.tv — the seasons, ranked. no spoilers.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Params = { show: string; slug: string }

function padRank(n: number | null | undefined): string {
  if (n == null) return ''
  return `#${String(n).padStart(2, '0')}`
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<Params>
}) {
  const { show: showSlug, slug: seasonSlug } = await params
  const show = getShow(showSlug)
  if (!show) notFound()
  const season = getSeasonBySlug(showSlug, seasonSlug)
  if (!season) notFound()

  const canonFile = getCanon(showSlug)
  const canonHit = canonFile?.entries.find((e) => e.season === season.number)
  const canonRank = canonHit?.rank ?? season.canonical_position ?? null
  const eyebrow = canonRank
    ? `Tiers / ${show.name} · Editor's Canon ${padRank(canonRank)}`
    : `Tiers / ${show.name} · Season ${season.number}`

  return buildOgImage({
    eyebrow,
    title: season.title,
    blurb:
      season.lede ?? season.tag ?? `${show.name}, season ${season.number}.`,
    palette: {
      paper: show.palette.paper,
      ink: show.palette.ink,
      primary: show.palette.primary,
    },
  })
}
