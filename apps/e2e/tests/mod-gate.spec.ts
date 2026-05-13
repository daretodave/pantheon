import { expect, test } from '@playwright/test'
import { cookieCacheStatus, loadAuthedStorageState } from '../src/auth'

// Phase 13 — RBAC gate on /mod. Two cases covered here:
//   1. Anon (no Auth0 session) → renders the "sign in to continue"
//      affordance.
//   2. Authed-but-not-a-mod (the e2e user, who doesn't have the
//      mod:read permission) → renders the "not authorized" panel.
//
// Queue-drain happy paths are deferred until a mod-fixture pipeline
// lands (see brief Out of scope). That requires either a parallel
// minted-cookie helper or a temporary users.is_mod = true grant —
// non-trivial, and not blocking phase 13.

const state = loadAuthedStorageState()
const status = cookieCacheStatus()

test.describe('mod gate', () => {
  test('anon caller sees sign-in affordance, not the queue', async ({ page, context }) => {
    await context.clearCookies()
    const response = await page.goto('/mod', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('mod-signed-out')).toBeVisible()
    await expect(page.getByTestId('mod-queue-page')).toHaveCount(0)
  })

  test('authed user without mod role sees not-authorized panel', async ({
    browser,
  }) => {
    test.skip(
      !state,
      `e2e cookie cache ${status}; run \`node scripts/mint-e2e-cookie.mjs\` to refresh`,
    )

    const context = await browser.newContext({ storageState: state ?? undefined })
    const page = await context.newPage()
    const response = await page.goto('/mod', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('mod-not-authorized')).toBeVisible()
    await expect(page.getByTestId('mod-queue-page')).toHaveCount(0)
    await context.close()
  })

  test('/api/mod/action rejects anon with 401', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const r = await page.evaluate(async () => {
      const res = await fetch('/api/mod/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          commentId: '00000000-0000-4000-8000-000000000001',
          action: 'approve',
        }),
        credentials: 'include',
      })
      const text = await res.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
      return { status: res.status, body: parsed }
    })
    expect(r.status).toBe(401)
    expect((r.body as { error: string }).error).toBe('auth_required')
  })

  test('/api/mod/action rejects authed-but-not-mod with 403', async ({ browser }) => {
    test.skip(
      !state,
      `e2e cookie cache ${status}; run \`node scripts/mint-e2e-cookie.mjs\` to refresh`,
    )

    const context = await browser.newContext({ storageState: state ?? undefined })
    const page = await context.newPage()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const r = await page.evaluate(async () => {
      const res = await fetch('/api/mod/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          commentId: '00000000-0000-4000-8000-000000000001',
          action: 'approve',
        }),
        credentials: 'include',
      })
      const text = await res.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
      return { status: res.status, body: parsed }
    })
    expect(r.status).toBe(403)
    expect((r.body as { error: string }).error).toBe('not_a_mod')
    await context.close()
  })
})
