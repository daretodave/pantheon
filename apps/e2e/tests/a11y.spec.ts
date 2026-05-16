import { test } from '@playwright/test'
import { runA11yScan } from '../src/fixtures/a11y'

// Phase 18 — 10-surface a11y matrix at WCAG 2.1 AA critical+serious.
// Desktop: 7 canonical-path pages. Mobile (375x800): the 3 most
// load-bearing pages (home + show home + season page).

const DESKTOP_PAGES = [
  '/',
  '/shows',
  '/shows/survivor',
  '/shows/survivor?view=community',
  '/shows/survivor/season/borneo',
  '/themes',
  '/about',
] as const

const MOBILE_PAGES = [
  '/',
  '/shows/survivor',
  '/shows/survivor/season/borneo',
] as const

const MOBILE_VIEWPORT = { width: 375, height: 800 } as const

for (const url of DESKTOP_PAGES) {
  test(`a11y desktop: ${url}`, async ({ page }) => {
    await runA11yScan({ page, url })
  })
}

for (const url of MOBILE_PAGES) {
  test(`a11y mobile 375px: ${url}`, async ({ page }) => {
    await runA11yScan({ page, url, viewport: MOBILE_VIEWPORT })
  })
}
