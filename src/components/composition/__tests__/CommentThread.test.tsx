import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentThread } from '../CommentThread'

describe('<CommentThread>', () => {
  it('renders the thread head, "Be the first" meta, input slot, and empty-state copy at count=0', () => {
    render(
      <CommentThread
        count={0}
        input={<div data-testid="input-slot">stub-input</div>}
      />,
    )
    expect(screen.getByTestId('comment-thread')).toBeInTheDocument()
    expect(screen.getByTestId('comment-count').textContent).toContain('Be the first')
    expect(screen.getByTestId('input-slot')).toBeInTheDocument()
    expect(screen.getByTestId('comment-thread-empty').textContent).toMatch(
      /no comments yet/i,
    )
  })

  it('renders the count and children when count > 0', () => {
    render(
      <CommentThread count={42} input={<div />}>
        <ul data-testid="thread-list">
          <li>x</li>
        </ul>
      </CommentThread>,
    )
    expect(screen.getByTestId('comment-count').textContent).toContain('42 comments')
    expect(screen.getByTestId('thread-list')).toBeInTheDocument()
    expect(screen.queryByTestId('comment-thread-empty')).toBeNull()
  })

  it('singularizes "1 comment" when count === 1', () => {
    render(
      <CommentThread count={1} input={<div />}>
        <span data-testid="lone-comment">solo</span>
      </CommentThread>,
    )
    expect(screen.getByTestId('comment-count').textContent).toContain('1 comment')
    expect(screen.getByTestId('comment-count').textContent).not.toContain('comments')
  })
})
