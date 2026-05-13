import type { ModQueueItem } from '@/lib/supabase/mod'
import { ActionsBar } from './ModQueue.client'

type ModQueueProps = {
  items: ModQueueItem[]
}

export function ModQueue({ items }: ModQueueProps) {
  if (items.length === 0) {
    return (
      <div className="rounded border border-paper-3 p-6 text-ink-1" data-testid="mod-queue-empty">
        The queue is empty — no comments are pending review and no flags are open.
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4" data-testid="mod-queue">
      {items.map((item) => (
        <li
          key={item.id}
          data-testid="mod-queue-item"
          data-comment-id={item.id}
          data-status={item.status}
          data-flag-count={item.flagCount}
          className="flex flex-col gap-3 rounded border border-paper-3 p-4"
        >
          <header className="flex flex-wrap items-center gap-3 text-sm text-ink-2">
            <span className="font-mono">
              {item.targetType}:{item.targetId}
            </span>
            <span className="rounded bg-paper-2 px-2 py-0.5">{item.status}</span>
            {item.flagCount > 0 && (
              <span className="rounded bg-warm-down/20 px-2 py-0.5 text-warm-down">
                {item.flagCount} flag{item.flagCount === 1 ? '' : 's'}
              </span>
            )}
            <time className="ml-auto text-ink-3" dateTime={item.createdAt}>
              {item.createdAt.slice(0, 10)}
            </time>
          </header>
          <p
            className="whitespace-pre-wrap text-ink-1"
            data-testid="mod-queue-body"
          >
            {item.body}
          </p>
          <ActionsBar comment={item} />
        </li>
      ))}
    </ul>
  )
}
