import Link from 'next/link'
import type { ReactNode } from 'react'
import { SearchTrigger } from '@/components/search/SearchTrigger'

type TopNavLink = { href: string; label: string }

type TopNavTintedProps = {
  brand?: string
  links?: TopNavLink[]
  search?: ReactNode
  signIn?: ReactNode
}

const DEFAULT_LINKS: TopNavLink[] = [
  { href: '/shows', label: 'Shows' },
  { href: '/themes', label: 'Lists' },
  { href: '/about', label: 'About' },
]

export function TopNavTinted({
  brand = 'tiered.tv',
  links = DEFAULT_LINKS,
  search,
  signIn,
}: TopNavTintedProps) {
  return (
    <nav className="topnav tinted" data-testid="top-nav-tinted" aria-label="site">
      <Link href="/" className="topnav-brand" aria-label="tiered.tv home">
        <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
          <path d="M2 10 L12 3 L22 10" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <line x1="4" y1="12" x2="4" y2="21" stroke="currentColor" strokeWidth="1.4" />
          <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="1.4" />
          <line x1="20" y1="12" x2="20" y2="21" stroke="currentColor" strokeWidth="1.4" />
          <line x1="2" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>{brand}</span>
      </Link>
      <div className="topnav-links">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="topnav-right">
        {search ?? <SearchTrigger />}
        {signIn ?? (
          <Link className="topnav-signin" href="/sign-in">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
