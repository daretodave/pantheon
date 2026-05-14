import Link from 'next/link'
import type { ReactNode } from 'react'

type HomeListsStackProps = {
  children: ReactNode
}

export function HomeListsStack({ children }: HomeListsStackProps) {
  return (
    <section className="home-lists" data-testid="home-list-section">
      <div className="section-head">
        <h2>
          Themed lists, <em>cross-canon.</em>
        </h2>
        <Link href="/themes" prefetch={false} className="section-link">
          All lists →
        </Link>
      </div>
      <div className="lists-stack" data-testid="home-lists-stack">
        <div className="lists-stack-inner">{children}</div>
      </div>
    </section>
  )
}
