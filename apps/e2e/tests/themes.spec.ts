import { expect, test } from '@playwright/test'

// Phase 14 + 19g — coverage for the themed-list family.
// /themes is the cross-canon index; /themes/[theme] is the detail.

test.describe('/themes index (phase 19g shape)', () => {
  test('renders the lists hero with three stats', async ({ page }) => {
    const res = await page.goto('/themes', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText(/Themed lists/i)
    const stats = page.getByTestId('lists-hero-stats')
    await expect(stats).toBeVisible()
    await expect(page.getByTestId('lists-stat-total')).toContainText(/\d+/)
    await expect(page.getByTestId('lists-stat-shows')).toContainText(/\d+/)
    await expect(page.getByTestId('lists-stat-revised')).toContainText(
      /\d{4}/,
    )
  })

  test('filter bar has 5 chips with the right data-filter attrs', async ({
    page,
  }) => {
    await page.goto('/themes', { waitUntil: 'domcontentloaded' })
    const chips = page.locator('[data-testid=lists-filter-bar] .chip')
    await expect(chips).toHaveCount(5)
    for (const filter of ['all', 'tone', 'craft', 'era', 'single']) {
      await expect(page.getByTestId(`lists-chip-${filter}`)).toBeVisible()
    }
  })

  test('All-Lists section renders at least one group, each row has data-slug', async ({
    page,
  }) => {
    await page.goto('/themes', { waitUntil: 'domcontentloaded' })
    const groups = page.getByTestId('lists-group')
    expect(await groups.count()).toBeGreaterThanOrEqual(1)
    const rows = page.getByTestId('lists-row')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThanOrEqual(2)
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i)).toHaveAttribute('data-slug', /.+/)
    }
  })

  test('featured row renders 0–3 cards (does not pad)', async ({ page }) => {
    await page.goto('/themes', { waitUntil: 'domcontentloaded' })
    const cards = page.getByTestId('lists-featured-card')
    const count = await cards.count()
    expect(count).toBeLessThanOrEqual(3)
  })

  test('clicking a category chip flips data-active-filter and hides off-filter groups', async ({
    page,
  }) => {
    await page.goto('/themes', { waitUntil: 'domcontentloaded' })
    const scope = page.getByTestId('lists-filter-scope')
    await expect(scope).toHaveAttribute('data-active-filter', 'all')

    // Pick a category that has at least one group on the page.
    const groups = page.getByTestId('lists-group')
    const first = groups.first()
    const category = await first.getAttribute('data-category')
    expect(category).toBeTruthy()

    if (category) {
      await page.getByTestId(`lists-chip-${category}`).click()
      await expect(scope).toHaveAttribute('data-active-filter', category)

      // Off-filter groups should be hidden.
      const otherGroups = page.locator(
        `[data-testid=lists-group]:not([data-category="${category}"])`,
      )
      const otherCount = await otherGroups.count()
      for (let i = 0; i < otherCount; i++) {
        await expect(otherGroups.nth(i)).toBeHidden()
      }
    }
  })

  test('emits CollectionPage JSON-LD with numberOfItems', async ({ page }) => {
    await page.goto('/themes', { waitUntil: 'domcontentloaded' })
    const ld = await page.locator('script#ld-themes-index').textContent()
    expect(ld).toBeTruthy()
    const parsed = JSON.parse(ld ?? '{}')
    expect(parsed['@type']).toBe('CollectionPage')
    expect(typeof parsed.numberOfItems).toBe('number')
    expect(parsed.numberOfItems).toBeGreaterThanOrEqual(1)
  })

  test('mobile @ 375px viewport: no horizontal scroll, H1 visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/themes', { waitUntil: 'domcontentloaded' })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('/themes/[theme] detail', () => {
  test('survivor-pillars: renders all four entries in rank order with season links', async ({
    page,
  }) => {
    const res = await page.goto('/themes/survivor-pillars', {
      waitUntil: 'domcontentloaded',
    })
    expect(res?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText(/Survivor/i)

    const entries = page.locator('ol > li')
    await expect(entries).toHaveCount(4)
    await expect(entries.nth(0)).toContainText('S1')
  })

  test('survivor-pillars: emits ItemList JSON-LD whose count matches entries', async ({
    page,
  }) => {
    await page.goto('/themes/survivor-pillars', { waitUntil: 'domcontentloaded' })
    const ld = await page.locator('script#ld-theme').textContent()
    expect(ld).toBeTruthy()
    const parsed = JSON.parse(ld ?? '{}')
    expect(parsed['@type']).toBe('ItemList')
    expect(Array.isArray(parsed.itemListElement)).toBe(true)
    expect(parsed.itemListElement.length).toBe(4)
  })

  test('firsts: renders 2 entries (the shorter list)', async ({ page }) => {
    await page.goto('/themes/firsts', { waitUntil: 'domcontentloaded' })
    const entries = page.locator('ol > li')
    await expect(entries).toHaveCount(2)
  })

  test('mobile @ 375px viewport: no horizontal scroll on detail page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/themes/survivor-pillars', { waitUntil: 'domcontentloaded' })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('show page → themes cross-link retrofit', () => {
  test('survivor show page surfaces the Featured-in-themes block', async ({ page }) => {
    await page.goto('/shows/survivor', { waitUntil: 'domcontentloaded' })
    const featured = page.getByTestId('featured-themes')
    await expect(featured).toBeVisible()
    const links = page.getByTestId('featured-theme-link')
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('top-chef show page does NOT surface the block (no themes reference it)', async ({
    page,
  }) => {
    await page.goto('/shows/top-chef', { waitUntil: 'domcontentloaded' })
    const featured = page.getByTestId('featured-themes')
    await expect(featured).toHaveCount(0)
  })
})
