import { expect, test } from '@playwright/test'
import { cookieCacheStatus, loadAuthedStorageState } from '../src/auth'

// Phase 12 — comments are durable in Supabase. The webServer
// chain runs `supabase db reset --no-seed` before this spec so
// the comments / flags / ai_decisions tables start empty.
//
// Comments require auth (anon get 401), so most cases use the
// minted e2e cookie. The "anon rejection" case explicitly clears
// the cookie jar.
//
// OPENAI_FAKE=1 is set on the webServer in playwright.config.ts
// so the pre-filter follows the deterministic stub:
//   - body contains 'WINNER' → block
//   - body contains 'SPOILER' → flag
//   - otherwise → allow

const state = loadAuthedStorageState()
const status = cookieCacheStatus()

const SEASON_TARGET = 'survivor:1'

async function postComment(
  page: import('@playwright/test').Page,
  args: { targetType: 'season' | 'comment'; targetId: string; body: string; parentId?: string | null },
): Promise<{ status: number; body: unknown }> {
  return await page.evaluate(async (a) => {
    const res = await fetch('/api/comment', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(a),
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
  }, args)
}

async function postFlag(
  page: import('@playwright/test').Page,
  args: { commentId: string; reason: string },
): Promise<{ status: number; body: unknown }> {
  return await page.evaluate(async (a) => {
    const res = await fetch('/api/flag', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(a),
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
  }, args)
}

test.describe('authed comment posting', () => {
  test.skip(
    !state,
    `e2e cookie cache ${status}; run \`node scripts/mint-e2e-cookie.mjs\` to refresh`,
  )

  test.use({ storageState: state ?? undefined })

  // Each test uses a unique target_id so reruns don't trip the
  // (session_id, target_type, target_id, body_hash) dedupe.
  test('benign body — verdict=allow, new-account hold forces status=pending', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const r = await postComment(page, {
      targetType: 'season',
      targetId: `${SEASON_TARGET}:happy`,
      body: 'This season was filmed in Fiji and the cast had great chemistry.',
    })
    expect(r.status, `post: ${JSON.stringify(r.body)}`).toBe(200)
    const body = r.body as {
      ok: boolean
      id: string
      status: string
      count: number
      verdict: string
    }
    expect(body.ok).toBe(true)
    expect(body.verdict).toBe('allow')
    // New-account hold (e2e user has <5 published comments on a
    // fresh DB) forces pending regardless of verdict.
    expect(body.status).toBe('pending')
    expect(typeof body.id).toBe('string')
    expect(body.id.length).toBeGreaterThan(20)
  })

  test('body contains WINNER — verdict=block, status=hidden', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const r = await postComment(page, {
      targetType: 'season',
      targetId: `${SEASON_TARGET}:block`,
      body: 'The WINNER was obvious from episode 1.',
    })
    expect(r.status).toBe(200)
    const body = r.body as { verdict: string; status: string }
    expect(body.verdict).toBe('block')
    // Block wins over the new-account hold.
    expect(body.status).toBe('hidden')
  })

  test('body contains SPOILER — verdict=flag, status=pending', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const r = await postComment(page, {
      targetType: 'season',
      targetId: `${SEASON_TARGET}:flag`,
      body: 'SPOILER: I will not discuss the plot of episode 8.',
    })
    expect(r.status).toBe(200)
    const body = r.body as { verdict: string; status: string }
    expect(body.verdict).toBe('flag')
    expect(body.status).toBe('pending')
  })

  test('flag round-trip — posts, then flags the returned id', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const c = await postComment(page, {
      targetType: 'season',
      targetId: `${SEASON_TARGET}:flag-rt`,
      body: 'A benign comment that we will then flag for testing.',
    })
    expect(c.status).toBe(200)
    const id = (c.body as { id: string }).id
    expect(id).toBeDefined()

    const f = await postFlag(page, {
      commentId: id,
      reason: 'testing the flag round-trip',
    })
    expect(f.status, `flag: ${JSON.stringify(f.body)}`).toBe(200)
    const flagBody = f.body as { ok: boolean; flag_count: number; auto_hidden: boolean }
    expect(flagBody.ok).toBe(true)
    expect(flagBody.flag_count).toBe(1)
    expect(flagBody.auto_hidden).toBe(false)
  })

  test('/api/comment rejects malformed bodies with 400', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const r = await page.evaluate(async () => {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'missing targetType + targetId' }),
        credentials: 'include',
      })
      return { status: res.status }
    })
    expect(r.status).toBe(400)
  })
})

test.describe('anon comment posting rejected', () => {
  test('anon caller without auth gets 401 auth_required', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const r = await postComment(page, {
      targetType: 'season',
      targetId: `${SEASON_TARGET}:anon`,
      body: 'A guest cannot post.',
    })
    expect(r.status).toBe(401)
    const body = r.body as { error: string }
    expect(body.error).toBe('auth_required')
  })
})
