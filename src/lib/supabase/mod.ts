import { serviceRoleClient } from './server'

// Queries + actions for the moderation queue. Service-role only;
// never imported from client components.

export type ModQueueItem = {
  id: string
  parentId: string | null
  targetType: 'season' | 'comment'
  targetId: string
  body: string
  status: 'published' | 'pending' | 'hidden' | 'removed'
  createdAt: string
  flagCount: number
}

// Drains: pending + hidden comments, plus published-but-flagged.
// Sorted by flag count desc, then created_at desc. Capped at 50.
export async function getModQueue(): Promise<ModQueueItem[]> {
  const client = serviceRoleClient()

  // Pull pending + hidden + any comment with at least one flag.
  // We fetch up to 100 candidates and prune to 50 after sorting
  // so flag count dominates ordering even when "pending" volume
  // is high.
  const { data: queueRows, error: queueErr } = await client
    .from('comments')
    .select('id, parent_id, session_id, target_type, target_id, body, status, created_at')
    .in('status', ['pending', 'hidden'])
    .order('created_at', { ascending: false })
    .limit(100)
  if (queueErr) throw new Error(`getModQueue: ${queueErr.message}`)

  const queueIds = (queueRows ?? []).map((r) => r.id)

  // Also published-but-flagged comments (sliding 7-day window).
  const { data: flagAgg, error: flagErr } = await client
    .from('flags')
    .select('comment_id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  if (flagErr) throw new Error(`getModQueue flags: ${flagErr.message}`)

  const flagCountById = new Map<string, number>()
  for (const row of flagAgg ?? []) {
    const id = String((row as { comment_id: string }).comment_id)
    flagCountById.set(id, (flagCountById.get(id) ?? 0) + 1)
  }

  const flaggedNotInQueue = Array.from(flagCountById.keys()).filter(
    (id) => !queueIds.includes(id),
  )

  let extraRows: typeof queueRows = []
  if (flaggedNotInQueue.length > 0) {
    const { data, error } = await client
      .from('comments')
      .select('id, parent_id, session_id, target_type, target_id, body, status, created_at')
      .in('id', flaggedNotInQueue)
    if (error) throw new Error(`getModQueue flagged: ${error.message}`)
    extraRows = data ?? []
  }

  const all = [...(queueRows ?? []), ...extraRows]
  const mapped: ModQueueItem[] = all.map((r) => {
    const row = r as {
      id: string
      parent_id: string | null
      target_type: 'season' | 'comment'
      target_id: string
      body: string
      status: 'published' | 'pending' | 'hidden' | 'removed'
      created_at: string
    }
    return {
      id: row.id,
      parentId: row.parent_id,
      targetType: row.target_type,
      targetId: row.target_id,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
      flagCount: flagCountById.get(row.id) ?? 0,
    }
  })

  mapped.sort((a, b) => {
    if (a.flagCount !== b.flagCount) return b.flagCount - a.flagCount
    return a.createdAt < b.createdAt ? 1 : -1
  })

  return mapped.slice(0, 50)
}

export type ModActionInput = {
  sessionId: string
  commentId: string
  action: 'approve' | 'hide' | 'remove' | 'unhide' | 'dismiss_flag'
  note: string | null
}

export type ModActionResult = {
  newStatus: string
  actionId: number
}

export async function modAction(args: ModActionInput): Promise<ModActionResult> {
  const client = serviceRoleClient()
  const { data, error } = await client.rpc('mod_action', {
    p_session_id: args.sessionId,
    p_comment_id: args.commentId,
    p_action: args.action,
    p_note: args.note,
  })
  if (error) {
    const e = new Error(error.message) as Error & { code?: string; hint?: string }
    e.code = error.code
    e.hint = error.hint ?? undefined
    throw e
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('mod_action: no row returned')
  return {
    newStatus: row.new_status,
    actionId: Number(row.action_id),
  }
}
