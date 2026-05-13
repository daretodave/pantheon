import { test, expect } from '@playwright/test'

test('home renders the promise + hero + grids', async ({ page }) => {
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
  // Phase 19e — the H1 is still the cold-search promise itself.
  await expect(main.locator('h1')).toContainText(/the seasons/i)
  await expect(main.locator('h1')).toContainText(/no spoilers/i)

  // The hero shell + the two grids.
  await expect(page.getByTestId('home-hero')).toBeVisible()
  await expect(page.getByTestId('home-hero-cover')).toBeVisible()
  await expect(page.getByTestId('home-show-grid')).toBeVisible()
  await expect(page.getByTestId('home-list-grid')).toBeVisible()

  // The home page is bounded — it lives inside the (default)
  // layout's <Wrap>.
  await expect(page.getByTestId('wrap')).toBeVisible()

  // The chrome.
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(page.getByRole('link', { name: /pantheon home/i }).first()).toBeVisible()
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

test('hero copy column carries the est-2026 eyebrow + the CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-hero')).toContainText(/pantheon · est\. 2026/i)
  await expect(page.getByTestId('home-cta-shows')).toHaveAttribute('href', '/shows')
  await expect(page.getByTestId('home-cta-about')).toHaveAttribute('href', '/about')
})

test('show grid renders one tile per shipped show, capped at 3', async ({ page }) => {
  await page.goto('/')
  const tiles = page.getByTestId('home-show-tile')
  const count = await tiles.count()
  expect(count).toBeGreaterThanOrEqual(1)
  expect(count).toBeLessThanOrEqual(3)

  const hrefs = await tiles.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? ''),
  )
  for (const href of hrefs) {
    expect(href).toMatch(/^\/shows\/[a-z][a-z0-9-]*$/)
  }
})

test('every show tile renders a bullet + serif name', async ({ page }) => {
  await page.goto('/')
  const tiles = page.getByTestId('home-show-tile')
  const count = await tiles.count()
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i)
    await expect(tile.getByTestId('bullet').first()).toBeVisible()
    await expect(tile.locator('.show-tile-name').first()).toBeVisible()
  }
})

test('list grid renders one tile per themed list, capped at 3', async ({ page }) => {
  await page.goto('/')
  const tiles = page.getByTestId('home-list-tile')
  const count = await tiles.count()
  expect(count).toBeGreaterThanOrEqual(0)
  expect(count).toBeLessThanOrEqual(3)

  const hrefs = await tiles.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? ''),
  )
  for (const href of hrefs) {
    expect(href).toMatch(/^\/themes\/[a-z][a-z0-9-]*$/)
  }
})

test('every list tile renders a sentiment dot', async ({ page }) => {
  await page.goto('/')
  const tiles = page.getByTestId('home-list-tile')
  const count = await tiles.count()
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i)
    await expect(tile.getByTestId('home-list-tile-dot')).toBeVisible()
    const sentiment = await tile.getAttribute('data-sentiment')
    expect(sentiment).toMatch(/^(warm-up|warm-down|neutral|hold|verdict|consensus)$/)
  }
})

test('home hero is color-only — no facade art, no svg illustrations', async ({ page }) => {
  await page.goto('/')
  const hero = page.getByTestId('home-hero')
  await expect(hero).toBeVisible()
  expect(await hero.getByTestId('facade').count()).toBe(0)
  expect(await hero.getByTestId('home-hero-art').count()).toBe(0)
})

test('mobile @ 375px viewport: no horizontal scroll, H1 visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
  await expect(page.locator('h1')).toBeVisible()
})
