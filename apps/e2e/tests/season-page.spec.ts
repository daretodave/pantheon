import { expect, test } from '@playwright/test'
import { urlsForRun } from '../src/fixtures/sample-urls'

// Phase 30: season detail page rework. Each sampled season URL gets a
// baseline render check + the working VotePair interaction (archetype
// sample by default; E2E_FULL=1 walks every season). The gold-standard
// Survivor S20 / S28 / S1 describes below are explicit, not sampled —
// they always run regardless of mode.

const seasonUrls = urlsForRun().filter((u) => u.pattern === '/shows/[show]/season/[slug]')

for (const url of seasonUrls) {
  const slug = url.show ?? ''
  const seasonSlug = url.seasonSlug ?? ''
  test.describe(`season page: /shows/${slug}/season/${seasonSlug}`, () => {
    test('renders hero + info card + body grid + thread', async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('season-page-screen')).toBeVisible()
      await expect(page.getByTestId('season-hero')).toBeVisible()
      await expect(page.getByTestId('season-h1')).toBeVisible()
      await expect(page.getByTestId('season-lede').first()).toBeVisible()
      await expect(page.getByTestId('info-card')).toBeVisible()
      await expect(page.getByTestId('info-row-canon')).toBeVisible()
      await expect(page.getByTestId('info-row-vote')).toBeVisible()
      // Phase 37 nit 5: ranked seasons render the canon scale dot +
      // #NN label on the track (unranked seasons show the "not yet
      // ranked" fallback instead — scope the assertion accordingly).
      const rankScale = page.getByTestId('rank-scale')
      if ((await rankScale.count()) > 0) {
        await expect(page.getByTestId('rank-scale-here')).toBeVisible()
        await expect(page.getByText('#01 · canon peak')).toBeVisible()
      }
      await expect(page.getByTestId('vote-pair')).toBeVisible()
      await expect(page.getByTestId('season-thread')).toBeVisible()
      await expect(page.getByTestId('comment-thread')).toBeVisible()
      await expect(page.getByTestId('shield-badge').first()).toBeVisible()

      const wrapper = page.locator(`[data-show="${slug}"]`).first()
      await expect(wrapper).toBeVisible()
    })

    test('vote-up click cycles through lock and unlock', async ({ page }) => {
      await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      const up = page.getByTestId('vote-up')
      const down = page.getByTestId('vote-down')

      await up.click()

      // The click records an up-vote. The count reconciles to the
      // server's clean integer net (#64) but is shared across the
      // hermetic DB, so we assert the vote state + lock cycle
      // rather than a specific number.
      await expect(page.getByTestId('vote-pair')).toHaveAttribute(
        'data-vote-value',
        '1',
      )
      await expect(up).toBeDisabled()
      await expect(down).toBeDisabled()

      await page.waitForTimeout(900)
      await expect(up).toBeEnabled()
      await expect(down).toBeEnabled()
    })
  })
}

test.describe('survivor S20 — gold-standard reference', () => {
  const path = '/shows/survivor/season/heroes-villains'

  test('renders display_title accent, 6-tile stats, ep-strip, watch-list', async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    // display_title accent
    const accent = page.getByTestId('display-title-accent')
    await expect(accent).toBeVisible()
    await expect(accent).toHaveText('vs.')

    // stats strip — 6 populated tiles on S20
    const stats = page.getByTestId('stat-tile')
    await expect(stats).toHaveCount(6)

    // ep strip — 14 cells
    const epBars = page.getByTestId('ep-bar')
    await expect(epBars).toHaveCount(14)

    // watch-list — 4 cards
    const watch = page.getByTestId('watch-list-item')
    await expect(watch).toHaveCount(4)

    // TOC visible on desktop, 6 entries (all sections present)
    const tocLinks = page.getByTestId('toc-link')
    await expect(tocLinks).toHaveCount(6)

    // 33b bolt-on 3: current-progress dot on every row; the active
    // row (first by default) carries .active for the primary tint.
    await expect(tocLinks.first()).toHaveClass(/active/)
    expect(await page.locator('.toc-dot').count()).toBe(6)
  })
})

test.describe('survivor S28 Cagayan — display_title entity render (33b)', () => {
  const path = '/shows/survivor/season/cagayan'

  test('h1 renders a literal ampersand, not "&amp;"', async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    const h1 = page.getByTestId('season-h1')
    await expect(h1).toContainText('Brawn & Beauty')
    const h1Text = (await h1.textContent()) ?? ''
    expect(h1Text).not.toContain('&amp;')

    const accent = page.getByTestId('display-title-accent')
    await expect(accent).toHaveText('Brains')
  })
})

test.describe('survivor S1 — graceful collapse without deep editorial', () => {
  const path = '/shows/survivor/season/borneo'

  test('renders cleanly without watch-list or ep-strip', async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    await expect(page.getByTestId('season-hero')).toBeVisible()
    await expect(page.getByTestId('section-take')).toBeVisible()
    await expect(page.getByTestId('section-where')).toBeVisible()

    // No watch list, no ep-strip on this season.
    await expect(page.getByTestId('watch-list')).toHaveCount(0)
    await expect(page.getByTestId('ep-strip')).toHaveCount(0)
    await expect(page.getByTestId('section-watch')).toHaveCount(0)
  })
})

test.describe('mobile @ 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const url of seasonUrls) {
    const slug = url.show ?? ''
    const seasonSlug = url.seasonSlug ?? ''
    test(`season page mobile reflow: /shows/${slug}/season/${seasonSlug}`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('vote-pair')).toBeVisible()

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
