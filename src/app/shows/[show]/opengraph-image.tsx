import { notFound } from 'next/navigation'
import { getShow } from '@/content'
import { buildOgImage } from '@/lib/og/template'

export const runtime = 'nodejs'
export const alt = 'Pantheon — the seasons, ranked. no spoilers.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Params = { show: string }

export default async function OpenGraphImage({ params }: { params: Promise<Params> }) {
  const { show: slug } = await params
  const show = getShow(slug)
  if (!show) notFound()
  return buildOgImage({
    eyebrow: 'Pantheon · Show',
    title: show.name,
    blurb: show.blurb,
    palette: {
      paper: show.palette.paper,
      ink: show.palette.ink,
      primary: show.palette.primary,
    },
  })
}
