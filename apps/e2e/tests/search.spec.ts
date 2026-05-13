import { expect, test } from '@playwright/test'

// Phase 15 — search. Four cases: empty + three representative
// queries that exercise each hit type. Mobile reflow.

test.describe('/search', () => {
  test('empty /search renders the form + empty-state hint, no results', async ({
    page,
  }) => {
    const res = await page.goto('/search', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText(/Search/i)
    await expect(page.getByTestId('search-form')).toBeVisible()
    await expect(page.getByTestId('search-empty-state')).toBeVisible()
    await expect(page.getByTestId('search-results')).toHaveCount(0)
  })

  test('?q=survivor returns show + season hits', async ({ page }) => {
    const res = await page.goto('/search?q=survivor', {
      waitUntil: 'domcontentloaded',
    })
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('search-results')).toBeVisible()
    const showHits = page.locator('[data-hit-type="show"]')
    const seasonHits = page.locator('[data-hit-type="season"]')
    expect(await showHits.count()).toBeGreaterThan(0)
    expect(await seasonHits.count()).toBeGreaterThan(0)
  })

  test('?q=fiji returns season hits (location match)', async ({ page }) => {
    await page.goto('/search?q=fiji', { waitUntil: 'domcontentloaded' })
    const seasonHits = page.locator('[data-hit-type="season"]')
    expect(await seasonHits.count()).toBeGreaterThan(0)
  })

  test('?q=pillars returns theme hits (theme title/slug match)', async ({ page }) => {
    await page.goto('/search?q=pillars', { waitUntil: 'domcontentloaded' })
    const themeHits = page.locator('[data-hit-type="theme"]')
    expect(await themeHits.count()).toBeGreaterThan(0)
  })

  test('?q=zzz-no-such-thing renders the empty-results message', async ({ page }) => {
    await page.goto('/search?q=zzz-no-such-thing', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByTestId('search-empty-results')).toBeVisible()
  })

  test('mobile @ 375px viewport: no horizontal scroll, H1 visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/search?q=survivor', { waitUntil: 'domcontentloaded' })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('header search affordance', () => {
  test('the Search link in the header navigates to /search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const headerLink = page.getByTestId('site-header-search-link')
    await expect(headerLink).toBeVisible()
    await headerLink.click()
    await page.waitForURL(/\/search$/)
    await expect(page.getByTestId('search-form')).toBeVisible()
  })
})
