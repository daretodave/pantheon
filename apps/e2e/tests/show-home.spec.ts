import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 6 lights up /shows/[show] as the canonical show-family
// surface. Every seeded show gets walked here.

const showHomeUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]')

const EXPECTED_PALETTES: Record<string, { primary: string; ink: string; paper: string }> = {
  survivor: { primary: '#D55E36', ink: '#EFE2BD', paper: '#0E2A2A' },
  'top-chef': { primary: '#B86A2E', ink: '#ECDFC6', paper: '#1B2418' },
  dragrace: { primary: '#E64B86', ink: '#F2E1D2', paper: '#2D0B2A' },
}

for (const url of showHomeUrls) {
  const slug = url.show ?? ''
  test.describe(`show home: ${slug}`, () => {
    test(`renders hero + split + season region + palette swap + bullet`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `status for ${url.path}`).toBe(200)

      await expect(page.getByTestId('show-home-screen')).toBeVisible()
      await expect(page.getByTestId('show-hero')).toBeVisible()
      await expect(page.getByTestId('bullet').first()).toBeVisible()
      await expect(page.getByTestId('show-split')).toBeVisible()
      await expect(page.getByTestId('shield-badge').first()).toBeVisible()

      const facadeCount = await page.getByTestId('facade').count()
      expect(facadeCount).toBe(0)
      const showFacadeArtCount = await page.getByTestId('show-facade-art').count()
      expect(showFacadeArtCount).toBe(0)

      const canon = page.getByTestId('split-btn-canon')
      const community = page.getByTestId('split-btn-community')
      await expect(canon).toHaveAttribute('href', `/shows/${slug}/canon`)
      await expect(community).toHaveAttribute('href', `/shows/${slug}/community`)

      const wrapper = page.locator(`[data-show="${slug}"]`).first()
      await expect(wrapper).toBeVisible()

      const expected = EXPECTED_PALETTES[slug]
      if (expected) {
        const cssVars = await wrapper.evaluate((el) => {
          const cs = getComputedStyle(el as HTMLElement)
          return {
            primary: cs.getPropertyValue('--show-primary').trim(),
            ink: cs.getPropertyValue('--show-ink').trim(),
            paper: cs.getPropertyValue('--show-paper').trim(),
          }
        })
        expect(cssVars.primary.toLowerCase()).toBe(expected.primary.toLowerCase())
        expect(cssVars.ink.toLowerCase()).toBe(expected.ink.toLowerCase())
        expect(cssVars.paper.toLowerCase()).toBe(expected.paper.toLowerCase())
      }
    })
  })
}

test.describe('mobile @ 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const url of showHomeUrls) {
    const slug = url.show ?? ''
    test(`show home mobile reflow: ${slug}`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('show-hero')).toBeVisible()
      await expect(page.getByTestId('show-split')).toBeVisible()

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(
        overflow.scrollWidth - overflow.clientWidth,
        `horizontal overflow on ${url.path}: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(1)
    })
  }
})
