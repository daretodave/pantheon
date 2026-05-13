import type { ReactNode } from 'react'

type CommentThreadProps = {
  count?: number
  input: ReactNode
}

export function CommentThread({ count = 0, input }: CommentThreadProps) {
  return (
    <div data-testid="comment-thread" className="comment-thread">
      <div className="aside-head">
        <h3>The thread</h3>
        <span className="aside-meta" data-testid="comment-count">
          {count} comments
        </span>
      </div>
      {input}
      <p
        className="comment-body"
        data-testid="comment-thread-empty"
        style={{ marginTop: 24, opacity: 0.7 }}
      >
        Comments haven&rsquo;t been added yet — this thread populates as readers sign in and
        weigh in.
      </p>
    </div>
  )
}
