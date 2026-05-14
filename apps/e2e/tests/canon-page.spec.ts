import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 7 lights up /shows/[show]/canon. Survivor seeded a
// 4-entry canon (phase 7); phase 25 seeded 3-entry canons for
// the other two pioneers — top-chef and dragrace — so the
// populated-list assertion now covers all three. Shows beyond
// the pioneer trio still exercise the empty-state path until
// future /ship-content rounds seed their canons.

const canonUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]/canon')

const SHOWS_WITH_CANON = new Set(['survivor', 'top-chef', 'dragrace'])

for (const url of canonUrls) {
  const slug = url.show ?? ''
  test.describe(`canon page: ${slug}`, () => {
    test(`renders ShowHero + palette swap + ${SHOWS_WITH_CANON.has(slug) ? 'ranked list' : 'empty state'}`, async ({
      page,
    }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('canon-page-screen')).toBeVisible()
      await expect(page.getByTestId('show-hero')).toBeVisible()
      await expect(page.locator('h1').first()).toContainText(/editor['’]s canon/i)
      await expect(page.getByTestId('shield-badge').first()).toBeVisible()

      const sigilCount = await page.getByTestId('show-sigil').count()
      expect(sigilCount).toBe(0)

      const wrapper = page.locator(`[data-show="${slug}"]`).first()
      await expect(wrapper).toBeVisible()

      if (SHOWS_WITH_CANON.has(slug)) {
        const list = page.getByTestId('canon-list').first()
        await expect(list).toBeVisible()
        const entries = page.getByTestId('canon-entry')
        const count = await entries.count()
        expect(count, `expected at least one canon-entry on /shows/${slug}/canon`).toBeGreaterThanOrEqual(1)
        // Every entry links to a season page on the same show.
        const firstHref = await entries.first().locator('a').first().getAttribute('href')
        expect(firstHref).toMatch(new RegExp(`^/shows/${slug}/season/[a-z0-9-]+$`))
      } else {
        const empty = page.getByTestId('canon-list').first()
        await expect(empty).toBeVisible()
        expect(await empty.getAttribute('data-empty')).toBe('true')
        await expect(empty).toContainText(/canon hasn['’]?t been ranked/i)
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
