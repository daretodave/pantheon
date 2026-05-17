import { expect, test } from '@playwright/test'

// Phase 11 — votes are durable in Supabase. The webServer chain
// runs `supabase db reset --no-seed` before this spec runs, so
// all four phase-11 migrations apply and the votes table starts
// empty.
//
// We exercise the API via page.evaluate(fetch) so the cookies
// follow the browser context's cookie jar naturally.

const SEASON_TARGET = 'survivor:1'

async function castVote(
  page: import('@playwright/test').Page,
  args: { targetType: 'season' | 'comment'; targetId: string; value: -1 | 0 | 1 },
): Promise<{ status: number; body: unknown }> {
  return await page.evaluate(async (a) => {
    const res = await fetch('/api/vote', {
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

async function readVote(
  page: import('@playwright/test').Page,
  args: { targetType: 'season' | 'comment'; targetId: string },
): Promise<{ status: number; body: { ok: boolean; value: number; count: number } }> {
  return await page.evaluate(async (a) => {
    const params = new URLSearchParams(a as Record<string, string>)
    const res = await fetch(`/api/vote?${params.toString()}`, {
      credentials: 'include',
    })
    const text = await res.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
    return {
      status: res.status,
      body: parsed as { ok: boolean; value: number; count: number },
    }
  }, args)
}

test('GET /api/vote reads back the persisted vote + true net (closes refresh-shows-0)', async ({
  page,
  context,
}) => {
  await context.clearCookies()
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const TARGET = `${SEASON_TARGET}:readback`

  // Before voting: value 0, but the aggregate is still readable.
  const before = await readVote(page, { targetType: 'season', targetId: TARGET })
  expect(before.status).toBe(200)
  expect(before.body.ok).toBe(true)
  expect(before.body.value).toBe(0)

  // Cast +1, then read it back — this is the page-refresh path.
  const cast = await castVote(page, { targetType: 'season', targetId: TARGET, value: 1 })
  expect(cast.status, `cast: ${JSON.stringify(cast.body)}`).toBe(200)

  const after = await readVote(page, { targetType: 'season', targetId: TARGET })
  expect(after.status).toBe(200)
  expect(after.body.value).toBe(1)
  expect(after.body.count).toBeGreaterThan(0)

  // Retract (value 0) — read-back reflects the cleared state, not
  // a phantom net (the "re-click drops the net" symptom).
  const retract = await castVote(page, {
    targetType: 'season',
    targetId: TARGET,
    value: 0,
  })
  expect(retract.status).toBe(200)
  const cleared = await readVote(page, { targetType: 'season', targetId: TARGET })
  expect(cleared.body.value).toBe(0)
  expect(cleared.body.count).toBe(0)
})

test('GET /api/vote rejects a missing target with 400', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const result = await page.evaluate(async () => {
    const res = await fetch('/api/vote?targetType=season', { credentials: 'include' })
    return { status: res.status }
  })
  expect(result.status).toBe(400)
})

test('anon vote round-trip persists in Supabase', async ({ page, context }) => {
  await context.clearCookies()

  // First page load — middleware mints the anon cookie.
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const cookies = await context.cookies()
  expect(cookies.find((c) => c.name === 'tiered_anon_id')?.value).toBeDefined()

  // Cast +1.
  const cast = await castVote(page, {
    targetType: 'season',
    targetId: SEASON_TARGET,
    value: 1,
  })
  expect(cast.status, `cast: ${JSON.stringify(cast.body)}`).toBe(200)
  const body = cast.body as {
    ok: boolean
    value: number
    weight: number
    count: number
    persisted: boolean
  }
  expect(body.ok).toBe(true)
  expect(body.value).toBe(1)
  expect(body.weight).toBe(0.1)
  expect(body.persisted).toBe(true)
  expect(body.count).toBeGreaterThan(0)

  // Retract — value 0.
  const retract = await castVote(page, {
    targetType: 'season',
    targetId: SEASON_TARGET,
    value: 0,
  })
  expect(retract.status).toBe(200)
  expect((retract.body as { value: number }).value).toBe(0)
})

test('vote in opposite direction swaps the stored value', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  let r = await castVote(page, {
    targetType: 'season',
    targetId: `${SEASON_TARGET}:swap`,
    value: 1,
  })
  expect(r.status).toBe(200)

  r = await castVote(page, {
    targetType: 'season',
    targetId: `${SEASON_TARGET}:swap`,
    value: -1,
  })
  expect(r.status).toBe(200)
  expect((r.body as { value: number }).value).toBe(-1)
})

test('/api/vote rejects malformed bodies with 400', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const result = await page.evaluate(async () => {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
      credentials: 'include',
    })
    return { status: res.status }
  })
  expect(result.status).toBe(400)
})
