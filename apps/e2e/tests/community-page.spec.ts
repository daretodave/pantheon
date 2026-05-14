import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 8 lights up /shows/[show]/community. Phase 25 seeded
// 3-entry canons for top-chef and dragrace alongside Survivor's
// 4-entry canon, so all three pioneer-trio communities now read
// 'canon' as their rank source. Shows beyond the pioneer trio
// still flow through the seasons source until canons land.

const communityUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]/community')

const EXPECTED_SOURCE: Record<string, 'canon' | 'seasons' | 'votes'> = {
  survivor: 'canon',
  'top-chef': 'canon',
  dragrace: 'canon',
}

for (const url of communityUrls) {
  const slug = url.show ?? ''
  test.describe(`community page: ${slug}`, () => {
    test(`renders ShowHero + source banner + (cards | empty)`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('community-page-screen')).toBeVisible()
      await expect(page.getByTestId('show-hero')).toBeVisible()
      await expect(page.locator('h1').first()).toContainText(/community rank/i)
      await expect(page.getByTestId('shield-badge').first()).toBeVisible()

      const sigilCount = await page.getByTestId('show-sigil').count()
      expect(sigilCount).toBe(0)

      const banner = page.getByTestId('community-source-banner')
      await expect(banner).toBeVisible()
      const expectedSource = EXPECTED_SOURCE[slug]
      if (expectedSource) {
        expect(await banner.getAttribute('data-rank-source')).toBe(expectedSource)
      }

      const grid = page.getByTestId('season-grid').first()
      await expect(grid).toBeVisible()

      if (EXPECTED_SOURCE[slug] === 'canon') {
        // Pioneer trio (survivor, top-chef, dragrace) have canons +
        // matching season files, so the grid renders ranked cards.
        const cards = page.getByTestId('season-card')
        expect(await cards.count()).toBeGreaterThanOrEqual(1)
      } else {
        // Other shows have no canon and no seasons yet → empty state.
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
