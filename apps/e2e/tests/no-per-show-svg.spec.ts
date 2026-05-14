import { expect, test } from '@playwright/test'

// Phase 19a — the scorched-earth contract. After this phase, no
// per-show SVG illustration may appear anywhere in the product.
// The only SVG permitted is the shared tiered.tv brand mark
// (three horizontal bars, viewBox="0 0 28 28").
//
// This spec walks every show-bearing surface and asserts three
// independent invariants:
//
//   1. No <svg> on the page has viewBox="0 0 1200 800" (the old
//      facade frame) or any per-show viewBox identifier.
//   2. No <img> on the page has a src matching
//      /shows/<slug>/{facade,sigil,ornament}*.svg.
//   3. No network request resolves to a URL matching the above
//      pattern — even if the markup is clean, a stray <link
//      rel="preload"> or fetch() would still ship the byte.

const PER_SHOW_SVG_RE = /\/shows\/[a-z0-9-]+\/(?:facade|sigil|ornament)[a-z0-9-]*\.svg/

const ROUTES = [
  '/',
  '/shows',
  '/shows/survivor',
  '/shows/top-chef',
  '/shows/dragrace',
  '/shows/survivor/season/borneo',
]

for (const path of ROUTES) {
  test(`${path}: no per-show SVG illustration`, async ({ page }) => {
    const requestedUrls: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (PER_SHOW_SVG_RE.test(url)) requestedUrls.push(url)
    })

    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status(), `status for ${path}`).toBeLessThan(400)

    const rejectedSvgs = await page.evaluate(() => {
      const out: string[] = []
      for (const svg of Array.from(document.querySelectorAll('svg'))) {
        const vb = svg.getAttribute('viewBox') ?? ''
        if (vb === '0 0 1200 800') out.push(`<svg viewBox="${vb}">`)
      }
      return out
    })
    expect(rejectedSvgs, `unexpected per-show-frame SVG on ${path}`).toEqual([])

    const facadeImgs = await page.evaluate(() => {
      const out: string[] = []
      for (const img of Array.from(document.querySelectorAll('img'))) {
        const src = img.getAttribute('src') ?? ''
        if (/\/shows\/[a-z0-9-]+\/(?:facade|sigil|ornament)[a-z0-9-]*\.svg/.test(src)) {
          out.push(src)
        }
      }
      return out
    })
    expect(facadeImgs, `unexpected per-show facade <img> on ${path}`).toEqual([])

    expect(requestedUrls, `unexpected per-show facade requests on ${path}`).toEqual([])
  })
}
