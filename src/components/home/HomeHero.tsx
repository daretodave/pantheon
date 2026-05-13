import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Show } from '@/content'
import { Bullet } from '@/components/atoms/Bullet'

type HomeHeroProps = {
  featured: Show
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

export function HomeHero({ featured }: HomeHeroProps) {
  const coverStyle = {
    background: featured.palette.paper,
    color: featured.palette.ink,
  } satisfies CSSProperties

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
          {renderBlurbWithBreaks(featured.blurb)}
        </p>
        <Link
          href={`/shows/${featured.slug}`}
          prefetch={false}
          className="cover-go"
          data-testid="home-cover-go"
          style={{ color: featured.palette.ink }}
        >
          <Bullet color={featured.palette.primary} size={10} />
          go to {featured.name}{' '}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-hero-copy">
        <div className="home-hero-eyebrow">Pantheon · est. 2026</div>
        <h1 className="home-hero-title">
          The seasons,
          <br />
          ranked. <em>no spoilers.</em>
        </h1>
        <p className="home-hero-blurb">
          Two rankings for every show. One written by an editor with the whole
          series in their head, one voted by the people who lived through it.
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
