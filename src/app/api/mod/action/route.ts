import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth0 } from '@/lib/auth0'
import { isMod } from '@/lib/auth0/permissions'
import { ANON_COOKIE_NAME, isValidAnonId } from '@/lib/anonSession'
import {
  claimAnonSession,
  upsertUser,
} from '@/lib/supabase/server'
import { modAction } from '@/lib/supabase/mod'

// Phase 13 — mod action endpoint. RBAC-gated via the Auth0
// permissions claim. The RPC double-checks `users.is_mod` as
// defense in depth.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  commentId: z.string().uuid(),
  action: z.enum(['approve', 'hide', 'remove', 'unhide', 'dismiss_flag']),
  note: z.string().max(500).optional(),
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

  const session = await auth0.getSession()
  const user = session?.user as Record<string, unknown> | undefined
  const sub = typeof user?.['sub'] === 'string' ? (user['sub'] as string) : null

  if (!sub) {
    return NextResponse.json(
      { ok: false, error: 'auth_required', detail: 'sign in to moderate' },
      { status: 401 },
    )
  }

  if (!isMod(user)) {
    return NextResponse.json(
      { ok: false, error: 'not_a_mod', detail: 'mod role required' },
      { status: 403 },
    )
  }

  const cookieHeader = request.headers.get('cookie') ?? ''
  const anonCookieMatch = cookieHeader.match(
    new RegExp(`(?:^|; )${ANON_COOKIE_NAME}=([^;]+)`),
  )
  const anonId = anonCookieMatch ? decodeURIComponent(anonCookieMatch[1] ?? '') : null
  const validAnonId = isValidAnonId(anonId) ? anonId : null

  let sessionId: string
  try {
    const handle = handleFromSession(user)
    const email = typeof user?.['email'] === 'string' ? (user['email'] as string) : null
    const displayName =
      typeof user?.['name'] === 'string' ? (user['name'] as string) : null
    await upsertUser({ sub, handle, email, displayName })
    const claimed = await claimAnonSession({ anonId: validAnonId, sub })
    sessionId = claimed.sessionId
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'auth_resolve_failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }

  try {
    const result = await modAction({
      sessionId,
      commentId: parsed.commentId,
      action: parsed.action,
      note: parsed.note ?? null,
    })
    return NextResponse.json({
      ok: true,
      status: result.newStatus,
      actionId: result.actionId,
    })
  } catch (err) {
    const e = err as { code?: string; hint?: string; message?: string }
    if (e.code === '42501') {
      return NextResponse.json(
        { ok: false, error: 'not_a_mod', detail: e.message ?? 'mod role required' },
        { status: 403 },
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
