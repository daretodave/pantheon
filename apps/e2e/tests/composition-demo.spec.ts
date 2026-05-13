import { expect, test } from '@playwright/test'

// /internal/composition-demo is gated by INTERNAL_DEMOS=1 (set on the
// e2e webServer env). In prod the route 404s. Not part of the
// public canonical-urls fixture — internal harness only.

const PATH = '/internal/composition-demo'

async function expectDemoLoads(page: import('@playwright/test').Page) {
  const response = await page.goto(PATH, { waitUntil: 'domcontentloaded' })
  expect(response?.status(), `status on ${PATH}`).toBe(200)
  await expect(page.locator('h1').first()).toContainText(/composition primitives/i)
}

test.describe('desktop @ default viewport', () => {
  test(`composition-demo: ${PATH} renders all three composition surfaces`, async ({ page }) => {
    await expectDemoLoads(page)

    await expect(page.getByTestId('demo-home-tile-screen')).toBeVisible()
    await expect(page.getByTestId('demo-show-home-screen')).toBeVisible()
    await expect(page.getByTestId('demo-season-page-screen')).toBeVisible()

    await expect(page.getByTestId('show-hero')).toBeVisible()
    await expect(page.getByTestId('show-split')).toBeVisible()
    await expect(page.getByTestId('season-grid')).toBeVisible()
    await expect(page.getByTestId('season-shell')).toBeVisible()
    await expect(page.getByTestId('season-head')).toBeVisible()

    await expect(page.getByTestId('demo-show-tile')).toBeVisible()
    await expect(page.getByTestId('split-btn-canon')).toBeVisible()
    await expect(page.getByTestId('split-btn-community')).toBeVisible()

    const palettes = page.getByTestId('palette-scope')
    expect(await palettes.count()).toBeGreaterThanOrEqual(1)
    const first = palettes.first()
    expect(await first.getAttribute('data-show')).toBe('survivor')

    await expect(page.getByTestId('rank-shift-pill').first()).toBeVisible()
    await expect(page.getByTestId('shield-badge').first()).toBeVisible()
  })
})

test.describe('mobile @ 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test(`composition-demo: ${PATH} reflows cleanly at 375px`, async ({ page }) => {
    await expectDemoLoads(page)
    await expect(page.getByTestId('show-hero')).toBeVisible()
    await expect(page.getByTestId('show-split')).toBeVisible()
    await expect(page.getByTestId('season-shell')).toBeVisible()

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(
      overflow.scrollWidth - overflow.clientWidth,
      `horizontal overflow on ${PATH}: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
    ).toBeLessThanOrEqual(1)
  })
})
