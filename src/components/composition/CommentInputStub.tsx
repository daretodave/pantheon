import Link from 'next/link'

type CommentInputStubProps = {
  signInHref?: string
}

export function CommentInputStub({ signInHref = '/sign-in' }: CommentInputStubProps) {
  return (
    <div className="comment" data-testid="comment-input">
      <Link
        href={signInHref}
        className="comment-stub"
        prefetch={false}
        data-testid="comment-stub-link"
      >
        <span>Sign in to comment.</span>
        <span className="comment-stub-mono">No plot, no winners, no twists →</span>
      </Link>
    </div>
  )
}
