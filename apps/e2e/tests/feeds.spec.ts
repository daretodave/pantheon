import { test, expect } from '@playwright/test'
import { GLOBAL_FEED, feedUrls } from '../src/fixtures/feed-urls'

// First per-show feed (feedUrls[0] is the global feed).
const showFeed = feedUrls.find((u) => u !== GLOBAL_FEED) ?? '/feed/survivor.xml'

test('global /feed.xml is a valid RSS 2.0 document', async ({ page }) => {
  const res = await page.goto(GLOBAL_FEED, { waitUntil: 'domcontentloaded' })
  expect(res?.status()).toBe(200)
  expect(res?.headers()['content-type'] ?? '').toMatch(/application\/rss\+xml/i)
  const body = (await res?.text()) ?? ''
  expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
  expect(body).toContain('<rss version="2.0"')
  expect(body).toContain('<channel>')
  expect(body).toMatch(/<item>/)
  expect(body).toContain(
    'rel="self" type="application/rss+xml"',
  )
  expect(body).toContain('https://tiered.tv/feed.xml')
  // guids are absolute permalinks.
  expect(body).toMatch(/<guid isPermaLink="true">https:\/\/tiered\.tv\//)
})

test('per-show feed scopes to that show', async ({ page }) => {
  const res = await page.goto(showFeed, { waitUntil: 'domcontentloaded' })
  expect(res?.status()).toBe(200)
  expect(res?.headers()['content-type'] ?? '').toMatch(/application\/rss\+xml/i)
  const body = (await res?.text()) ?? ''
  expect(body).toContain('<rss version="2.0"')
  expect(body).toMatch(/<item>/)
  const slug = showFeed.replace('/feed/', '').replace('.xml', '')
  expect(body).toContain(`https://tiered.tv/feed/${slug}.xml`)
  // Every link points at this show.
  for (const m of body.matchAll(/<link>([^<]+)<\/link>/g)) {
    const href = m[1] ?? ''
    if (href.includes('/feed/')) continue
    expect(href).toContain(`/shows/${slug}`)
  }
})

test('unknown show feed 404s', async ({ page }) => {
  const res = await page.goto('/feed/does-not-exist.xml', {
    waitUntil: 'domcontentloaded',
  })
  expect(res?.status()).toBe(404)
})

test('feed path without .xml suffix 404s', async ({ page }) => {
  const res = await page.goto('/feed/survivor', {
    waitUntil: 'domcontentloaded',
  })
  expect(res?.status()).toBe(404)
})

test('global feed is auto-discoverable site-wide', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const link = page.locator(
    'link[rel="alternate"][type="application/rss+xml"]',
  )
  expect(await link.count()).toBeGreaterThanOrEqual(1)
  const hrefs = await link.evaluateAll((els) =>
    els.map((e) => e.getAttribute('href') ?? ''),
  )
  expect(hrefs.some((h) => h.endsWith('/feed.xml'))).toBe(true)
})

test('show page also advertises its per-show feed', async ({ page }) => {
  const slug = showFeed.replace('/feed/', '').replace('.xml', '')
  await page.goto(`/shows/${slug}`, { waitUntil: 'domcontentloaded' })
  const hrefs = await page
    .locator('link[rel="alternate"][type="application/rss+xml"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''))
  expect(hrefs.some((h) => h.endsWith(`/feed/${slug}.xml`))).toBe(true)
})
