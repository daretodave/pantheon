import { test, expect } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'
import { feedUrls } from '../src/fixtures/feed-urls'

const SITEMAP_EXCLUDE = new Set<string>(['/sign-in', '/mod', '/u/[handle]'])

test('robots.txt advertises the sitemap and disallows private surfaces', async ({ page }) => {
  const response = await page.goto('/robots.txt', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  const body = (await response?.text()) ?? ''
  expect(body).toMatch(/User-Agent:\s*\*/i)
  expect(body).toMatch(/Disallow:\s*\/api\//i)
  expect(body).toMatch(/Disallow:\s*\/mod/i)
  expect(body).toMatch(/Disallow:\s*\/sign-in/i)
  expect(body).toMatch(/Sitemap:\s*https?:\/\/.+\/sitemap\.xml/i)
})

test('sitemap.xml lists every public canonical URL', async ({ page }) => {
  const response = await page.goto('/sitemap.xml', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  const body = (await response?.text()) ?? ''
  expect(body).toContain('<urlset')

  const expectedPaths = canonicalUrls
    .filter((u) => !SITEMAP_EXCLUDE.has(u.pattern))
    .map((u) => u.path)
  for (const path of expectedPaths) {
    const tail = path === '/' ? '/' : path
    expect(body, `sitemap missing path ${path}`).toContain(tail)
  }

  // Excluded URLs must NOT appear in the sitemap.
  for (const u of canonicalUrls) {
    if (!SITEMAP_EXCLUDE.has(u.pattern)) continue
    if (u.path === '/') continue
    expect(body, `sitemap unexpectedly includes ${u.path}`).not.toMatch(new RegExp(`${u.path}\\b`))
  }
})

test('opengraph-image renders a PNG', async ({ page }) => {
  const response = await page.goto('/opengraph-image', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  const ct = response?.headers()['content-type'] ?? ''
  expect(ct).toMatch(/image\/png/i)
})

// Per-route OG image routes return image/png. page.goto resolves
// once the network reply lands.

test('per-route opengraph-image: /shows/[show]', async ({ page }) => {
  const response = await page.goto('/shows/survivor/opengraph-image')
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-type'] ?? '').toMatch(/image\/png/i)
})

// Phase 33: the standalone /canon + /community OG routes were
// deleted with the route collapse. The consolidated show-page OG
// (asserted above) now covers canon + community in one image.

test('per-route opengraph-image: /shows/[show]/season/[slug]', async ({ page }) => {
  const response = await page.goto('/shows/survivor/season/borneo/opengraph-image')
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-type'] ?? '').toMatch(/image\/png/i)
})

test('per-route opengraph-image: /themes/[theme]', async ({ page }) => {
  const response = await page.goto('/themes/survivor-pillars/opengraph-image')
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-type'] ?? '').toMatch(/image\/png/i)
})

test('/about emits FAQPage JSON-LD with ≥4 questions', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'domcontentloaded' })
  const raw = await page.locator('script#ld-about-faq').textContent()
  expect(raw).toBeTruthy()
  const parsed = JSON.parse(raw ?? '{}')
  expect(parsed['@type']).toBe('FAQPage')
  const entities = parsed.mainEntity as Array<Record<string, unknown>>
  expect(entities.length).toBeGreaterThanOrEqual(4)
  for (const q of entities) {
    expect(q['@type']).toBe('Question')
    expect(typeof q.name).toBe('string')
    const ans = q.acceptedAnswer as Record<string, unknown>
    expect(ans['@type']).toBe('Answer')
    expect(typeof ans.text).toBe('string')
  }
})

test('sitemap entry count matches expected canonical URL count', async ({ page }) => {
  const response = await page.goto('/sitemap.xml', { waitUntil: 'domcontentloaded' })
  const body = (await response?.text()) ?? ''
  // Count <url> blocks (each entry).
  const urlCount = (body.match(/<url>/g) ?? []).length
  // Phase 32: the sitemap also carries the RSS feed URLs (global +
  // one per show) — see app/sitemap.ts / lib/routes.getFeedPaths.
  const expected =
    canonicalUrls.filter((u) => !SITEMAP_EXCLUDE.has(u.pattern)).length +
    feedUrls.length
  expect(urlCount, `sitemap has ${urlCount} entries, expected ${expected}`).toBe(expected)
})
