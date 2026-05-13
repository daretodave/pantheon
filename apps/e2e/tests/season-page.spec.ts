import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 9 wires the working VotePair interaction. The walker
// exercises one click per seeded season and asserts the
// optimistic-update + 800ms lock contract.

const seasonUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]/season/[n]')

for (const url of seasonUrls) {
  const slug = url.show ?? ''
  const num = url.season ?? 0
  test.describe(`season page: /shows/${slug}/season/${num}`, () => {
    test('renders SeasonShell + working vote pair + comment thread shell', async ({
      page,
    }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      await expect(page.getByTestId('season-page-screen')).toBeVisible()
      await expect(page.getByTestId('season-shell')).toBeVisible()
      await expect(page.getByTestId('season-head')).toBeVisible()
      await expect(page.getByTestId('season-body')).toBeVisible()
      await expect(page.getByTestId('season-lede')).toBeVisible()
      await expect(page.getByTestId('season-rank-row')).toBeVisible()
      await expect(page.getByTestId('rank-tag').first()).toBeVisible()
      await expect(page.getByTestId('vote-pair')).toBeVisible()
      await expect(page.getByTestId('comment-thread')).toBeVisible()
      await expect(page.getByTestId('shield-badge').first()).toBeVisible()

      const wrapper = page.locator(`[data-show="${slug}"]`).first()
      await expect(wrapper).toBeVisible()
    })

    test('vote-up click cycles through lock and unlock', async ({ page }) => {
      await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      const up = page.getByTestId('vote-up')
      const down = page.getByTestId('vote-down')
      const count = page.getByTestId('vote-count')

      const before = Number((await count.textContent()) ?? '0')
      await up.click()

      await expect(count).toHaveText(String(before + 1))
      await expect(up).toBeDisabled()
      await expect(down).toBeDisabled()

      // Lock window is 800ms. Wait past it and assert re-enable.
      await page.waitForTimeout(900)
      await expect(up).toBeEnabled()
      await expect(down).toBeEnabled()
    })
  })
}

test.describe('mobile @ 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const url of seasonUrls) {
    const slug = url.show ?? ''
    const num = url.season ?? 0
    test(`season page mobile reflow: /shows/${slug}/season/${num}`, async ({ page }) => {
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
