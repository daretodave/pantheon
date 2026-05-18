import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role Supabase client. Server-only — never import from
// client components. Bypasses RLS by design; all write paths
// flow through SECURITY DEFINER RPCs so the bypass is contained.
//
// Required env (must be set in Vercel + local .env):
//   NEXT_PUBLIC_SUPABASE_URL   — the project URL (publicly known)
//   SUPABASE_SERVICE_ROLE_KEY  — service-role JWT (secret)

let cached: SupabaseClient | null = null

export function serviceRoleClient(): SupabaseClient {
  if (cached) return cached
  // SUPABASE_URL is the runtime-overridable form (server-only).
  // NEXT_PUBLIC_SUPABASE_URL is inlined at build for the client
  // bundle; reading it on the server still works but can't be
  // overridden by webServer.env. Prefer SUPABASE_URL when set
  // so the e2e harness can point at the local Supabase without
  // rebuilding.
  const url =
    process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url) throw new Error('SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL missing')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')
  cached = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return cached
}

// Convenience helper for the cast_vote() RPC. Returns the RPC's
// single-row response or throws on Postgres error.
export type CastVoteArgs = {
  sessionId: string
  targetType: 'season' | 'comment'
  targetId: string
  value: -1 | 0 | 1
}

export type CastVoteResult = {
  value: number
  weight: number
  // Weighted aggregate SUM(value*weight) — a fractional ranking
  // signal. Internal only; never the client-facing number.
  count: number
  // Unweighted integer net SUM(value). This is the clean count
  // the VotePair pill shows (issue #64).
  rawCount: number
  persisted: boolean
}

