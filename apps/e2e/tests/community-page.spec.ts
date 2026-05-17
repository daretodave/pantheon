import { type Browser, expect, test } from '@playwright/test'
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

// Phase 35 stage 3: with enough distinct voters the community pane
// stops mirroring the canon and renders Supabase-derived counters.
// `top-chef` is unused by ranking-api / vote-backend specs so the
// shared hermetic DB stays collision-free.
const LIVE_SHOW = 'top-chef'

async function castOneSession(
  browser: Browser,
  targetId: string,
): Promise<void> {
  const ctx = await browser.newContext()
  try {
    const page = await ctx.newPage()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const status = await page.evaluate(async (tid) => {
      const r = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          targetType: 'season',
          targetId: tid,
          value: 1,
        }),
        credentials: 'include',
      })
      return r.status
    }, targetId)
    expect(status).toBe(200)
  } finally {
    await ctx.close()
  }
}

test.describe('live community pane (votes cleared the threshold)', () => {
  test('renders Supabase-derived counters once voters >= threshold', async ({
    browser,
    page,
  }) => {
    // Six distinct anon sessions, each a single keep-vote, clears the
    // VOTE_THRESHOLD (5) so the pane flips canon-mirror -> live.
    for (let i = 1; i <= 6; i += 1) {
      await castOneSession(browser, `${LIVE_SHOW}:${i}`)
    }

    const response = await page.goto(`/shows/${LIVE_SHOW}?view=community`, {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(200)

    const strip = page.getByTestId('community-live-strip')
    await expect(strip).toBeVisible()
    expect(await strip.getAttribute('data-source')).toBe('votes')
    await expect(strip).toContainText('live votes')
    await expect(strip).toContainText('Thursday 9pm ET')

    const list = page.getByTestId('community-rank-list')
    await expect(list).toBeVisible()
    expect(await list.getAttribute('data-source')).toBe('votes')
    // At least one row now carries a real approval percentage.
    await expect(list.locator('.cp-clr-pct').first()).toContainText('%')

    // Phase 35 stage 3c: the "What changed this week." shifts row is
    // snapshot-delta-driven. The hermetic DB seeds no >= 7d baseline
    // snapshot, so even with live votes there is nothing to compare
    // against — the surface stays absent (the design's intended empty
    // behavior), it does not render an empty box.
    await expect(page.getByTestId('shifts-row')).toHaveCount(0)
  })
})

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
