// Phase 32: RSS 2.0 serializer. Hand-written, no SDK. Output is
// byte-deterministic for a fixed item list (CI feeds must not churn
// across builds when content is unchanged).

export type FeedItem = {
  title: string
  // Canonical absolute URL. Doubles as the guid (isPermaLink=true).
  url: string
  date: Date
  description: string
}

export type FeedChannel = {
  title: string
  // The human page the feed describes (site root or show page).
  link: string
  // The feed's own absolute URL (atom:self).
  feedUrl: string
  description: string
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// RFC-822 / RFC-1123, always UTC. Date#toUTCString already emits
// "Wed, 17 May 2026 00:00:00 GMT" which is a valid RSS pubDate.
export function rfc822(d: Date): string {
  return d.toUTCString()
}

export function renderRss(channel: FeedChannel, items: FeedItem[]): string {
  // Deterministic lastBuildDate: the newest item's date, or the
  // unix epoch when the feed is (impossibly) empty. Never "now".
  const lastBuild = items[0]?.date ?? new Date(0)

  const itemXml = items
    .map((it) =>
      [
        '    <item>',
        `      <title>${escapeXml(it.title)}</title>`,
        `      <link>${escapeXml(it.url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(it.url)}</guid>`,
        `      <pubDate>${rfc822(it.date)}</pubDate>`,
        `      <description>${escapeXml(it.description)}</description>`,
        '    </item>',
      ].join('\n'),
    )
    .join('\n')

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${escapeXml(channel.link)}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="application/rss+xml"/>`,
  ]
  if (itemXml) lines.push(itemXml)
  lines.push('  </channel>', '</rss>')
  // Trailing newline so the file ends cleanly.
  return `${lines.join('\n')}\n`
}
