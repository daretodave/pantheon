import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'
import { rankingRedirects } from '../src/fixtures/redirect-fixtures'

// Phase 33: the standalone /shows/[show]/canon route is gone. It 308s
// to the consolidated show page, where the Editor's Canon is the
// default ranking view (methodology + tier bands). This spec asserts
// the 308 contract and that the canon pane renders on the
// consolidated page.

const showSlugs = canonicalUrls
  .filter((u) => u.pattern === '/shows/[show]' && u.show)
  .map((u) => u.show as string)

const SHOWS_WITH_CANON = new Set([
  'survivor',
  'top-chef',
  'dragrace',
  'amazing-race',
  'the-challenge',
  'bachelor',
  'big-brother',
  'bachelorette',
  'project-runway',
  'bake-off',
  'love-island-uk',
  'love-island-us',
])

const canonRedirects = rankingRedirects.filter((r) =>
  r.fromPath.endsWith('/canon'),
)

for (const r of canonRedirects) {
  test(`canon 308: ${r.fromPath} → ${r.toPath}`, async ({ page }) => {
    const response = await page.goto(r.fromPath, {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(200)
    expect(new URL(page.url()).pathname).toBe(r.toPath)

    const chain: string[] = []
    let req = response?.request()
    while (req) {
      chain.unshift(req.url())
      const prev = req.redirectedFrom()
      if (!prev) break
      req = prev
    }
    expect(
      chain[0],
      `redirect chain start for ${r.fromPath}: ${chain.join(' → ')}`,
    ).toContain(r.fromPath)
  })
}

for (const slug of showSlugs) {
  test.describe(`consolidated canon pane: ${slug}`, () => {
    test(`canon is the default view with methodology + tiers`, async ({
      page,
    }) => {
      const response = await page.goto(`/shows/${slug}`, {
        waitUntil: 'domcontentloaded',
      })
      expect(response?.status()).toBe(200)

      const ranking = page.getByTestId('show-ranking')
      await expect(ranking).toBeVisible()
      expect(await ranking.getAttribute('data-view')).toBe('canon')
      await expect(page.getByTestId('canon-tabs')).toBeVisible()
      await expect(page.getByTestId('canon-view-pane')).toBeVisible()

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
        expect(firstHref).toMatch(
          new RegExp(`^/shows/${slug}/(season/[a-z0-9-]+|$)`),
        )
      } else {
        await expect(page.getByTestId('canon-empty')).toBeVisible()
      }
    })
  })
}
