import { describe, expect, it } from 'vitest'
import {
  buildJsonLd,
  buildMetadata,
  canonicalUrl,
  jsonLdScriptProps,
  siteConfig,
} from './seo'

describe('canonicalUrl', () => {
  it('returns base URL for "/"', () => {
    expect(canonicalUrl('/')).toBe(`${siteConfig.baseUrl}/`)
  })

  it('returns base URL for empty path', () => {
    expect(canonicalUrl('')).toBe(`${siteConfig.baseUrl}/`)
  })

  it('strips trailing slash from non-root paths', () => {
    expect(canonicalUrl('/shows/')).toBe(`${siteConfig.baseUrl}/shows`)
  })

  it('does not duplicate base URL', () => {
    expect(canonicalUrl('/shows')).toBe(`${siteConfig.baseUrl}/shows`)
  })

  it('preserves nested paths', () => {
    expect(canonicalUrl('/shows/survivor/canon')).toBe(
      `${siteConfig.baseUrl}/shows/survivor/canon`,
    )
  })

  it('preserves query strings on a non-root path', () => {
    expect(canonicalUrl('/shows?sort=alpha')).toBe(
      `${siteConfig.baseUrl}/shows?sort=alpha`,
    )
  })

  it('preserves a fragment', () => {
    expect(canonicalUrl('/about#methodology')).toBe(
      `${siteConfig.baseUrl}/about#methodology`,
    )
  })

  it('preserves query + fragment together', () => {
    expect(canonicalUrl('/about?ref=footer#methodology')).toBe(
      `${siteConfig.baseUrl}/about?ref=footer#methodology`,
    )
  })

  it('strips trailing slash before a query string', () => {
    expect(canonicalUrl('/shows/?sort=alpha')).toBe(
      `${siteConfig.baseUrl}/shows?sort=alpha`,
    )
  })

  it('handles a relative path by prepending a leading slash', () => {
    expect(canonicalUrl('shows')).toBe(`${siteConfig.baseUrl}/shows`)
  })
})

describe('buildMetadata', () => {
  it('sets title, description, and canonical alternate', () => {
    const meta = buildMetadata({
      title: 'Shows — tiered.tv',
      description: 'Browse every covered show.',
      path: '/shows',
    })
    expect(meta.title).toBe('Shows — tiered.tv')
    expect(meta.description).toBe('Browse every covered show.')
    expect(meta.alternates?.canonical).toBe(`${siteConfig.baseUrl}/shows`)
  })

  it('always emits the global RSS feed alternate', () => {
    const meta = buildMetadata({
      title: 't',
      description: 'd',
      path: '/about',
    })
    const rss = (
      meta.alternates?.types as
        | Record<string, { url: string; title?: string }[]>
        | undefined
    )?.['application/rss+xml']
    expect(rss?.length).toBe(1)
    expect(rss?.[0]?.url).toBe('/feed.xml')
  })

  it('appends per-page feeds after the global feed', () => {
    const meta = buildMetadata({
      title: 't',
      description: 'd',
      path: '/shows/survivor',
      feeds: [{ url: '/feed/survivor.xml', title: 'Survivor — tiered.tv' }],
    })
    const rss = (
      meta.alternates?.types as
        | Record<string, { url: string; title?: string }[]>
        | undefined
    )?.['application/rss+xml']
    expect(rss?.map((r) => r.url)).toEqual([
      '/feed.xml',
      '/feed/survivor.xml',
    ])
  })

  it('sets openGraph and twitter blocks with the default OG image', () => {
    const meta = buildMetadata({
      title: 't',
      description: 'd',
      path: '/about',
    })
    expect(meta.openGraph?.url).toBe(`${siteConfig.baseUrl}/about`)
    const ogImages = meta.openGraph?.images
    expect(Array.isArray(ogImages)).toBe(true)
    const twitter = meta.twitter as { card?: string } | null | undefined
    expect(twitter?.card).toBe('summary_large_image')
  })

  it('honors a per-route image override', () => {
    const meta = buildMetadata({
      title: 't',
      description: 'd',
      path: '/shows/survivor',
      image: '/shows/survivor/opengraph-image',
    })
    const ogImages = meta.openGraph?.images
    const firstImage = Array.isArray(ogImages) ? ogImages[0] : undefined
    const imageUrl =
      firstImage && typeof firstImage === 'object' && 'url' in firstImage
        ? (firstImage as { url: string }).url
        : undefined
    expect(imageUrl).toBe(
      `${siteConfig.baseUrl}/shows/survivor/opengraph-image`,
    )
  })

  it('emits robots:noindex when requested', () => {
    const meta = buildMetadata({
      title: 't',
      description: 'd',
      path: '/sign-in',
      noIndex: true,
    })
    expect(meta.robots).toEqual({ index: false, follow: false })
  })
})

