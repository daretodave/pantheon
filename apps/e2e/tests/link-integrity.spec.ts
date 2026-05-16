import { expect, test } from '@playwright/test'

// Phase 33: the canon/community consolidation must not strand a
// single internal link. Belt = the 308 redirects; suspenders = every
// internal href is repointed to the canonical consolidated URL.
// Tested here: a small, fast crawl of the two pages most exposed to
// the change — the consolidated show page itself, and the season
// page that carries the "Also appears in → Editor's Canon" row the
// user flagged (gabon). Every internal <a href> must resolve 200
// (directly or via an intended redirect whose target is 200) — zero
// 404s.

const PAGES = ['/shows/survivor', '/shows/survivor/season/gabon'] as const

function isInternal(href: string): boolean {
  if (!href) return false
  if (href.startsWith('#')) return false
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false
  if (/^https?:\/\//i.test(href)) return false
  return href.startsWith('/')
}

for (const path of PAGES) {
  test(`no dead internal links on ${path}`, async ({ page, request }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    const hrefs = await page.$$eval('a[href]', (as) =>
      as.map((a) => a.getAttribute('href') ?? ''),
    )
    const internal = [...new Set(hrefs.filter(isInternal))]
    expect(internal.length).toBeGreaterThan(0)

    for (const href of internal) {
      const res = await request.get(href, { maxRedirects: 5 })
      expect(
        res.status(),
        `internal link ${href} on ${path} resolved ${res.status()}`,
      ).toBe(200)
    }
  })
}

test('season "Also appears in → Editor\'s Canon" row lands on the consolidated page', async ({
  page,
}) => {
  await page.goto('/shows/survivor/season/gabon', {
    waitUntil: 'domcontentloaded',
  })
  const appears = page.getByTestId('section-appears')
  await expect(appears).toBeVisible()

  const canonRow = appears.locator('a', { hasText: /Editor['’]s Canon/i }).first()
  await expect(canonRow).toHaveAttribute('href', '/shows/survivor')

  await canonRow.click()
  await expect(page).toHaveURL(/\/shows\/survivor(\?|#|$)/)
  await expect(page.getByTestId('show-ranking')).toBeVisible()
})
