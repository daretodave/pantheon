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
  count: number
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
    persisted: Boolean(row.persisted),
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

export async function upsertUser(args: UpsertUserArgs): Promise<void> {
  const client = serviceRoleClient()
  const { error } = await client
    .from('users')
    .upsert(
      {
        auth0_sub: args.sub,
        handle: args.handle,
        email: args.email ?? null,
        display_name: args.displayName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth0_sub', ignoreDuplicates: false },
    )
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
