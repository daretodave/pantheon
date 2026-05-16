import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'
import { rankingRedirects } from '../src/fixtures/redirect-fixtures'

// Phase 33: the standalone /shows/[show]/community route is gone. It
// 308s to /shows/[show]?view=community, which seeds the community
// pane server-side (live strip + movers + weekly question + full
// table, or the empty state). This spec asserts the 308 contract and
// the seeded community pane on the consolidated page.

const showRows = canonicalUrls.filter(
  (u) => u.pattern === '/shows/[show]' && u.show,
)

const communityRedirects = rankingRedirects.filter((r) =>
  r.fromPath.endsWith('/community'),
)

for (const r of communityRedirects) {
  test(`community 308: ${r.fromPath} → ${r.toPath}`, async ({ page }) => {
    const response = await page.goto(r.fromPath, {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(200)
    const landed = new URL(page.url())
    expect(landed.pathname).toBe(`/shows/${r.show}`)
    expect(landed.searchParams.get('view')).toBe('community')

    const ranking = page.getByTestId('show-ranking')
    expect(await ranking.getAttribute('data-view')).toBe('community')
  })
}

for (const row of showRows) {
  const slug = row.show as string
  test.describe(`consolidated community pane: ${slug}`, () => {
    test(`?view=community seeds the community pane server-side`, async ({
      page,
    }) => {
      const response = await page.goto(`/shows/${slug}?view=community`, {
        waitUntil: 'domcontentloaded',
      })
      expect(response?.status()).toBe(200)

      const ranking = page.getByTestId('show-ranking')
      await expect(ranking).toBeVisible()
      expect(await ranking.getAttribute('data-view')).toBe('community')
      await expect(page.getByTestId('canon-tabs')).toBeVisible()
      await expect(page.getByTestId('community-view-pane')).toBeVisible()
      await expect(page.getByTestId('community-live-strip')).toBeVisible()
      await expect(page.getByTestId('community-movers')).toBeVisible()

      const sigilCount = await page.getByTestId('show-sigil').count()
      expect(sigilCount).toBe(0)

      const seasonsCount = row.seasonsCount ?? 0
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

  for (const row of showRows) {
    const slug = row.show as string
    test(`community pane mobile reflow: ${slug}`, async ({ page }) => {
      const response = await page.goto(`/shows/${slug}?view=community`, {
        waitUntil: 'domcontentloaded',
      })
      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('show-ranking')).toBeVisible()

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(
        overflow.scrollWidth - overflow.clientWidth,
        `horizontal overflow on /shows/${slug}?view=community`,
      ).toBeLessThanOrEqual(1)
    })
  }
})
