import { NextResponse } from 'next/server'

// Phase 9 ships the comment-thread shell. Phase 10 wires Auth0;
// phase 12 wires real Supabase writes + the AI pre-filter. Until
// then this endpoint accepts a body and returns 200 so the client
// flow is exercisable.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let payload: unknown = null
  try {
    payload = await request.json()
  } catch {
    /* tolerate empty / malformed bodies in v1 */
  }
  return NextResponse.json({ ok: true, accepted: payload ?? null, persisted: false })
}
