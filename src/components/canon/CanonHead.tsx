import type { ReactNode } from 'react'
import type { Show } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'

type CanonHeadProps = {
  show: Show
  stats?: ReactNode
}

export function CanonHead({ show, stats }: CanonHeadProps) {
  return (
    <>
      <nav className="cp-crumb" data-testid="canon-crumb" aria-label="Breadcrumb">
        <Bullet color="var(--show-primary)" size={9} />
        <a href="/shows">Shows</a>
        <span className="sep">/</span>
        <a href={`/shows/${show.slug}`}>{show.name}</a>
        <span className="sep">/</span>
        <span className="here">The ranking</span>
      </nav>
      <header className="cp-head" data-testid="canon-head">
        <div className="cp-head-left">
          <div className="cp-head-eyebrow">
            <span className="cp-canon-only">01 · curated</span>
            <span className="cp-community-only">02 · live</span>
            <em> — {show.name}, ranked top to bottom.</em>
          </div>
          <h1 className="cp-head-h1" data-testid="canon-h1">
            <span className="canon">The Editor&rsquo;s Canon</span>
            <span className="alt">The Community Rank</span>
          </h1>
          <p className="cp-head-lede">
            <span className="cp-canon-only">
              One ranking, written by editors who have watched every season twice. We argue
              with the community out loud, in margins — but we ship one number.
            </span>
            <span className="cp-community-only">
              The list updates as the community votes. Until enough votes land, it mirrors
              the canon.
            </span>
          </p>
        </div>
        {stats ?? null}
      </header>
    </>
  )
}
