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

test.describe('/themes/[theme] detail (phase 19h shape)', () => {
  test('survivor-pillars: hero renders crumb, title, tagline, meta strip, tools', async ({
    page,
  }) => {
    const res = await page.goto('/themes/survivor-pillars', {
      waitUntil: 'domcontentloaded',
    })
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('list-hero')).toBeVisible()
    await expect(page.getByTestId('list-title')).toContainText(/Survivor/i)
    await expect(page.getByTestId('list-tagline')).toBeVisible()
    await expect(page.getByTestId('list-meta-entries')).toContainText(
      /entries|entry/,
    )
    await expect(page.getByTestId('list-meta-spans')).toContainText(
      /shows|show/,
    )
    await expect(page.getByTestId('list-shield')).toBeVisible()
  })

  test('crumb bullet-stack has one bullet per show in the theme', async ({
    page,
  }) => {
    await page.goto('/themes/survivor-pillars', {
      waitUntil: 'domcontentloaded',
    })
    const bullets = page.locator('[data-testid=list-hero] .bullet-stack .bullet')
    await expect(bullets).toHaveCount(1)
  })

  test('uses the narrow 1100px wrap', async ({ page }) => {
    await page.goto('/themes/survivor-pillars', {
      waitUntil: 'domcontentloaded',
    })
    await expect(
      page.locator('#main [data-testid=wrap]'),
    ).toHaveAttribute('data-width', 'narrow')
  })

  test('renders all four entries in rank order, linking to season pages', async ({
    page,
  }) => {
    await page.goto('/themes/survivor-pillars', {
      waitUntil: 'domcontentloaded',
    })
    const entries = page.getByTestId('list-entry')
    await expect(entries).toHaveCount(4)
    await expect(entries.nth(0)).toHaveAttribute('data-rank', '1')
    await expect(entries.nth(3)).toHaveAttribute('data-rank', '4')
    const firstHref = await entries.nth(0).locator('a').getAttribute('href')
    expect(firstHref).toMatch(/^\/shows\/survivor\/season\/[a-z0-9-]+$/)
  })

  test('Save list toggles aria-pressed + data-saved on click', async ({
    page,
  }) => {
    await page.goto('/themes/firsts', { waitUntil: 'domcontentloaded' })
    const save = page.getByTestId('list-save')
    await expect(save).toHaveAttribute('aria-pressed', 'false')
    await save.click()
    await expect(save).toHaveAttribute('aria-pressed', 'true')
    await expect(save).toHaveAttribute('data-saved', 'true')
  })

  test('emits ItemList JSON-LD with author + dateModified + correct count', async ({
    page,
  }) => {
    await page.goto('/themes/survivor-pillars', {
      waitUntil: 'domcontentloaded',
    })
    const ld = await page.locator('script#ld-theme').textContent()
    expect(ld).toBeTruthy()
    const parsed = JSON.parse(ld ?? '{}')
    expect(parsed['@type']).toBe('ItemList')
    expect(Array.isArray(parsed.itemListElement)).toBe(true)
    expect(parsed.itemListElement.length).toBe(4)
    expect(parsed.author?.name).toBeTruthy()
    expect(parsed.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('firsts: renders 2 entries (the shorter list)', async ({ page }) => {
    await page.goto('/themes/firsts', { waitUntil: 'domcontentloaded' })
    const entries = page.getByTestId('list-entry')
    await expect(entries).toHaveCount(2)
  })

  test('adjacent-lists section either shows links or is absent', async ({
    page,
  }) => {
    await page.goto('/themes/firsts', { waitUntil: 'domcontentloaded' })
    const sections = page.getByTestId('list-adjacent')
    const count = await sections.count()
    if (count > 0) {
      const links = page.getByTestId('list-adjacent-link')
      const linkCount = await links.count()
      expect(linkCount).toBeGreaterThanOrEqual(1)
      expect(linkCount).toBeLessThanOrEqual(2)
    }
  })

  test('mobile @ 375px viewport: no horizontal scroll on detail page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/themes/survivor-pillars', {
      waitUntil: 'domcontentloaded',
    })
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
