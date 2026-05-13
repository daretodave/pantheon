import { NextResponse } from 'next/server'

// Phase 9 ships the optimistic-update path on the client. The
// reducer + UI run independently of this endpoint; we just need
// a 200 so the network round-trip doesn't error in devtools.
// Phase 11 replaces this body with Supabase writes + RLS gating.

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
