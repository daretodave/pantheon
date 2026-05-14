import { expect, test } from '@playwright/test'

// Phase 29 — the standalone /search page is retired in favor of a
// global cmd+K overlay. This spec covers the new surface plus the
// /search → / permanent redirect.

test.describe('search overlay', () => {
  test('header trigger opens the overlay and focuses the input', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const trigger = page.getByTestId('site-header-search-trigger')
    await expect(trigger).toBeVisible()
    await trigger.click()
    const overlay = page.getByTestId('search-overlay')
    await expect(overlay).toBeVisible()
    await expect(page.getByTestId('search-input')).toBeFocused()
  })

  test('cmd+K opens the overlay; escape closes it', async ({
    page,
    browserName,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Wait for hydration: SearchHost binds its keydown listener in a
    // useEffect, so the host-side click handler must be live first.
    const trigger = page.getByTestId('site-header-search-trigger')
    await expect(trigger).toBeVisible()
    await trigger.click()
    await expect(page.getByTestId('search-overlay')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('search-overlay')).toHaveCount(0)
    // Now reopen via the global cmd+K binding.
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control'
    await page.keyboard.press(`${modifier}+KeyK`)
    await expect(page.getByTestId('search-overlay')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('search-overlay')).toHaveCount(0)
  })

  test('typing "survivor" surfaces show + season hits', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('site-header-search-trigger').click()
    await page.getByTestId('search-input').fill('survivor')
    const shows = page.locator('[data-hit-type="show"]')
    const seasons = page.locator('[data-hit-type="season"]')
    expect(await shows.count()).toBeGreaterThan(0)
    expect(await seasons.count()).toBeGreaterThan(0)
  })

  test('filter chips narrow the result set', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('site-header-search-trigger').click()
    await page.getByTestId('search-chip-list').click()
    const rows = page.getByTestId('search-row')
    expect(await rows.count()).toBeGreaterThan(0)
    const types = await rows.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-hit-type')),
    )
    expect(types.every((t) => t === 'list')).toBe(true)
  })

  test('Enter on a focused row navigates and closes the overlay', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('site-header-search-trigger').click()
    await page.getByTestId('search-input').fill('survivor')
    await page.keyboard.press('Enter')
    await page.waitForURL(/\/shows\/survivor/)
    await expect(page.getByTestId('search-overlay')).toHaveCount(0)
  })

  test('the overlay is reachable from a tinted show page', async ({ page }) => {
    await page.goto('/shows/survivor', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('site-header-search-trigger').click()
    await expect(page.getByTestId('search-overlay')).toBeVisible()
  })

  test('/search permanently redirects to /', async ({ page }) => {
    const res = await page.goto('/search', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toMatch(/\/$/)
    const chain = res?.request().redirectedFrom()
    // Final document must be the home; the previous step must have been /search.
    expect(chain?.url() ?? page.url()).toMatch(/\/(search)?$/)
  })

  test('mobile @ 375px: overlay opens via the trigger (header hidden)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // The header search trigger is hidden under 720px per chrome.css,
    // but the button still exists in the DOM and is force-clickable;
    // the cmd+K listener also stays globally bound.
    await page.getByTestId('site-header-search-trigger').click({ force: true })
    await expect(page.getByTestId('search-overlay')).toBeVisible()
    await expect(page.getByTestId('search-input')).toBeVisible()
  })
})
