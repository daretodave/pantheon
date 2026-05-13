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
  // Phase 16 — the H1 is the cold-search promise itself.
  await expect(main.locator('h1')).toContainText(/the seasons/i)
  await expect(main.locator('h1')).toContainText(/no spoilers/i)

  // The three home regions.
  await expect(page.getByTestId('home-hero')).toBeVisible()
  await expect(page.getByTestId('home-show-grid')).toBeVisible()
  await expect(page.getByTestId('home-list-grid')).toBeVisible()

  // The chrome.
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(page.getByRole('link', { name: /pantheon home/i }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeVisible()

  expect(failedResponses, `failed responses: ${failedResponses.join(', ')}`).toEqual([])
  expect(errors).toEqual([])
})

test('theme toggle flips data-theme without flash', async ({ page }) => {
  await page.goto('/')
  // Default: dark (no data-theme set, tokens default at :root).
  const initialTheme = await page.evaluate(() => document.documentElement.dataset['theme'])
  expect(initialTheme === undefined || initialTheme === 'dark').toBe(true)

  await page.getByRole('button', { name: /switch to light mode/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await page.getByRole('button', { name: /switch to dark mode/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('hero eyebrow names the featured show + CTAs link', async ({ page }) => {
  await page.goto('/')
  const eyebrow = page.getByTestId('home-hero-eyebrow')
  await expect(eyebrow).toContainText(/currently featured/i)
  await expect(page.getByTestId('home-cta-shows')).toHaveAttribute('href', '/shows')
  await expect(page.getByTestId('home-cta-about')).toHaveAttribute('href', '/about')
})

test('show grid renders one tile per shipped show, capped at 5', async ({ page }) => {
  await page.goto('/')
  const tiles = page.getByTestId('home-show-tile')
  const count = await tiles.count()
  expect(count).toBeGreaterThanOrEqual(1)
  expect(count).toBeLessThanOrEqual(5)

  // Every tile links to /shows/<slug>.
  const hrefs = await tiles.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? ''),
  )
  for (const href of hrefs) {
    expect(href).toMatch(/^\/shows\/[a-z][a-z0-9-]*$/)
  }
})

test('list grid renders one tile per themed list, capped at 5', async ({ page }) => {
  await page.goto('/')
  const tiles = page.getByTestId('home-list-tile')
  const count = await tiles.count()
  expect(count).toBeGreaterThanOrEqual(1)
  expect(count).toBeLessThanOrEqual(5)

  const hrefs = await tiles.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? ''),
  )
  for (const href of hrefs) {
    expect(href).toMatch(/^\/themes\/[a-z][a-z0-9-]*$/)
  }
})

test('home hero is copy-only and contains no per-show facade art', async ({ page }) => {
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