describe('buildJsonLd', () => {
  it('returns a CollectionPage block', () => {
    const ld = buildJsonLd({
      type: 'CollectionPage',
      name: 'Survivor',
      description: 'The mother format.',
      path: '/shows/survivor',
    })
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('CollectionPage')
    expect(ld['name']).toBe('Survivor')
    expect(ld['url']).toBe(`${siteConfig.baseUrl}/shows/survivor`)
  })

  it('returns an ItemList block with positioned entries', () => {
    const ld = buildJsonLd({
      type: 'ItemList',
      name: 'Survivor — Editor’s Canon',
      path: '/shows/survivor/canon',
      items: [
        { position: 1, name: 'Heroes vs. Villains', path: '/shows/survivor/season/20' },
        { position: 2, name: 'Pearl Islands', path: '/shows/survivor/season/7' },
      ],
    })
    expect(ld['@type']).toBe('ItemList')
    const items = ld['itemListElement'] as Array<Record<string, unknown>>
    expect(items).toHaveLength(2)
    expect(items[0]?.['@type']).toBe('ListItem')
    expect(items[0]?.['position']).toBe(1)
    expect(items[0]?.['url']).toBe(
      `${siteConfig.baseUrl}/shows/survivor/season/20`,
    )
  })

  it('returns an ItemList block with optional author + dateModified', () => {
    const ld = buildJsonLd({
      type: 'ItemList',
      name: 'Firsts that hold up',
      path: '/themes/firsts',
      author: 'M. Reyes',
      dateModified: '2026-05-01',
      items: [
        { position: 1, name: 'Survivor S1', path: '/shows/survivor/season/1' },
      ],
    })
    expect(ld['author']).toMatchObject({
      '@type': 'Person',
      name: 'M. Reyes',
    })
    expect(ld['dateModified']).toBe('2026-05-01')
  })

  it('omits author + dateModified from ItemList when not provided', () => {
    const ld = buildJsonLd({
      type: 'ItemList',
      name: 'No byline',
      path: '/themes/anon',
      items: [
        { position: 1, name: 'Survivor S1', path: '/shows/survivor/season/1' },
      ],
    })
    expect(ld).not.toHaveProperty('author')
    expect(ld).not.toHaveProperty('dateModified')
  })

  it('returns an Article block with optional fields', () => {
    const ld = buildJsonLd({
      type: 'Article',
      headline: 'Survivor Season 20',
      description: 'Vote and discuss.',
      path: '/shows/survivor/season/20',
      datePublished: '2026-01-01',
      author: 'tiered.tv Editors',
    })
    expect(ld['@type']).toBe('Article')
    expect(ld['headline']).toBe('Survivor Season 20')
    expect(ld['datePublished']).toBe('2026-01-01')
    expect(ld['author']).toMatchObject({
      '@type': 'Person',
      name: 'tiered.tv Editors',
    })
  })

  it('returns a BreadcrumbList from a trail', () => {
    const ld = buildJsonLd({
      type: 'BreadcrumbList',
      trail: [
        { name: 'Home', path: '/' },
        { name: 'Shows', path: '/shows' },
        { name: 'Survivor', path: '/shows/survivor' },
      ],
    })
    expect(ld['@type']).toBe('BreadcrumbList')
    const items = ld['itemListElement'] as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)
    expect(items[2]?.['position']).toBe(3)
    expect(items[2]?.['item']).toBe(`${siteConfig.baseUrl}/shows/survivor`)
  })

  it('returns a FAQPage with mainEntity Question + Answer entries', () => {
    const ld = buildJsonLd({
      type: 'FAQPage',
      path: '/about',
      faqs: [
        { question: 'Q1?', answer: 'A1.' },
        { question: 'Q2?', answer: 'A2.' },
      ],
    })
    expect(ld['@type']).toBe('FAQPage')
    expect(ld['url']).toBe(`${siteConfig.baseUrl}/about`)
    const entities = ld['mainEntity'] as Array<Record<string, unknown>>
    expect(entities).toHaveLength(2)
    expect(entities[0]?.['@type']).toBe('Question')
    expect(entities[0]?.['name']).toBe('Q1?')
    const ans = entities[0]?.['acceptedAnswer'] as Record<string, unknown>
    expect(ans['@type']).toBe('Answer')
    expect(ans['text']).toBe('A1.')
  })
})

describe('jsonLdScriptProps', () => {
  it('serializes the data into the dangerously-set HTML', () => {
    const props = jsonLdScriptProps({
      id: 'ld-test',
      data: { '@type': 'Thing', name: 'x' },
    })
    expect(props.type).toBe('application/ld+json')
    expect(props.id).toBe('ld-test')
    expect(props.dangerouslySetInnerHTML.__html).toBe(
      '{"@type":"Thing","name":"x"}',
    )
  })
})
