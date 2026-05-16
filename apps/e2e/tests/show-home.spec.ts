import { expect, test } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

// Phase 33: /shows/[show] is the consolidated ranking surface — hero
// + shifts + the ranking (sticky Editor's Canon / Community tabs,
// both panes SSR'd) + themed lists. The standalone /canon +
// /community routes 308 here (see redirects.spec.ts).

const showHomeUrls = canonicalUrls.filter((u) => u.pattern === '/shows/[show]')

const EXPECTED_PALETTES: Record<string, { primary: string; ink: string; paper: string }> = {
  survivor: { primary: '#D55E36', ink: '#EFE2BD', paper: '#0E2A2A' },
  'top-chef': { primary: '#B86A2E', ink: '#ECDFC6', paper: '#1B2418' },
  dragrace: { primary: '#E64B86', ink: '#F2E1D2', paper: '#2D0B2A' },
}

for (const url of showHomeUrls) {
  const slug = url.show ?? ''
  test.describe(`show page: ${slug}`, () => {
    test(`renders hero + shifts + ranking (both panes SSR'd) + palette`, async ({
      page,
    }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `status for ${url.path}`).toBe(200)

      await expect(page.getByTestId('show-home-screen')).toBeVisible()
      await expect(page.getByTestId('show-hero')).toBeVisible()
      await expect(page.getByTestId('show-hero-cover')).toBeVisible()
      await expect(page.getByTestId('show-hero-stats')).toBeVisible()
      await expect(page.getByTestId('bullet').first()).toBeVisible()
      await expect(page.getByTestId('shifts-row')).toBeVisible()
      await expect(page.getByTestId('shifts-empty')).toBeVisible()
      await expect(page.getByTestId('shield-badge').first()).toBeVisible()

      // The consolidated ranking: root seeded canon (default view),
      // intro lede, sticky tabs, and BOTH panes present in the DOM
      // (community is CSS-hidden until the tab flips — SEO-safe).
      const ranking = page.getByTestId('show-ranking')
      await expect(ranking).toBeVisible()
      expect(await ranking.getAttribute('data-view')).toBe('canon')
      await expect(page.getByTestId('ranking-intro')).toBeVisible()
      await expect(page.getByTestId('canon-tabs')).toBeVisible()
      await expect(page.getByTestId('canon-view-pane')).toBeVisible()
      expect(await page.getByTestId('community-view-pane').count()).toBe(1)

      // The split is gone; the facade was never here.
      expect(await page.getByTestId('show-split').count()).toBe(0)
      expect(await page.getByTestId('show-facade-art').count()).toBe(0)
      expect(await page.getByTestId('facade').count()).toBe(0)

      const wordmark = page.locator('.wordmark').first()
      await expect(wordmark).toBeVisible()

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

test.describe('same-page tab toggle persists URL state (no navigation)', () => {
  test('Community tab flips data-view + writes ?view=community in place', async ({
    page,
  }) => {
    await page.goto('/shows/survivor', { waitUntil: 'domcontentloaded' })
    const ranking = page.getByTestId('show-ranking')
    expect(await ranking.getAttribute('data-view')).toBe('canon')

    await page.getByTestId('canon-tab-community').click()
    expect(await ranking.getAttribute('data-view')).toBe('community')
    await expect(page).toHaveURL(/\/shows\/survivor\?view=community#community$/)
    await expect(page.getByTestId('community-view-pane')).toBeVisible()

    await page.getByTestId('canon-tab-canon').click()
    expect(await ranking.getAttribute('data-view')).toBe('canon')
    await expect(page).toHaveURL(/\/shows\/survivor(#canon)?$/)
    await expect(page.getByTestId('canon-view-pane')).toBeVisible()
  })

  test('?view=community deep-link seeds the community pane server-side', async ({
    page,
  }) => {
    await page.goto('/shows/survivor?view=community', {
      waitUntil: 'domcontentloaded',
    })
    const ranking = page.getByTestId('show-ranking')
    expect(await ranking.getAttribute('data-view')).toBe('community')
    await expect(page.getByTestId('community-view-pane')).toBeVisible()
  })
})

test.describe('era toolbar (33b)', () => {
  test('Survivor canon pane: All preselected + era chips filter entries', async ({
    page,
  }) => {
    await page.goto('/shows/survivor', { waitUntil: 'domcontentloaded' })

    const toolbar = page.getByTestId('canon-era-toolbar')
    await expect(toolbar).toBeVisible()

    const all = page.getByTestId('era-chip-all')
    await expect(all).toHaveAttribute('aria-selected', 'true')
    await expect(all).toHaveText(/All \d+/)

    // Survivor authors 5 era_bands → ≥1 era chip beyond All.
    const eraChips = toolbar.locator('.cp-chip:not([data-filter=all])')
    expect(await eraChips.count()).toBeGreaterThanOrEqual(1)

    const firstEra = eraChips.first()
    const eraKey = await firstEra.getAttribute('data-filter')
    await firstEra.click()
    await expect(firstEra).toHaveAttribute('aria-selected', 'true')
    await expect(all).toHaveAttribute('aria-selected', 'false')

    // CSS-toggle discipline: non-matching entries carry data-era-off,
    // none are removed from the DOM (SEO-safe).
    const offCount = await page
      .locator('[data-view-pane=canon] [data-era-off=true]')
      .count()
    expect(offCount).toBeGreaterThan(0)
    const matching = page.locator(
      `[data-view-pane=canon] [data-era="${eraKey}"]`,
    )
    expect(await matching.count()).toBeGreaterThan(0)
    for (const el of await matching.all()) {
      expect(await el.getAttribute('data-era-off')).toBeNull()
    }

    // Keyboard-reachable, role=tab, visible focus ring (a11y — chip
    // sizing stays locked to Survivor.html per the visual law).
    await firstEra.focus()
    await expect(firstEra).toBeFocused()
    await expect(firstEra).toHaveAttribute('role', 'tab')

    await all.click()
    await expect(all).toHaveAttribute('aria-selected', 'true')
    expect(
      await page.locator('[data-view-pane=canon] [data-era-off=true]').count(),
    ).toBe(0)
  })

  test('toolbar consumes era_bands generically on a second show', async ({
    page,
  }) => {
    // The toolbar reads canon.era_bands generically — no per-show page
    // code. dragrace authors its own bands; All stays preselected.
    await page.goto('/shows/dragrace', { waitUntil: 'domcontentloaded' })
    const toolbar = page.getByTestId('canon-era-toolbar')
    await expect(toolbar).toBeVisible()
    await expect(page.getByTestId('era-chip-all')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      await toolbar.locator('.cp-chip:not([data-filter=all])').count(),
    ).toBeGreaterThanOrEqual(1)
  })
})

test.describe('mobile @ 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const url of showHomeUrls) {
    const slug = url.show ?? ''
    test(`show page mobile reflow: ${slug}`, async ({ page }) => {
      const response = await page.goto(url.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('show-hero')).toBeVisible()
      await expect(page.getByTestId('show-ranking')).toBeVisible()

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
