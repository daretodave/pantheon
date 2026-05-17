import { buildGlobalFeedItems } from '@/lib/feed/items'
import { renderRss } from '@/lib/feed/rss'
import { canonicalUrl, siteConfig } from '@/lib/seo'

// Pure projection of content/ — no per-request input. Bake at
// build, refresh on the standard ISR window (matches sitemap.ts).
export const dynamic = 'force-static'
export const revalidate = 3600

export function GET(): Response {
  const xml = renderRss(
    {
      title: `${siteConfig.name} — the seasons, ranked. no spoilers.`,
      link: canonicalUrl('/'),
      feedUrl: canonicalUrl('/feed.xml'),
      description:
        'New season pages, Editor’s Canon revisions, and themed lists from tiered.tv.',
    },
    buildGlobalFeedItems(),
  )
  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  })
}
