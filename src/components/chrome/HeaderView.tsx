import Link from 'next/link'
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
        aria-label="Pantheon home"
        data-testid="site-header-brand"
      >
        <BrandMark size={22} />
        <span>Pantheon</span>
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
        <Link
          className="site-header-search"
          href="/search"
          prefetch={false}
          data-testid="site-header-search-link"
        >
          <span aria-hidden="true">⌕</span> Search
        </Link>
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
