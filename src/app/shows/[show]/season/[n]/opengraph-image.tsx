import { notFound } from 'next/navigation'
import { getCanon, getSeason, getShow } from '@/content'
import { buildOgImage } from '@/lib/og/template'

export const runtime = 'nodejs'
export const alt = 'Pantheon — the seasons, ranked. no spoilers.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Params = { show: string; n: string }

function padRank(n: number | null | undefined): string {
  if (n == null) return ''
  return `#${String(n).padStart(2, '0')}`
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<Params>
}) {
  const { show: slug, n } = await params
  const num = Number.parseInt(n, 10)
  const show = getShow(slug)
  if (!show || !Number.isFinite(num)) notFound()
  const season = getSeason(slug, num)
  if (!season) notFound()

  const canonFile = getCanon(slug)
  const canonHit = canonFile?.entries.find((e) => e.season === season.number)
  const canonRank = canonHit?.rank ?? season.canonical_position ?? null
  const eyebrow = canonRank
    ? `Pantheons / ${show.name} · Editor's Canon ${padRank(canonRank)}`
    : `Pantheons / ${show.name} · Season ${season.number}`

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
