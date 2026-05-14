import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Show } from '@/content'

type HomeHeroProps = {
  featured: Show
  /** "Seasons ranked" stat — defaults to `featured.seasons`. */
  seasonsRanked?: number
  /** "Canon revised" stat label — pre-formatted as `MM / YY`. */
  canonRevisedLabel: string
}

function renderBlurbWithBreaks(blurb: string) {
  const lines = blurb.split(/\n/)
  return lines.map((line, i) => (
    // eslint-disable-next-line react/no-array-index-key
    <span key={i}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ))
}

export function HomeHero({
  featured,
  seasonsRanked,
  canonRevisedLabel,
}: HomeHeroProps) {
  const coverStyle = {
    background: featured.palette.paper,
    color: featured.palette.ink,
  } satisfies CSSProperties

  const seasons = seasonsRanked ?? featured.seasons

  return (
    <section className="home-hero" data-testid="home-hero">
      <div
        className="home-hero-cover"
        data-testid="home-hero-cover"
        style={coverStyle}
      >
        <div className="cover-tag" data-testid="home-hero-eyebrow">
          Currently featured
        </div>
        <h2 className="cover-name" style={{ color: featured.palette.ink }}>
          {featured.name}
        </h2>
        <p className="cover-sub" style={{ color: featured.palette.ink }}>
          {renderBlurbWithBreaks(featured.tagline ?? featured.blurb)}
        </p>
        <div className="cover-foot" data-testid="home-hero-foot">
          <div className="cover-stats" data-testid="home-hero-stats">
            <div className="cover-stat">
              <div className="cover-stat-val">{seasons}</div>
              <div className="cover-stat-key">Seasons ranked</div>
            </div>
            <div className="cover-stat">
              <div
                className="cover-stat-val"
                data-testid="home-hero-canon-revised"
              >
                {canonRevisedLabel}
              </div>
              <div className="cover-stat-key">Canon revised</div>
            </div>
          </div>
          <Link
            href={`/shows/${featured.slug}`}
            prefetch={false}
            className="cover-go"
            data-testid="home-cover-go"
            style={{ color: featured.palette.ink }}
          >
            Go to {featured.name}{' '}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </div>
      <div className="home-hero-copy">
        <div className="home-hero-eyebrow">tiered.tv · est. 2026</div>
        <h1 className="home-hero-title">
          The seasons,
          <br />
          ranked. <em>no spoilers.</em>
        </h1>
        <p className="home-hero-blurb">
          Two rankings for every show. <b>One written by an editor</b> with the
          whole series in their head; <b>one voted by the readers</b> who lived
          through it. Every page is reviewed for spoilers before it goes live —
          so you can scroll without losing the season you&apos;re three episodes
          into.
        </p>
        <div className="home-hero-actions">
          <Link
            href="/shows"
            prefetch={false}
            className="btn-primary"
            data-testid="home-cta-shows"
          >
            Browse all shows
          </Link>
          <Link
            href="/about"
            prefetch={false}
            className="btn-ghost"
            data-testid="home-cta-about"
          >
            How it works
          </Link>
        </div>
      </div>
    </section>
  )
}
