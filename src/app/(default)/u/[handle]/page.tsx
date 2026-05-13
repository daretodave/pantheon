import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { buildMetadata } from '@/lib/seo'

type Params = { handle: string }

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: Params }): Metadata {
  return buildMetadata({
    title: `@${params.handle}`,
    description: `Profile of @${params.handle} on pantheon.`,
    path: `/u/${params.handle}`,
    noIndex: true,
  })
}

function handleFromSession(user: Record<string, unknown> | null | undefined): string | null {
  if (!user) return null
  const nickname = typeof user['nickname'] === 'string' ? user['nickname'] : null
  if (nickname) return nickname.replace(/^@+/, '')
  const email = typeof user['email'] === 'string' ? user['email'] : null
  if (email) return email.split('@')[0] ?? null
  const sub = typeof user['sub'] === 'string' ? user['sub'] : null
  if (sub) return sub.replace(/[^a-z0-9-]/gi, '-').slice(0, 32)
  return null
}

export default async function UserProfilePage({ params }: { params: Params }) {
  const handle = params.handle?.toLowerCase()
  if (!handle) notFound()

  const session = await auth0.getSession()
  const sessionHandle = handleFromSession(session?.user as Record<string, unknown> | undefined)
  const isOwn = sessionHandle ? sessionHandle.toLowerCase() === handle : false

  // Pre-real-users-table: only the signed-in viewer's own profile
  // renders. Other handles 404 until phase 12 lights up real
  // users table writes.
  if (!isOwn && !session) notFound()

  return (
    <section
      className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 md:py-24"
      data-testid="user-profile"
      data-handle={handle}
    >
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
          @{handle}
        </h1>
        <p className="text-ink-2">
          {isOwn
            ? 'Your public profile. Activity surfaces here as you vote and comment.'
            : 'Public profile. Activity surfaces here as the member votes and comments.'}
        </p>
      </header>

      <p className="text-ink-2" data-testid="user-profile-status">
        {session ? 'Signed in.' : 'Sign in to see your activity here.'}
      </p>
    </section>
  )
}
