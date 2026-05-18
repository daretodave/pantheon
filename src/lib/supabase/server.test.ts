import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { upsertMock, rpcMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  rpcMock: vi.fn(),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ upsert: upsertMock }), rpc: rpcMock }),
}))

const HANDLE_DUP = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "users_handle_key"',
}

const savedUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const savedKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

describe('upsertUser handle-collision disambiguation', () => {
  beforeEach(() => {
    upsertMock.mockReset()
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co'
    process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-key'
    vi.resetModules()
  })
  afterEach(() => {
    if (savedUrl !== undefined) process.env['NEXT_PUBLIC_SUPABASE_URL'] = savedUrl
    else delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    if (savedKey !== undefined) process.env['SUPABASE_SERVICE_ROLE_KEY'] = savedKey
    else delete process.env['SUPABASE_SERVICE_ROLE_KEY']
  })

  // Strict-null-safe accessor for the nth upsert payload's handle.
  const handleArg = (i: number): string => {
    const arg = upsertMock.mock.calls[i]?.[0] as { handle?: unknown } | undefined
    if (!arg || typeof arg.handle !== 'string') {
      throw new Error(`expected an upsert call #${i} with a string handle`)
    }
    return arg.handle
  }

  it('writes once with the base handle when there is no collision', async () => {
    upsertMock.mockResolvedValueOnce({ error: null })
    const { upsertUser } = await import('./server')
    await upsertUser({ sub: 'auth0|alice', handle: 'dave' })
    expect(upsertMock).toHaveBeenCalledTimes(1)
    expect(handleArg(0)).toBe('dave')
  })

  it('retries with a deterministic sub-scoped handle on a users_handle_key 23505', async () => {
    upsertMock
      .mockResolvedValueOnce({ error: HANDLE_DUP })
      .mockResolvedValueOnce({ error: null })
    const { upsertUser } = await import('./server')
    await upsertUser({ sub: 'auth0|bob', handle: 'dave' })
    expect(upsertMock).toHaveBeenCalledTimes(2)
    const retried = handleArg(1)
    expect(retried).toMatch(/^dave-[a-z0-9]{1,6}$/)

    // Stable per sub: a second resolve for the same sub disambiguates
    // to the exact same handle (idempotent re-login).
    upsertMock.mockReset()
    upsertMock
      .mockResolvedValueOnce({ error: HANDLE_DUP })
      .mockResolvedValueOnce({ error: null })
    vi.resetModules()
    const again = await import('./server')
    await again.upsertUser({ sub: 'auth0|bob', handle: 'dave' })
    expect(handleArg(1)).toBe(retried)
  })

  it('propagates non-collision errors without retrying', async () => {
    upsertMock.mockResolvedValueOnce({ error: { code: '42501', message: 'rls denied' } })
    const { upsertUser } = await import('./server')
    await expect(upsertUser({ sub: 'auth0|x', handle: 'dave' })).rejects.toThrow(/rls denied/)
    expect(upsertMock).toHaveBeenCalledTimes(1)
  })
})

