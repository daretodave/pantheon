import { describe, expect, it } from 'vitest'
import { escapeXml, renderRss, rfc822, type FeedItem } from '../rss'

const channel = {
  title: 'tiered.tv',
  link: 'https://tiered.tv/',
  feedUrl: 'https://tiered.tv/feed.xml',
  description: 'New seasons & canon revisions',
}

const items: FeedItem[] = [
  {
    title: 'Survivor — Borneo',
    url: 'https://tiered.tv/shows/survivor/season/borneo',
    date: new Date('2024-05-01T00:00:00Z'),
    description: 'Where it all began.',
  },
  {
    title: 'Heroes <em>vs.</em> Villains & friends',
    url: 'https://tiered.tv/shows/survivor/season/heroes-villains',
    date: new Date('2010-02-11T00:00:00Z'),
    description: 'A "best-of" cast.',
  },
]

describe('escapeXml', () => {
  it('escapes the five XML entities', () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe(
      'a&amp;b&lt;c&gt;d&quot;e&apos;f',
    )
  })
})

describe('rfc822', () => {
  it('emits an RFC-822 UTC string', () => {
    expect(rfc822(new Date('2026-05-17T00:00:00Z'))).toBe(
      'Sun, 17 May 2026 00:00:00 GMT',
    )
  })
})

describe('renderRss', () => {
  const xml = renderRss(channel, items)

  it('is a well-formed RSS 2.0 envelope with an atom:self link', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<channel>')
    expect(xml).toContain(
      '<atom:link href="https://tiered.tv/feed.xml" rel="self" type="application/rss+xml"/>',
    )
    expect(xml.trimEnd().endsWith('</rss>')).toBe(true)
  })

  it('renders one <item> per feed item with a permalink guid', () => {
    expect((xml.match(/<item>/g) ?? []).length).toBe(2)
    expect(xml).toContain(
      '<guid isPermaLink="true">https://tiered.tv/shows/survivor/season/borneo</guid>',
    )
    expect(xml).toContain('<pubDate>Wed, 01 May 2024 00:00:00 GMT</pubDate>')
  })

  it('escapes item titles and descriptions', () => {
    expect(xml).toContain(
      '<title>Heroes &lt;em&gt;vs.&lt;/em&gt; Villains &amp; friends</title>',
    )
    expect(xml).toContain('<description>A &quot;best-of&quot; cast.</description>')
  })

  it('uses the newest item date as lastBuildDate (never "now")', () => {
    expect(xml).toContain(
      '<lastBuildDate>Wed, 01 May 2024 00:00:00 GMT</lastBuildDate>',
    )
  })

  it('is byte-stable across calls for identical input', () => {
    expect(renderRss(channel, items)).toBe(xml)
  })

  it('handles an empty item list as a valid empty channel', () => {
    const empty = renderRss(channel, [])
    expect(empty).toContain('<channel>')
    expect(empty).not.toContain('<item>')
    expect(empty).toContain(
      '<lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>',
    )
  })
})
