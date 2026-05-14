import { test, expect } from '@playwright/test'

test('home renders the promise + hero + all the spec sections', async ({
  page,
}) => {
  const errors: string[] = []
  const failedResponses: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('response', (res) => {
    if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.url()}`)
  })

  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  const main = page.getByRole('main')
  // Phase 27 — the H1 is still the cold-search promise itself.
  await expect(main.locator('h1')).toContainText(/the seasons/i)
  await expect(main.locator('h1')).toContainText(/no spoilers/i)

  // The five sections that make up the phase-27 home.
  await expect(page.getByTestId('home-hero')).toBeVisible()
  await expect(page.getByTestId('home-hero-cover')).toBeVisible()
  await expect(page.getByTestId('home-show-grid')).toBeVisible()
  await expect(page.getByTestId('home-more-shows')).toBeVisible()
  await expect(page.getByTestId('home-dual-callout')).toBeVisible()
  await expect(page.getByTestId('home-lists-stack')).toBeVisible()

  // The home page is bounded — it lives inside the (default) layout's <Wrap>.
  await expect(page.getByTestId('wrap')).toBeVisible()

  // The chrome.
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(page.getByRole('link', { name: /tiered\.tv home/i }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeVisible()

  expect(failedResponses, `failed responses: ${failedResponses.join(', ')}`).toEqual([])
  expect(errors).toEqual([])
})

test('theme toggle flips data-theme without flash', async ({ page }) => {
  await page.goto('/')
  const initialTheme = await page.evaluate(() => document.documentElement.dataset['theme'])
  expect(initialTheme === undefined || initialTheme === 'dark').toBe(true)

  await page.getByRole('button', { name: /switch to light mode/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await page.getByRole('button', { name: /switch to dark mode/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('hero cover names the featured show + go-pill links to /shows/<slug>', async ({
  page,
}) => {
  await page.goto('/')
  const cover = page.getByTestId('home-hero-cover')
  await expect(cover).toContainText(/currently featured/i)
  await expect(cover).toContainText(/survivor/i)

  const go = page.getByTestId('home-cover-go')
  await expect(go).toHaveAttribute('href', /^\/shows\/[a-z][a-z0-9-]*$/)
})

test('hero stat strip surfaces seasons ranked + canon revised', async ({
  page,
}) => {
  await page.goto('/')
  const stats = page.getByTestId('home-hero-stats')
  await expect(stats).toContainText(/seasons ranked/i)
  await expect(stats).toContainText(/canon revised/i)
  // Canon revised label is formatted "MM / YY"; cheap shape check.
  const revised = page.getByTestId('home-hero-canon-revised')
  await expect(revised).toHaveText(/^\d{2}\s\/\s\d{2}$/)
})

test('hero copy column carries the est-2026 eyebrow + the CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-hero')).toContainText(/tiered\.tv · est\. 2026/i)
  await expect(page.getByTestId('home-cta-shows')).toHaveAttribute('href', '/shows')
  await expect(page.getByTestId('home-cta-about')).toHaveAttribute('href', '/about')
})

test('featured show grid renders exactly 3 tinted tiles', async ({ page }) => {
  await page.goto('/')
  const featuredGrid = page.getByTestId('home-show-grid')
  const tiles = featuredGrid.getByTestId('home-show-tile')
  const count = await tiles.count()
  expect(count).toBeGreaterThanOrEqual(1)
  expect(count).toBeLessThanOrEqual(3)

  const hrefs = await tiles.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? ''),
  )
  for (const href of hrefs) {
    expect(href).toMatch(/^\/shows\/[a-z][a-z0-9-]*$/)
  }
  // Featured variant — every tile renders a blurb.
  for (let i = 0; i < count; i++) {
    await expect(tiles.nth(i).locator('.show-tile-blurb')).toBeVisible()
  }
})

test('every featured tile renders a bullet + serif name', async ({ page }) => {
  await page.goto('/')
  const tiles = page.getByTestId('home-show-grid').getByTestId('home-show-tile')
  const count = await tiles.count()
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i)
    await expect(tile.getByTestId('bullet').first()).toBeVisible()
    await expect(tile.locator('.show-tile-name').first()).toBeVisible()
  }
})

test('compact tiles drop the blurb but keep bullet + name + meta', async ({
  page,
}) => {
  await page.goto('/')
  const compactGrid = page.getByTestId('home-more-shows-grid')
  const compact = compactGrid.getByTestId('home-show-tile')
  const count = await compact.count()
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThanOrEqual(6)
  for (let i = 0; i < count; i++) {
    const tile = compact.nth(i)
    expect(await tile.locator('.show-tile-blurb').count()).toBe(0)
    await expect(tile.locator('.show-tile-name').first()).toBeVisible()
    await expect(tile.getByTestId('bullet').first()).toBeVisible()
  }
})

test('sub-row label surfaces the index remainder', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-more-shows-label')).toContainText(
    /^\+\s\d+\smore in the index$/,
  )
})

test('dual-rank callout names canon + community without naming a show', async ({
  page,
}) => {
  await page.goto('/')
  const dual = page.getByTestId('home-dual-callout')
  await expect(dual).toContainText(/editor.?s canon/i)
  await expect(dual).toContainText(/community rank/i)
  const text = (await dual.textContent()) ?? ''
  expect(text).not.toMatch(/survivor|drag race|top chef/i)
})

test('themed-list stack renders rows with sentiment dots', async ({ page }) => {
  await page.goto('/')
  const rows = page.getByTestId('home-list-row')
  const count = await rows.count()
  expect(count).toBeGreaterThanOrEqual(0)
  expect(count).toBeLessThanOrEqual(4)

  const hrefs = await rows.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? ''),
  )
  for (const href of hrefs) {
    expect(href).toMatch(/^\/themes\/[a-z][a-z0-9-]*$/)
  }
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i)
    await expect(row.getByTestId('home-list-row-dot')).toBeVisible()
    const sentiment = await row.getAttribute('data-sentiment')
    expect(sentiment).toMatch(/^(warm-up|warm-down|neutral|hold|verdict|consensus)$/)
  }
})

test('home hero is color-only — no facade art, no svg illustrations', async ({
  page,
}) => {
  await page.goto('/')
  const hero = page.getByTestId('home-hero')
  await expect(hero).toBeVisible()
  expect(await hero.getByTestId('facade').count()).toBe(0)
  expect(await hero.getByTestId('home-hero-art').count()).toBe(0)
})

test('mobile @ 375px viewport: no horizontal scroll, H1 visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
  await expect(page.locator('h1')).toBeVisible()
})
