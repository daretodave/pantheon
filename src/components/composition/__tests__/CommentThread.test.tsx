import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentThread } from '../CommentThread'

describe('<CommentThread>', () => {
  it('renders the thread head, count, input slot, and empty-state copy', () => {
    render(
      <CommentThread
        count={0}
        input={<div data-testid="input-slot">stub-input</div>}
      />,
    )
    expect(screen.getByTestId('comment-thread')).toBeInTheDocument()
    expect(screen.getByTestId('comment-count').textContent).toContain('0 comments')
    expect(screen.getByTestId('input-slot')).toBeInTheDocument()
    expect(screen.getByTestId('comment-thread-empty').textContent).toMatch(
      /haven['’]t been added/i,
    )
  })

  it('honors a non-zero count', () => {
    render(<CommentThread count={42} input={<div />} />)
    expect(screen.getByTestId('comment-count').textContent).toContain('42 comments')
  })
})
