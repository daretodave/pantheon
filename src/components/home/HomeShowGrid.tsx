import Link from 'next/link'
import type { ReactNode } from 'react'

type HomeShowGridProps = {
  children: ReactNode
  /** Number of shows in the index — feeds the section head copy. */
  totalShows: number
}

export function HomeShowGrid({ children, totalShows }: HomeShowGridProps) {
  return (
    <section className="home-shows" data-testid="home-show-section">
      <div className="section-head">
        <h2 data-testid="home-shows-heading">
          {totalShows} shows tracked. <em>Every season reviewed.</em>
        </h2>
        <Link href="/shows" prefetch={false} className="section-link">
          All shows →
        </Link>
      </div>
      <div className="shows-grid" data-testid="home-show-grid">
        {children}
      </div>
    </section>
  )
}