describe('readVote', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co'
    process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-key'
    vi.resetModules()
  })
  afterEach(() => {
    if (savedUrl !== undefined) process.env['NEXT_PUBLIC_SUPABASE_URL'] = savedUrl
    else delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    if (savedKey !== undefined) process.env['SUPABASE_SERVICE_ROLE_KEY'] = savedKey
    else delete process.env['SUPABASE_SERVICE_ROLE_KEY']
  })

  it('calls read_vote with the resolved session + target and coerces the row', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ value: 1, count: 0.3, raw_count: 4 }],
      error: null,
    })
    const { readVote } = await import('./server')
    const r = await readVote({
      sessionId: 'sess-1',
      targetType: 'season',
      targetId: 'survivor:20',
    })
    expect(rpcMock).toHaveBeenCalledWith('read_vote', {
      p_session_id: 'sess-1',
      p_target_type: 'season',
      p_target_id: 'survivor:20',
    })
    // count is the weighted internal; rawCount is the clean
    // integer the UI shows (#64).
    expect(r).toEqual({ value: 1, count: 0.3, rawCount: 4 })
  })

  it('passes a null session through (anon visitor, aggregate still readable)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { value: 0, count: 5, raw_count: 12 },
      error: null,
    })
    const { readVote } = await import('./server')
    const r = await readVote({
      sessionId: null,
      targetType: 'season',
      targetId: 'survivor:1',
    })
    expect(rpcMock).toHaveBeenCalledWith('read_vote', {
      p_session_id: null,
      p_target_type: 'season',
      p_target_id: 'survivor:1',
    })
    expect(r).toEqual({ value: 0, count: 5, rawCount: 12 })
  })

  it('defaults to value 0 / count 0 when no row comes back', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null })
    const { readVote } = await import('./server')
    expect(
      await readVote({ sessionId: 's', targetType: 'season', targetId: 't' }),
    ).toEqual({ value: 0, count: 0, rawCount: 0 })
  })

  it('throws (carrying the pg code) on an RPC error', async () => {
    rpcMock.mockResolvedValueOnce({
      error: { message: 'boom', code: '22023', hint: null },
    })
    const { readVote } = await import('./server')
    await expect(
      readVote({ sessionId: 's', targetType: 'season', targetId: 't' }),
    ).rejects.toThrow(/boom/)
  })
})

describe('castVote', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co'
    process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-key'
    vi.resetModules()
  })
  afterEach(() => {
    if (savedUrl !== undefined) process.env['NEXT_PUBLIC_SUPABASE_URL'] = savedUrl
    else delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    if (savedKey !== undefined) process.env['SUPABASE_SERVICE_ROLE_KEY'] = savedKey
    else delete process.env['SUPABASE_SERVICE_ROLE_KEY']
  })

  it('maps the integer raw_count alongside the weighted count (#64)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        { value: 1, weight: 0.25, count: 0.45, raw_count: 3, persisted: true },
      ],
      error: null,
    })
    const { castVote } = await import('./server')
    const r = await castVote({
      sessionId: 'sess-1',
      targetType: 'season',
      targetId: 'survivor:20',
      value: 1,
    })
    expect(r).toEqual({
      value: 1,
      weight: 0.25,
      count: 0.45,
      rawCount: 3,
      persisted: true,
    })
  })
})

describe('serviceRoleClient', () => {
  afterEach(() => {
    if (savedUrl !== undefined) process.env['NEXT_PUBLIC_SUPABASE_URL'] = savedUrl
    else delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    if (savedKey !== undefined) process.env['SUPABASE_SERVICE_ROLE_KEY'] = savedKey
    else delete process.env['SUPABASE_SERVICE_ROLE_KEY']
    vi.resetModules()
  })

  it('returns a client when env is populated', async () => {
    if (!savedUrl || !savedKey) return
    vi.resetModules()
    const mod = await import('./server')
    const c = mod.serviceRoleClient()
    expect(c).toBeDefined()
    expect(mod.serviceRoleClient()).toBe(c)
  })

  it('throws on missing URL', async () => {
    delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    vi.resetModules()
    const mod = await import('./server')
    expect(() => mod.serviceRoleClient()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/i)
  })

  it('throws on missing service role key', async () => {
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co'
    delete process.env['SUPABASE_SERVICE_ROLE_KEY']
    vi.resetModules()
    const mod = await import('./server')
    expect(() => mod.serviceRoleClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/i)
  })
})

describe('listThreadComments graceful degradation', () => {
  afterEach(() => {
    if (savedUrl !== undefined) process.env['NEXT_PUBLIC_SUPABASE_URL'] = savedUrl
    else delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    if (savedKey !== undefined) process.env['SUPABASE_SERVICE_ROLE_KEY'] = savedKey
    else delete process.env['SUPABASE_SERVICE_ROLE_KEY']
  })

  it('returns empty lists when the service-role client is unavailable (always-working)', async () => {
    delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    delete process.env['SUPABASE_SERVICE_ROLE_KEY']
    vi.resetModules()
    const mod = await import('./server')
    const out = await mod.listThreadComments({
      targetType: 'season',
      targetId: 'survivor:20',
      sub: null,
    })
    expect(out).toEqual({ published: [], ownPending: [] })
  })
})
