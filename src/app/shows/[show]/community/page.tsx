import { permanentRedirect } from 'next/navigation'
import { getAllShows } from '@/content'

// Phase 33: the standalone Community Rank page is consolidated into
// the show page. `/shows/[show]/community` 308s to
// `/shows/[show]?view=community` so the consolidated page opens on
// the community pane. Mirrors the phase-31a season digit→slug
// redirect pattern — a page-level permanentRedirect emits a 308, so
// external links and stale bookmarks never 404.

type Params = { show: string }

export function generateStaticParams(): Params[] {
  return getAllShows().map((show) => ({ show: show.slug }))
}

export default function CommunityRedirect({ params }: { params: Params }) {
  permanentRedirect(`/shows/${params.show}?view=community`)
}
