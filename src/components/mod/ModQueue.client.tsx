'use client'

import { useState, useTransition } from 'react'
import type { ModQueueItem } from '@/lib/supabase/mod'

type Action = 'approve' | 'hide' | 'remove' | 'unhide' | 'dismiss_flag'

type ActionsBarProps = {
  comment: ModQueueItem
}

async function postAction(body: { commentId: string; action: Action; note?: string }) {
  const res = await fetch('/api/mod/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  const text = await res.text()
  let parsed: { ok?: boolean; error?: string; status?: string }
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { error: text }
  }
  return { ok: res.ok, status: res.status, body: parsed }
}

export function ActionsBar({ comment }: ActionsBarProps) {
  const [pending, startTransition] = useTransition()
  const [, setLastError] = useState<string | null>(null)

  const fire = (action: Action) => {
    setLastError(null)
    startTransition(async () => {
      const r = await postAction({ commentId: comment.id, action })
      if (!r.ok) {
        setLastError(r.body?.error ?? `http ${r.status}`)
      } else {
        // Soft reload — keeps the audit honest.
        window.location.reload()
      }
    })
  }

  const buttonClass =
    'rounded border border-paper-3 px-3 py-1 text-sm hover:bg-paper-2 disabled:opacity-50'

  return (
    <div className="flex flex-wrap gap-2" data-testid="mod-actions">
      <button
        type="button"
        className={buttonClass}
        onClick={() => fire('approve')}
        disabled={pending || comment.status === 'published'}
        data-action="approve"
      >
        Approve
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => fire('hide')}
        disabled={pending || comment.status === 'hidden'}
        data-action="hide"
      >
        Hide
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => fire('remove')}
        disabled={pending || comment.status === 'removed'}
        data-action="remove"
      >
        Remove
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => fire('unhide')}
        disabled={pending || comment.status === 'published'}
        data-action="unhide"
      >
        Unhide
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => fire('dismiss_flag')}
        disabled={pending || comment.flagCount === 0}
        data-action="dismiss_flag"
      >
        Dismiss flag
      </button>
    </div>
  )
}
