import Link from 'next/link'
import type { Metadata } from 'next'
import { auth0 } from '@/lib/auth0'
import { isMod } from '@/lib/auth0/permissions'
import { buildMetadata } from '@/lib/seo'
import { getModQueue } from '@/lib/supabase/mod'
import { ModQueue } from '@/components/mod/ModQueue'

// Phase 13 — the queue drains. SSR + force-dynamic because the
// ordering changes every action and ISR is inappropriate for an
// internal tool.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Moderation',
    description: 'Moderation queue for pantheon (mod role only).',
    path: '/mod',
    noIndex: true,
  })
}

export default async function ModPage() {
  const session = await auth0.getSession()
  const user = session?.user

  if (!user) {
    return (
      <section
        className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 md:py-24"
        data-testid="mod-signed-out"
      >
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
            Moderation
          </h1>
          <p className="text-ink-2">Sign in to continue.</p>
        </header>
        <Link
          href="/sign-in"
          prefetch={false}
          className="text-primary-base underline hover:opacity-80"
        >
          Sign in
        </Link>
      </section>
    )
  }

  if (!isMod(user)) {
    return (
      <section
        className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 md:py-24"
        data-testid="mod-not-authorized"
      >
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
            Moderation
          </h1>
          <p className="text-ink-2">
            Your account is signed in but doesn&rsquo;t have the moderation
            role.
          </p>
        </header>
        <p className="text-ink-1">
          If you should have access, ask the admin to grant the{' '}
          <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-sm text-ink-0">
            mod
          </code>{' '}
          role in the Auth0 dashboard.
        </p>
      </section>
    )
  }

  const items = await getModQueue()

  return (
    <section
      className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 md:py-24"
      data-testid="mod-queue-page"
    >
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
          Moderation
        </h1>
        <p className="text-ink-2">
          {items.length} item{items.length === 1 ? '' : 's'} in the queue.
          Every action writes a row to{' '}
          <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-sm text-ink-0">
            mod_actions
          </code>
          .
        </p>
      </header>

      <ModQueue items={items} />
    </section>
  )
}
