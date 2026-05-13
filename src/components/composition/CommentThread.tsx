import type { ReactNode } from 'react'

type CommentThreadProps = {
  count?: number
  input: ReactNode
  children?: ReactNode
}

/**
 * CommentThread — the season-page aside.
 *
 * When `count > 0` and `children` are provided, renders the children
 * as the thread body and the count in the meta strip. When `count === 0`,
 * renders an honest empty-state line that invites the first comment
 * without referencing internal phase numbers or implementation status.
 */
export function CommentThread({ count = 0, input, children }: CommentThreadProps) {
  const hasComments = count > 0
  return (
    <div data-testid="comment-thread" className="comment-thread">
      <div className="aside-head">
        <h3>The thread</h3>
        <span className="aside-meta" data-testid="comment-count">
          {hasComments
            ? `${count} ${count === 1 ? 'comment' : 'comments'}`
            : 'Be the first'}
        </span>
      </div>
      {input}
      {hasComments ? (
        children
      ) : (
        <p
          className="comment-body"
          data-testid="comment-thread-empty"
          style={{ marginTop: 24, opacity: 0.7 }}
        >
          No comments yet. Weigh in on the season, not the result.
        </p>
      )}
    </div>
  )
}
