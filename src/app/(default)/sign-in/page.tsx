import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth0 } from '@/lib/auth0'
import { buildMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Sign in',
    description: 'Sign in to pantheon via magic link.',
    path: '/sign-in',
    noIndex: true,
  })
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ return?: string }>
}) {
  const session = await auth0.getSession()
  const params = (await searchParams) ?? {}
  const returnTo = params.return ?? '/'

  if (session?.user) {
    redirect(returnTo)
  }

  const loginHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`

  return (
    <section
      className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16 md:py-24"
      data-testid="sign-in-page"
    >
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl leading-tight text-ink-0 md:text-4xl">
          Sign in
        </h1>
        <p className="text-ink-2">
          Magic link via email. No passwords, no social. The link arrives in
          your inbox; click it to land back here, signed in.
        </p>
      </header>

      <form
        action={loginHref}
        method="get"
        className="flex flex-col gap-3"
        aria-label="Sign in with email"
        data-testid="sign-in-form"
      >
        <Link
          href={loginHref}
          prefetch={false}
          className="inline-flex items-center justify-center rounded border border-primary-base bg-primary-base px-4 py-3 text-sm font-medium text-paper-0 hover:opacity-90"
          data-testid="sign-in-continue"
        >
          Continue with email
        </Link>
      </form>

      <p className="text-xs text-ink-3">
        We use Auth0 magic links. Your email is only used to send the link.
      </p>
    </section>
  )
}
