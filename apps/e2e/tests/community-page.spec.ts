import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 31c: /shows/[show]/community renders the unified canon/community
// shell with the community view active. Live-strip, movers placeholder,
// weekly question card, and the full ranking table appear when seasons
// exist. With no live votes, the ranking table reads cleanly as a
// canon-ordered list — approval / % / 7d / votes cells render as hidden
// placeholders.

const communityUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]/community')

for (const url of communityUrls) {
  const slug = url.show ?? ''
  test.describe(`community page: ${slug}`, () => {
    test(`renders the unified shell with community view active`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('community-page-screen')).toBeVisible()
      const root = page.getByTestId('canon-page-root')
      await expect(root).toBeVisible()
      expect(await root.getAttribute('data-view')).toBe('community')
      await expect(page.getByTestId('canon-h1')).toContainText(/editor['’]s canon|community rank/i)
      await expect(page.getByTestId('canon-tabs')).toBeVisible()
      await expect(page.getByTestId('community-live-strip')).toBeVisible()
      await expect(page.getByTestId('community-movers')).toBeVisible()

      const sigilCount = await page.getByTestId('show-sigil').count()
      expect(sigilCount).toBe(0)

      const seasonsCount = url.seasonsCount ?? 0
      if (seasonsCount > 0) {
        await expect(page.getByTestId('community-rank-list')).toBeVisible()
        const rows = page.getByTestId('community-rank-row')
        expect(await rows.count()).toBeGreaterThanOrEqual(1)
      } else {
        await expect(page.getByTestId('community-empty')).toBeVisible()
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

test.describe('community ↔ canon tab switch', () => {
  test('clicking the Editor tab on /community lands on /canon', async ({ page }) => {
    await page.goto('/shows/survivor/community', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('canon-tab-canon').click()
    await expect(page).toHaveURL('/shows/survivor/canon')
    const root = page.getByTestId('canon-page-root')
    expect(await root.getAttribute('data-view')).toBe('canon')
  })
})
