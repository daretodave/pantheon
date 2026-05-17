import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth0 } from '@/lib/auth0'
import { ANON_COOKIE_NAME, isValidAnonId } from '@/lib/anonSession'
import {
  castVote,
  claimAnonSession,
  readVote,
  upsertUser,
} from '@/lib/supabase/server'

// Phase 11 — votes are durable. The POST route enforces:
//  - body shape via Zod
//  - resolves the session id from cookies + Auth0 session
//  - upserts users row for authed callers; claims anon session
//    so guest votes follow the user
//  - delegates the write + weight + brigade limit to cast_vote()
//    RPC (service-role; SECURITY DEFINER)
//
// Phase 35 stage 3 — the read sibling. GET resolves the same
// session the way POST does (so a read agrees with the write a
// subsequent click would make) and returns this session's
// current vote + the true aggregate net for the target. This is
// the path VotePair fetches on mount so a refresh reflects the
// persisted net instead of the static initialCount.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  targetType: z.enum(['season', 'comment']),
  targetId: z.string().min(1).max(128),
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
})

const querySchema = z.object({
  targetType: z.enum(['season', 'comment']),
  targetId: z.string().min(1).max(128),
})

function handleFromSession(user: Record<string, unknown> | null | undefined): string {
  if (!user) return 'anon'
  const nickname = typeof user['nickname'] === 'string' ? user['nickname'] : null
  if (nickname) return nickname.replace(/^@+/, '').toLowerCase()
  const email = typeof user['email'] === 'string' ? user['email'] : null
  if (email) return (email.split('@')[0] ?? 'user').toLowerCase()
  const sub = typeof user['sub'] === 'string' ? user['sub'] : null
  if (sub) return sub.replace(/[^a-z0-9-]/gi, '-').slice(0, 32).toLowerCase()
  return 'user'
}

type SessionResolution =
  | { ok: true; sessionId: string | null }
  | { ok: false; status: number; body: Record<string, unknown> }

// Shared by POST and GET so the read path resolves to the exact
// same session id the write path would. For an authed caller this
// lazily upserts the users row + claims the anon session — the
// same side effects POST has always had; doing them on GET keeps
// the two endpoints in lockstep (a v1-experiment tradeoff: a vote
// read may touch identity rows, but it can never disagree with
// the write). `sessionId: null` means anon-with-no-cookie — a
// legitimate state for GET (aggregate still readable), rejected
// by POST (nothing to write against).
async function resolveSessionId(request: Request): Promise<SessionResolution> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const anonCookieMatch = cookieHeader.match(
    new RegExp(`(?:^|; )${ANON_COOKIE_NAME}=([^;]+)`),
  )
  const anonId = anonCookieMatch ? decodeURIComponent(anonCookieMatch[1] ?? '') : null
  const validAnonId = isValidAnonId(anonId) ? anonId : null

  try {
    const session = await auth0.getSession()
    const user = session?.user as Record<string, unknown> | undefined
    const sub = typeof user?.['sub'] === 'string' ? (user['sub'] as string) : null

    if (sub) {
      const handle = handleFromSession(user)
      const email = typeof user?.['email'] === 'string' ? (user['email'] as string) : null
      const displayName =
        typeof user?.['name'] === 'string' ? (user['name'] as string) : null
      await upsertUser({ sub, handle, email, displayName })
      const claimed = await claimAnonSession({ anonId: validAnonId, sub })
      return { ok: true, sessionId: claimed.sessionId }
    }
    if (validAnonId) return { ok: true, sessionId: validAnonId }
    return { ok: true, sessionId: null }
  } catch (err) {
    return {
      ok: false,
      status: 500,
      body: {
        ok: false,
        error: 'auth_resolve_failed',
        detail: err instanceof Error ? err.message : String(err),
      },
    }
  }
}

export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>
  try {
    const raw = await request.json()
    parsed = bodySchema.parse(raw)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 },
    )
  }

  const resolved = await resolveSessionId(request)
  if (!resolved.ok) return NextResponse.json(resolved.body, { status: resolved.status })

  if (!resolved.sessionId) {
    return NextResponse.json(
      { ok: false, error: 'no_session', detail: 'missing tiered_anon_id cookie' },
      { status: 400 },
    )
  }

  try {
    const result = await castVote({
      sessionId: resolved.sessionId,
      targetType: parsed.targetType,
      targetId: parsed.targetId,
      value: parsed.value,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const e = err as { code?: string; hint?: string; message?: string }
    if (e.code === '23505' || e.hint?.includes('brigade')) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited', detail: 'brigade limit exceeded for this session' },
        { status: 429 },
      )
    }
    if (e.code === '22023') {
      return NextResponse.json(
        { ok: false, error: 'invalid_input', detail: e.message ?? 'rejected by RPC' },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { ok: false, error: 'rpc_failed', detail: e.message ?? 'unknown' },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = querySchema.safeParse({
    targetType: url.searchParams.get('targetType'),
    targetId: url.searchParams.get('targetId'),
  })
  if (!q.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_query', detail: q.error.message },
      { status: 400 },
    )
  }

  const resolved = await resolveSessionId(request)
  if (!resolved.ok) return NextResponse.json(resolved.body, { status: resolved.status })

  try {
    const result = await readVote({
      sessionId: resolved.sessionId,
      targetType: q.data.targetType,
      targetId: q.data.targetId,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const e = err as { code?: string; message?: string }
    if (e.code === '22023') {
      return NextResponse.json(
        { ok: false, error: 'invalid_input', detail: e.message ?? 'rejected by RPC' },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { ok: false, error: 'rpc_failed', detail: e.message ?? 'unknown' },
      { status: 500 },
    )
  }
}
