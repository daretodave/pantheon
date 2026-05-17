import { getAllShows, getShow } from '@/content'
import { buildShowFeedItems } from '@/lib/feed/items'
import { renderRss } from '@/lib/feed/rss'
import { canonicalUrl } from '@/lib/seo'

// `slug` arrives as `<show>.xml` — a single dynamic segment is the
// only App Router shape that can serve a `.xml`-suffixed dynamic
// path (a folder cannot mix `[show]` and a literal `.xml`).
export const dynamic = 'force-static'
export const revalidate = 3600

export function generateStaticParams(): { slug: string }[] {
  return getAllShows().map((s) => ({ slug: `${s.slug}.xml` }))
}

const notFound = () =>
  new Response('feed not found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })

export function GET(
  _req: Request,
  { params }: { params: { slug: string } },
): Response {
  const { slug } = params
  if (!slug.endsWith('.xml')) return notFound()
  const showSlug = slug.slice(0, -'.xml'.length)
  const show = getShow(showSlug)
  const items = show ? buildShowFeedItems(showSlug) : null
  if (!show || !items) return notFound()

  const xml = renderRss(
    {
      title: `${show.name} — every season ranked, no spoilers`,
      link: canonicalUrl(`/shows/${show.slug}`),
      feedUrl: canonicalUrl(`/feed/${show.slug}.xml`),
      description: `${show.name} season pages and Editor’s Canon revisions from tiered.tv.`,
    },
    items,
  )
  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  })
}
