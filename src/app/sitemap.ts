import type { MetadataRoute } from 'next'
import { getFeedPaths, getSitemapRoutes } from '@/lib/routes'
import { canonicalUrl } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages: MetadataRoute.Sitemap = getSitemapRoutes().map((route) => ({
    url: canonicalUrl(route.path),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route.pattern === '/' ? 1.0 : 0.7,
  }))
  // Phase 32: RSS feeds are crawlable surfaces too.
  const feeds: MetadataRoute.Sitemap = getFeedPaths().map((path) => ({
    url: canonicalUrl(path),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.4,
  }))
  return [...pages, ...feeds]
}
