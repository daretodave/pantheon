import Link from 'next/link'
import type { ReactNode } from 'react'

type HomeMoreShowsProps = {
  children: ReactNode
  /** Number of compact tiles, surfaced in the "+ N more in the index" label. */
  count: number
}

export function HomeMoreShows({ children, count }: HomeMoreShowsProps) {
  return (
    <section data-testid="home-more-shows">
      <div className="sub-row">
        <span className="sub-row-label" data-testid="home-more-shows-label">
          + {count} more in the index
        </span>
        <Link href="/shows" prefetch={false} className="sub-row-link">
          Browse all →
        </Link>
      </div>
      <div className="shows-grid rest" data-testid="home-more-shows-grid">
        {children}
      </div>
    </section>
  )
}
