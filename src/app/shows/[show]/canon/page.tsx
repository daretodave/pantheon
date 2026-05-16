import { permanentRedirect } from 'next/navigation'
import { getAllShows } from '@/content'

// Phase 33: the standalone Editor's Canon page is consolidated into
// the show page. `/shows/[show]/canon` 308s to `/shows/[show]` (canon
// is the default ranking view there). Mirrors the phase-31a season
// digit→slug redirect pattern — a page-level permanentRedirect emits
// a 308, so external links and stale bookmarks never 404.

type Params = { show: string }

export function generateStaticParams(): Params[] {
  return getAllShows().map((show) => ({ show: show.slug }))
}

export default function CanonRedirect({ params }: { params: Params }) {
  permanentRedirect(`/shows/${params.show}`)
}
