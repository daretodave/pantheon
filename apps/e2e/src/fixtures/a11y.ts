import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

// Phase 18 — axe-core gate. WCAG 2.1 AA tags + filter to
// `critical` / `serious` only. v1 doesn't block on `moderate`
// or `minor` (mostly contrast-of-already-large-text + advisory
// rules). The filter pattern matches the bearings "hard gate
// for critical/serious only" decision.

export type A11yScanArgs = {
  page: Page
  url: string
  viewport?: { width: number; height: number }
}

export async function runA11yScan({ page, url, viewport }: A11yScanArgs): Promise<void> {
  if (viewport) {
    await page.setViewportSize(viewport)
  }
  const res = await page.goto(url, { waitUntil: 'domcontentloaded' })
  expect(res?.status(), `axe pre-flight: ${url} should 200`).toBe(200)

  // Color-contrast is intentionally relaxed: the bearings palette
  // uses subdued meta-text colors (text-ink-3) that fall below
  // axe's 4.5:1 threshold for normal text. Color-contrast
  // tightening is documented as out of scope for v1 (see phase
  // 18 brief). /critique reader sub-agent will surface legibility
  // findings that warrant per-token adjustments.
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['color-contrast'])
    .analyze()

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )

  if (blocking.length === 0) return

  const summary = blocking
    .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join('\n')
  const detail = blocking
    .flatMap((v) => v.nodes.map((n) => `    [${v.id}] ${n.html.slice(0, 200)}`))
    .join('\n')

  throw new Error(
    `axe found ${blocking.length} critical/serious violation(s) on ${url}:\n${summary}\n${detail}`,
  )
}
