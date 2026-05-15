import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 31c: /shows/[show]/canon renders the unified canon/community
// shell with the canon view active. Methodology cells, tier bands, and
// hero entries with optional community mini-pills appear when a canon
// exists for the show. Shows without seeded canons render the empty
// state per the always-working rule.

const canonUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]/canon')

const SHOWS_WITH_CANON = new Set([
  'survivor',
  'top-chef',
  'dragrace',
  'amazing-race',
  'the-challenge',
])

for (const url of canonUrls) {
  const slug = url.show ?? ''
  test.describe(`canon page: ${slug}`, () => {
    test(`renders the unified shell with canon view active`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('canon-page-screen')).toBeVisible()
      const root = page.getByTestId('canon-page-root')
      await expect(root).toBeVisible()
      expect(await root.getAttribute('data-view')).toBe('canon')
      await expect(page.getByTestId('canon-h1')).toContainText(/editor['’]s canon/i)
      await expect(page.getByTestId('canon-tabs')).toBeVisible()

      const sigilCount = await page.getByTestId('show-sigil').count()
      expect(sigilCount).toBe(0)

      const wrapper = page.locator(`[data-show="${slug}"]`).first()
      await expect(wrapper).toBeVisible()

      if (SHOWS_WITH_CANON.has(slug)) {
        await expect(page.getByTestId('canon-methodology')).toBeVisible()
        const tiers = page.getByTestId('canon-tier')
        expect(await tiers.count()).toBeGreaterThanOrEqual(1)
        const heroEntries = page.getByTestId('canon-hero-entry')
        expect(await heroEntries.count()).toBeGreaterThanOrEqual(1)
        const firstHref = await heroEntries.first().getAttribute('href')
        expect(firstHref).toMatch(new RegExp(`^/shows/${slug}/(season/[a-z0-9-]+|$)`))
      } else {
        await expect(page.getByTestId('canon-empty')).toBeVisible()
      }
    })
  })
}

test.describe('mobile @ 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const url of canonUrls) {
    const slug = url.show ?? ''
    test(`canon mobile reflow: ${slug}`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('canon-page-root')).toBeVisible()

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(
        overflow.scrollWidth - overflow.clientWidth,
        `horizontal overflow on ${url.path}: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(1)
    })
  }
})

test.describe('canon ↔ community tab switch', () => {
  test('clicking the Community tab on /canon lands on /community', async ({ page }) => {
    await page.goto('/shows/survivor/canon', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('canon-tab-community').click()
    await expect(page).toHaveURL('/shows/survivor/community')
    const root = page.getByTestId('canon-page-root')
    expect(await root.getAttribute('data-view')).toBe('community')
  })
})
