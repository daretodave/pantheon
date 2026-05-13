import { expect, test } from '@playwright/test'

// Phase 5 shipped facade.svg + sigil.svg + 3 ornaments for the three
// pioneer shows. This spec verifies:
//   (a) every static asset returns 200 and is a real SVG (XML or <svg>
//       prelude).
//   (b) the facade carries the show's primary color in its source
//       (so the brander's palette claim is testable from the artifact).
//   (c) the show-home page sets data-show=<slug> on the wrapper.
// The smoke walker auto-covers /shows/<slug> for any newly-seeded show
// (canonical-urls.ts walks content/), so this spec only adds the
// asset-level + palette-attribution checks.

type Pioneer = {
  slug: string
  primary: string
  ink: string
  paper: string
}

const PIONEERS: Pioneer[] = [
  { slug: 'survivor', primary: '#D55E36', ink: '#EFE2BD', paper: '#0E2A2A' },
  { slug: 'top-chef', primary: '#B86A2E', ink: '#ECDFC6', paper: '#1B2418' },
  { slug: 'dragrace', primary: '#E64B86', ink: '#F2E1D2', paper: '#2D0B2A' },
]

const ASSETS = ['facade.svg', 'sigil.svg', 'ornament-1.svg', 'ornament-2.svg', 'ornament-3.svg']

for (const show of PIONEERS) {
  test.describe(`pioneer show: ${show.slug}`, () => {
    for (const asset of ASSETS) {
      test(`/shows/${show.slug}/${asset} returns 200 and is real SVG`, async ({ request }) => {
        const response = await request.get(`/shows/${show.slug}/${asset}`)
        expect(response.status(), `status for ${show.slug}/${asset}`).toBe(200)
        const body = await response.text()
        const head = body.trim().slice(0, 200)
        expect(head, `expected SVG prelude on ${show.slug}/${asset}; saw: ${head}`).toMatch(
          /^(<\?xml|<svg)/,
        )
      })
    }

    test(`facade.svg encodes the show's primary color`, async ({ request }) => {
      const response = await request.get(`/shows/${show.slug}/facade.svg`)
      const body = (await response.text()).toLowerCase()
      expect(
        body.includes(show.primary.toLowerCase()),
        `facade.svg for ${show.slug} should contain primary ${show.primary}`,
      ).toBe(true)
    })

    test(`/shows/${show.slug} renders with data-show wrapper`, async ({ page }) => {
      const response = await page.goto(`/shows/${show.slug}`, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      const wrapper = page.locator(`[data-show="${show.slug}"]`).first()
      await expect(wrapper).toBeVisible()
    })
  })
}
