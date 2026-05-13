import Link from 'next/link'
import { Bullet } from '@/components/atoms/Bullet'

// Phase 19c: list matching
// design/Pantheon · Heroes vs. Villains.html §APPEARS-IN. One row per
// themed list or canon membership for this <show, season>.

export type AppearsInRow = {
  href: string
  name: string
  meta: string
}

type AppearsInListProps = {
  rows: AppearsInRow[]
}

export function AppearsInList({ rows }: AppearsInListProps) {
  if (rows.length === 0) return null
  return (
    <section
      className="appears-in"
      data-testid="appears-in"
      aria-labelledby="appears-in-heading"
    >
      <div className="appears-head" id="appears-in-heading">
        Also appears in
      </div>
      <div className="appears-list">
        {rows.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="appears-row"
            data-testid="appears-row"
          >
            <Bullet color="var(--show-primary)" size={9} />
            <span className="name">{r.name}</span>
            <span className="meta">{r.meta}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