export async function castVote(args: CastVoteArgs): Promise<CastVoteResult> {
  const client = serviceRoleClient()
  const { data, error } = await client.rpc('cast_vote', {
    p_session_id: args.sessionId,
    p_target_type: args.targetType,
    p_target_id: args.targetId,
    p_value: args.value,
  })
  if (error) {
    const e = new Error(error.message) as Error & { code?: string; hint?: string }
    e.code = error.code
    e.hint = error.hint ?? undefined
    throw e
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('cast_vote: no row returned')
  return {
    value: Number(row.value),
    weight: Number(row.weight),
    count: Number(row.count),
    rawCount: Number(row.raw_count) || 0,
    persisted: Boolean(row.persisted),
  }
}

// Convenience helper for the read_vote() RPC — the read sibling
// of castVote. Returns this session's current vote on the target
// plus the fresh aggregate. `sessionId` may be null (anon visitor
// with no cookie): value comes back 0, count is still the true
// net for the target.
export type ReadVoteArgs = {
  sessionId: string | null
  targetType: 'season' | 'comment'
  targetId: string
}

export type ReadVoteResult = {
  value: number
  // Weighted aggregate — internal ranking signal, never shown.
  count: number
  // Unweighted integer net — the client-facing pill number (#64).
  rawCount: number
}

export async function readVote(args: ReadVoteArgs): Promise<ReadVoteResult> {
  const client = serviceRoleClient()
  const { data, error } = await client.rpc('read_vote', {
    p_session_id: args.sessionId,
    p_target_type: args.targetType,
    p_target_id: args.targetId,
  })
  if (error) {
    const e = new Error(error.message) as Error & { code?: string; hint?: string }
    e.code = error.code
    e.hint = error.hint ?? undefined
    throw e
  }
  const row = Array.isArray(data) ? data[0] : data
  return {
    value: row ? Number(row.value) : 0,
    count: row ? Number(row.count) : 0,
    rawCount: row ? Number(row.raw_count) || 0 : 0,
  }
}

// Upserts a users row keyed on auth0_sub. The cast_vote RPC reads
// users.created_at to pick the weight bucket; missing rows fall
// back to the new-account 0.25× weight.
export type UpsertUserArgs = {
  sub: string
  handle: string
  email?: string | null
  displayName?: string | null
}

// Deterministic per-sub suffix (djb2 → base36). Stable across
// logins so a disambiguated user keeps the same handle; pure, no
// crypto dependency.
function handleSuffix(sub: string): string {
  let h = 5381
  for (let i = 0; i < sub.length; i++) h = ((h << 5) + h + sub.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 6)
}

export async function upsertUser(args: UpsertUserArgs): Promise<void> {
  const client = serviceRoleClient()
  const write = (handle: string) =>
    client.from('users').upsert(
      {
        auth0_sub: args.sub,
        handle,
        email: args.email ?? null,
        display_name: args.displayName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth0_sub', ignoreDuplicates: false },
    )

  let { error } = await write(args.handle)
  // auth0_sub is the identity (PK); `handle` carries its own
  // UNIQUE (users_handle_key) but is derived non-uniquely from the
  // Auth0 profile (nickname / email-localpart), so two distinct
  // subs can legitimately collide (e.g. dave@gmail vs dave@yahoo →
  // both "dave"). The handle is cosmetic — on collision, claim a
  // deterministic sub-scoped variant rather than 500 the request.
  if (error && error.code === '23505' && /users_handle_key/.test(error.message)) {
    ;({ error } = await write(`${args.handle}-${handleSuffix(args.sub)}`))
  }
  if (error) throw new Error(`upsertUser: ${error.message}`)
}

// Convenience helper for the post_comment() RPC.
export type PostCommentArgs = {
  sessionId: string
  targetType: 'season' | 'comment'
  targetId: string
  parentId: string | null
  body: string
  verdict: 'allow' | 'flag' | 'block'
  categories: string[]
  confidence: number
  reason: string
  redactedPhrase: string | null
}

export type PostCommentResult = {
  id: string
  status: 'published' | 'pending' | 'hidden' | 'removed'
  count: number
}

export async function postComment(args: PostCommentArgs): Promise<PostCommentResult> {
  const client = serviceRoleClient()
  const { data, error } = await client.rpc('post_comment', {
    p_session_id: args.sessionId,
    p_target_type: args.targetType,
    p_target_id: args.targetId,
    p_parent_id: args.parentId,
    p_body: args.body,
    p_verdict: args.verdict,
    p_categories: args.categories,
    p_confidence: args.confidence,
    p_ai_reason: args.reason,
    p_redacted_phrase: args.redactedPhrase,
  })
  if (error) {
    const e = new Error(error.message) as Error & { code?: string; hint?: string }
    e.code = error.code
    e.hint = error.hint ?? undefined
    throw e
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('post_comment: no row returned')
  return {
    id: String(row.id),
    status: row.status,
    count: Number(row.count),
  }
}

// Convenience helper for the flag_comment() RPC.
export type FlagCommentArgs = {
  sessionId: string
  commentId: string
  reason: string
}

export type FlagCommentResult = {
  flagCount: number
  autoHidden: boolean
}

export async function flagComment(args: FlagCommentArgs): Promise<FlagCommentResult> {
  const client = serviceRoleClient()
  const { data, error } = await client.rpc('flag_comment', {
    p_session_id: args.sessionId,
    p_comment_id: args.commentId,
    p_reason: args.reason,
  })
  if (error) {
    const e = new Error(error.message) as Error & { code?: string; hint?: string }
    e.code = error.code
    e.hint = error.hint ?? undefined
    throw e
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('flag_comment: no row returned')
  return {
    flagCount: Number(row.flag_count),
    autoHidden: Boolean(row.auto_hidden),
  }
}

// Read path for the season-page thread (phase 36). Returns the
// public published rows plus — when `sub` is given — that viewer's
// own non-published rows so the author sees their held comment.
// Author handle is resolved from sessions.auth0_sub → users.handle
// (anon sessions resolve to null → rendered as "reader"). Any DB
// failure degrades to empty lists so the page still renders
// (always-working rule); the visibility split itself is enforced
// downstream in lib/comments/thread.ts.
export type ThreadCommentRow = {
  id: string
  body: string
  author: string | null
  created_at: string
  status: 'published' | 'pending' | 'hidden' | 'removed'
}

type EmbeddedCommentRow = {
  id: string
  body: string
  created_at: string
  status: ThreadCommentRow['status']
  sessions: { auth0_sub: string | null } | { auth0_sub: string | null }[] | null
}

function subOf(row: EmbeddedCommentRow): string | null {
  const s = row.sessions
  if (!s) return null
  const one = Array.isArray(s) ? s[0] : s
  return one?.auth0_sub ?? null
}

export async function listThreadComments(args: {
  targetType: 'season' | 'comment'
  targetId: string
  sub: string | null
  limit?: number
}): Promise<{ published: ThreadCommentRow[]; ownPending: ThreadCommentRow[] }> {
  const empty = { published: [], ownPending: [] }
  try {
    const client = serviceRoleClient()
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 200)
    const sel = 'id, body, created_at, status, sessions!inner(auth0_sub)'

    const pubQ = await client
      .from('comments')
      .select(sel)
      .eq('target_type', args.targetType)
      .eq('target_id', args.targetId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (pubQ.error) return empty
    const published = (pubQ.data ?? []) as unknown as EmbeddedCommentRow[]

    let ownPending: EmbeddedCommentRow[] = []
    if (args.sub) {
      const ownQ = await client
        .from('comments')
        .select(sel)
        .eq('target_type', args.targetType)
        .eq('target_id', args.targetId)
        .eq('status', 'pending')
        .eq('sessions.auth0_sub', args.sub)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (!ownQ.error) {
        ownPending = (ownQ.data ?? []) as unknown as EmbeddedCommentRow[]
      }
    }

    const subs = new Set<string>()
    for (const r of [...published, ...ownPending]) {
      const s = subOf(r)
      if (s) subs.add(s)
    }
    const handleBySub = new Map<string, string>()
    if (subs.size > 0) {
      const usersQ = await client
        .from('users')
        .select('auth0_sub, handle')
        .in('auth0_sub', [...subs])
      if (!usersQ.error) {
        for (const u of usersQ.data ?? []) {
          if (u.auth0_sub && u.handle) handleBySub.set(u.auth0_sub, u.handle)
        }
      }
    }

    const shape = (r: EmbeddedCommentRow): ThreadCommentRow => {
      const s = subOf(r)
      return {
        id: String(r.id),
        body: String(r.body),
        author: s ? (handleBySub.get(s) ?? null) : null,
        created_at: String(r.created_at),
        status: r.status,
      }
    }
    return {
      published: published.map(shape),
      ownPending: ownPending.map(shape),
    }
  } catch {
    return empty
  }
}

// Read path for the public profile page (phase 38). Resolves a
// handle to its identity + spoiler-safe activity aggregates via
// the profile_activity RPC, then fetches that member's recent
// PUBLISHED comments (never pending/hidden/removed — the same
// visibility rule the season thread enforces, applied here at the
// query). Returns null for a genuinely-unknown handle so the page
// can 404; a real handle with no activity returns a row with zero
// counts (so "not me, but real" never 404s). Any DB failure on
// the recent-comments leg degrades to an empty list — the
// identity + counts still render (always-working rule).
export type ProfileComment = {
  id: string
  body: string
  created_at: string
  target_type: 'season' | 'comment'
  target_id: string
}

export type ProfileActivity = {
  handle: string
  displayName: string | null
  createdAt: string
  publishedCommentCount: number
  votedSeasonCount: number
  votedShowCount: number
  recentComments: ProfileComment[]
}

type ProfileActivityRow = {
  auth0_sub: string
  handle: string
  display_name: string | null
  created_at: string
  published_comment_count: number | string
  voted_season_count: number | string
  voted_show_count: number | string
}

type EmbeddedProfileCommentRow = {
  id: string
  body: string
  created_at: string
  target_type: 'season' | 'comment'
  target_id: string
  sessions: { auth0_sub: string | null } | { auth0_sub: string | null }[] | null
}

export async function getProfileActivity(args: {
  handle: string
  recentLimit?: number
}): Promise<ProfileActivity | null> {
  const handle = args.handle.trim()
  if (!handle) return null

  const client = serviceRoleClient()
  const { data, error } = await client.rpc('profile_activity', {
    p_handle: handle,
  })
  if (error) {
    const e = new Error(error.message) as Error & { code?: string }
    e.code = error.code
    throw e
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    | ProfileActivityRow
    | undefined
  if (!row || !row.auth0_sub) return null

  const sub = row.auth0_sub
  const recentLimit = Math.min(Math.max(args.recentLimit ?? 8, 1), 30)

  let recentComments: ProfileComment[] = []
  try {
    const q = await client
      .from('comments')
      .select(
        'id, body, created_at, target_type, target_id, sessions!inner(auth0_sub)',
      )
      .eq('status', 'published')
      .eq('sessions.auth0_sub', sub)
      .order('created_at', { ascending: false })
      .limit(recentLimit)
    if (!q.error) {
      const rows = (q.data ?? []) as unknown as EmbeddedProfileCommentRow[]
      recentComments = rows.map((r) => ({
        id: String(r.id),
        body: String(r.body),
        created_at: String(r.created_at),
        target_type: r.target_type,
        target_id: String(r.target_id),
      }))
    }
  } catch {
    recentComments = []
  }

  return {
    handle: row.handle,
    displayName: row.display_name ?? null,
    createdAt: String(row.created_at),
    publishedCommentCount: Number(row.published_comment_count) || 0,
    votedSeasonCount: Number(row.voted_season_count) || 0,
    votedShowCount: Number(row.voted_show_count) || 0,
    recentComments,
  }
}

// Ensure the authed user has a sessions row linked to their sub,
// optionally claiming an anon row. Returns the canonical session id.
export async function claimAnonSession(args: {
  anonId: string | null
  sub: string
}): Promise<{ sessionId: string }> {
  const client = serviceRoleClient()
  if (args.anonId) {
    const { data, error } = await client.rpc('claim_anon_session', {
      p_anon_id: args.anonId,
      p_sub: args.sub,
    })
    if (error) throw new Error(`claim_anon_session: ${error.message}`)
    const row = Array.isArray(data) ? data[0] : data
    if (row?.id) return { sessionId: String(row.id) }
  }
  // No anon id — look up an existing authed session, else mint one.
  const lookup = await client
    .from('sessions')
    .select('id')
    .eq('auth0_sub', args.sub)
    .maybeSingle()
  if (lookup.error) throw new Error(`claimAnonSession lookup: ${lookup.error.message}`)
  if (lookup.data?.id) return { sessionId: String(lookup.data.id) }
  const insert = await client
    .from('sessions')
    .insert({ auth0_sub: args.sub, claimed_at: new Date().toISOString() })
    .select('id')
    .single()
  if (insert.error) throw new Error(`claimAnonSession insert: ${insert.error.message}`)
  return { sessionId: String(insert.data.id) }
}
