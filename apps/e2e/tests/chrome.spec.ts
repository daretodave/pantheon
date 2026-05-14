import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 19b — chrome contract.
//
//   - Exactly one <header> and one <footer> per page.
//   - Header carries the BrandMark + serif "tiered.tv" wordmark.
//   - Footer carries the BrandMark + serif "tiered.tv" wordmark + theme
//     toggle + italic promise. Footer does NOT contain "an experiment".
//   - Show routes render tinted chrome (data-tinted=true).
//   - Non-show routes render the default chrome (no data-tinted).
//   - Bounded routes wrap <main> in a .wrap container; show routes do
//     NOT (full-bleed). Wrap maxes at 1240px at large viewports.

const SHOW_PREFIX_RE = /^\/shows\/[^/]+(?:\/.*)?$/
const BOUNDED_PREFIX_RE = /^(?:\/|\/shows|\/themes(?:\/[^/]+)?|\/about|\/terms|\/privacy|\/sign-in|\/mod|\/u\/[^/]+)$/

function isShowRoute(path: string): boolean {
  return SHOW_PREFIX_RE.test(path) && path !== '/shows'
}

function isBoundedRoute(path: string): boolean {
  if (isShowRoute(path)) return false
  return BOUNDED_PREFIX_RE.test(path)
}

for (const url of canonicalUrls) {
  test.describe(`chrome: ${url.path}`, () => {
    test('renders exactly one header + one footer with brand lockup', async ({ page }) => {
      await page.goto(url.path, { waitUntil: 'domcontentloaded' })

      const headers = page.locator('header[data-testid=site-header]')
      await expect(headers).toHaveCount(1)
      const footers = page.locator('footer[data-testid=site-footer]')
      await expect(footers).toHaveCount(1)

      // BrandMark renders at minimum twice: once in header, once in footer.
      const brandMarks = page.locator('[data-testid=brand-mark]')
      const brandCount = await brandMarks.count()
      expect(brandCount).toBeGreaterThanOrEqual(2)

      await expect(page.locator('[data-testid=site-header-brand]')).toContainText('tiered.tv')
      await expect(page.locator('[data-testid=site-footer-brand]')).toContainText('tiered.tv')

      // Footer no longer contains the "an experiment" line.
      const footerText = (await footers.first().innerText()).toLowerCase()
      expect(footerText).not.toContain('an experiment')

      // Theme toggle still mounted.
      const toggle = page.locator('button[aria-label*="Switch to"]')
      await expect(toggle).toHaveCount(1)
    })

    test('tinting matches route family', async ({ page }) => {
      await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      const header = page.locator('[data-testid=site-header]')
      const footer = page.locator('[data-testid=site-footer]')
      if (isShowRoute(url.path)) {
        await expect(header).toHaveAttribute('data-tinted', 'true')
        await expect(footer).toHaveAttribute('data-tinted', 'true')
      } else {
        const headerTinted = await header.getAttribute('data-tinted')
        const footerTinted = await footer.getAttribute('data-tinted')
        expect(headerTinted).toBeNull()
        expect(footerTinted).toBeNull()
      }
    })

    test('page-width contract', async ({ page }) => {
      await page.setViewportSize({ width: 1600, height: 900 })
      await page.goto(url.path, { waitUntil: 'domcontentloaded' })

      if (isShowRoute(url.path)) {
        const mainInWrap = await page.locator('.wrap main#main').count()
        expect(mainInWrap).toBe(0)
      } else if (isBoundedRoute(url.path)) {
        const wrap = page.locator('.wrap').first()
        await expect(wrap).toBeVisible()
        const mainInWrap = await page.locator('.wrap main#main').count()
        expect(mainInWrap).toBeGreaterThanOrEqual(1)
        const box = await wrap.boundingBox()
        expect(box, 'wrap should have a bounding box').not.toBeNull()
        if (box) {
          expect(box.width).toBeLessThanOrEqual(1240 + 4)
        }
      }
    })
  })
}
