import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentInputStub } from '../CommentInputStub'

describe('<CommentInputStub>', () => {
  it('renders the sign-in prompt linking to /sign-in by default', () => {
    render(<CommentInputStub />)
    const link = screen.getByTestId('comment-stub-link')
    expect(link).toHaveAttribute('href', '/sign-in')
    expect(link.textContent).toContain('Sign in to comment')
    expect(link.textContent).toContain('No plot')
  })

  it('honors a custom signInHref', () => {
    render(<CommentInputStub signInHref="/sign-in?return=/x" />)
    expect(screen.getByTestId('comment-stub-link')).toHaveAttribute(
      'href',
      '/sign-in?return=/x',
    )
  })
})
