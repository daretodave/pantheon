import Link from 'next/link'
import { SearchTrigger } from '@/components/search/SearchTrigger'
import { BrandMark } from './BrandMark'
import type { HeaderUser } from './headerUser'

type HeaderViewProps = {
  tinted?: boolean
  user?: HeaderUser | null
}

export function HeaderView({ tinted = false, user = null }: HeaderViewProps) {
  const rootClass = tinted ? 'site-header tinted' : 'site-header'
  return (
    <header
      data-testid="site-header"
      data-tinted={tinted ? 'true' : undefined}
      data-signed-in={user ? 'true' : 'false'}
      className={rootClass}
    >
      <Link
        href="/"
        className="site-header-brand"
        aria-label="tiered.tv home"
        data-testid="site-header-brand"
      >
        <BrandMark size={22} />
        <span>tiered.tv</span>
      </Link>
      <nav aria-label="Primary" className="site-header-links">
        <Link href="/shows" prefetch={false}>
          Shows
        </Link>
        <Link href="/themes" prefetch={false}>
          Lists
        </Link>
        <Link href="/about" prefetch={false}>
          About
        </Link>
      </nav>
      <div className="site-header-right">
        <SearchTrigger />
        {user ? (
          <>
            <Link
              className="site-header-user"
              href={user.profileHref}
              prefetch={false}
              data-testid="site-header-user-link"
            >
              {user.displayLabel}
            </Link>
            <Link
              className="site-header-signin"
              href="/auth/logout?returnTo=/"
              prefetch={false}
              data-testid="site-header-signout-link"
            >
              Sign out
            </Link>
          </>
        ) : (
          <Link
            className="site-header-signin"
            href="/sign-in"
            prefetch={false}
            data-testid="site-header-signin-link"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
