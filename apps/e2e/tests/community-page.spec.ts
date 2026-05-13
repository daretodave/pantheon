import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 8 lights up /shows/[show]/community. Survivor has a
// canon, so its source is 'canon'. Top Chef + Drag Race have
// seasons-only state (today: zero seasons → seasons source with
// empty entries). When their seasons land the source flips
// without page changes.

const communityUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]/community')

const EXPECTED_SOURCE: Record<string, 'canon' | 'seasons' | 'votes'> = {
  survivor: 'canon',
  'top-chef': 'seasons',
  dragrace: 'seasons',
}

for (const url of communityUrls) {
  const slug = url.show ?? ''
  test.describe(`community page: ${slug}`, () => {
    test(`renders ShowHero + sigil + source banner + (cards | empty)`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('community-page-screen')).toBeVisible()
      await expect(page.getByTestId('show-hero')).toBeVisible()
      await expect(page.locator('h1').first()).toContainText(/community rank/i)
      await expect(page.getByTestId('show-sigil').first()).toBeVisible()
      await expect(page.getByTestId('shield-badge').first()).toBeVisible()

      const banner = page.getByTestId('community-source-banner')
      await expect(banner).toBeVisible()
      const expectedSource = EXPECTED_SOURCE[slug]
      if (expectedSource) {
        expect(await banner.getAttribute('data-rank-source')).toBe(expectedSource)
      }

      const grid = page.getByTestId('season-grid').first()
      await expect(grid).toBeVisible()

      if (slug === 'survivor') {
        // Survivor has 4 seasons seeded; canon order ranks them.
        const cards = page.getByTestId('season-card')
        expect(await cards.count()).toBeGreaterThanOrEqual(1)
      } else {
        // Top Chef + Drag Race have zero seasons today → empty state.
        expect(await grid.getAttribute('data-empty')).toBe('true')
      }
    })
  })
}

test.describe('mobile @ 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const url of communityUrls) {
    const slug = url.show ?? ''
    test(`community mobile reflow: ${slug}`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('show-hero')).toBeVisible()

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
