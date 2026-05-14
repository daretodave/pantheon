import { expect, test } from '@playwright/test'
import { seasonRedirects } from '../src/fixtures/redirect-fixtures'

// Phase 31a: every digit-form season URL 308s to its canonical
// slug form. The page-level resolver in src/app/shows/[show]/season/[slug]
// looks up the season by number, then permanentRedirects to the
// slug — so external links (and search-engine indexes) keep
// landing on the canonical URL.

for (const r of seasonRedirects) {
  test(`season redirect: ${r.fromPath} → ${r.toPath}`, async ({ page }) => {
    const response = await page.goto(r.fromPath, { waitUntil: 'domcontentloaded' })
    // After Playwright follows the redirect chain we should land on
    // the slug form with a 200. The intermediate 308 is captured
    // via response.request().redirectedFrom() if needed.
    expect(response?.status()).toBe(200)
    expect(new URL(page.url()).pathname).toBe(r.toPath)

    const chain: string[] = []
    let req = response?.request()
    while (req) {
      chain.unshift(req.url())
      const prev = req.redirectedFrom()
      if (!prev) break
      req = prev
    }
    expect(
      chain[0],
      `redirect chain start for ${r.fromPath}: ${chain.join(' → ')}`,
    ).toContain(r.fromPath)
  })
}
