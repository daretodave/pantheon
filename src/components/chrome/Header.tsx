import Link from 'next/link'
import { Wordmark } from './Wordmark'

export function Header() {
  return (
    <header className="border-b border-line-soft bg-paper-1">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Wordmark />
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm text-ink-2">
          <Link
            href="/search"
            prefetch={false}
            className="text-ink-1 hover:text-ink-0"
            data-testid="header-search-link"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  )
}
