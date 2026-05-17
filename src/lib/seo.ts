import type { Metadata } from 'next'

export const siteConfig = {
  name: 'tiered.tv',
  promise: 'the seasons, ranked. no spoilers.',
  baseUrl: 'https://tiered.tv',
  defaultOgImage: '/opengraph-image',
  locale: 'en',
  twitterHandle: undefined as string | undefined,
} as const

export function canonicalUrl(path: string): string {
  const base = siteConfig.baseUrl.replace(/\/+$/, '')
  if (!path || path === '/') return `${base}/`

  let p = path
  const hashIx = p.indexOf('#')
  const hash = hashIx >= 0 ? p.slice(hashIx) : ''
  if (hashIx >= 0) p = p.slice(0, hashIx)

  const queryIx = p.indexOf('?')
  const query = queryIx >= 0 ? p.slice(queryIx) : ''
  if (queryIx >= 0) p = p.slice(0, queryIx)

  if (!p.startsWith('/')) p = `/${p}`
  if (p.length > 1) p = p.replace(/\/+$/, '')

  return `${base}${p}${query}${hash}`
}

type BuildMetadataArgs = {
  title: string
  description: string
  path: string
  image?: string
  noIndex?: boolean
  // Phase 32: RSS auto-discovery. Each entry becomes a
  // <link rel="alternate" type="application/rss+xml">. The global
  // feed is always attached (see GLOBAL_FEED below — a page's
  // metadata replaces, not merges, the root layout's `alternates`,
  // so the global feed has to be re-emitted here); per-show pages
  // pass their own feed in addition.
  feeds?: { url: string; title: string }[]
}

const GLOBAL_FEED = {
  url: '/feed.xml',
  title: 'tiered.tv — all updates',
} as const

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex,
  feeds,
}: BuildMetadataArgs): Metadata {
  const canonical = canonicalUrl(path)
  const ogImage = image
    ? canonicalUrl(image)
    : canonicalUrl(siteConfig.defaultOgImage)

  return {
    title,
    description,
    alternates: {
      canonical,
      types: {
        'application/rss+xml': [GLOBAL_FEED, ...(feeds ?? [])].map((f) => ({
          url: f.url,
          title: f.title,
        })),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  }
}

type BreadcrumbItem = { name: string; path: string }

type ItemListEntry = {
  position: number
  name: string
  path?: string
  url?: string
  description?: string
}

type CollectionPageArgs = {
  name: string
  description: string
  path: string
}

type ItemListArgs = {
  name: string
  description?: string
  path: string
  items: ItemListEntry[]
  author?: string
  dateModified?: string
}

type ArticleArgs = {
  headline: string
  description: string
  path: string
  datePublished?: string
  dateModified?: string
  author?: string
  image?: string
}

type BreadcrumbListArgs = {
  trail: BreadcrumbItem[]
}

type FAQItem = {
  question: string
  answer: string
}

type FAQPageArgs = {
  path: string
  faqs: FAQItem[]
}

export function buildJsonLd(
  args:
    | ({ type: 'CollectionPage' } & CollectionPageArgs)
    | ({ type: 'ItemList' } & ItemListArgs)
    | ({ type: 'Article' } & ArticleArgs)
    | ({ type: 'BreadcrumbList' } & BreadcrumbListArgs)
    | ({ type: 'FAQPage' } & FAQPageArgs),
): Record<string, unknown> {
  if (args.type === 'CollectionPage') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: args.name,
      description: args.description,
      url: canonicalUrl(args.path),
    }
  }
  if (args.type === 'ItemList') {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: args.name,
      ...(args.description ? { description: args.description } : {}),
      url: canonicalUrl(args.path),
      ...(args.author
        ? { author: { '@type': 'Person', name: args.author } }
        : {}),
      ...(args.dateModified ? { dateModified: args.dateModified } : {}),
      itemListElement: args.items.map((entry) => ({
        '@type': 'ListItem',
        position: entry.position,
        name: entry.name,
        ...(entry.url
          ? { url: entry.url }
          : entry.path
            ? { url: canonicalUrl(entry.path) }
            : {}),
        ...(entry.description ? { description: entry.description } : {}),
      })),
    }
  }
  if (args.type === 'Article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: args.headline,
      description: args.description,
      url: canonicalUrl(args.path),
      ...(args.datePublished ? { datePublished: args.datePublished } : {}),
      ...(args.dateModified ? { dateModified: args.dateModified } : {}),
      ...(args.author
        ? { author: { '@type': 'Person', name: args.author } }
        : {}),
      ...(args.image ? { image: canonicalUrl(args.image) } : {}),
    }
  }
  if (args.type === 'BreadcrumbList') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: args.trail.map((item, ix) => ({
        '@type': 'ListItem',
        position: ix + 1,
        name: item.name,
        item: canonicalUrl(item.path),
      })),
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: canonicalUrl(args.path),
    mainEntity: args.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

type JsonLdScriptProps = {
  id: string
  data: Record<string, unknown>
}

export function jsonLdScriptProps({ id, data }: JsonLdScriptProps): {
  id: string
  type: 'application/ld+json'
  dangerouslySetInnerHTML: { __html: string }
} {
  return {
    id,
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  }
}
