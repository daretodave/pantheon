import Link from 'next/link'

type HomeHeroProps = {
  featuredShowName: string
}

// Phase 19a placeholder: copy-only hero. The split cover + featured
// show paper is rebuilt in phase 19e per design/Pantheon · Compositions.

export function HomeHero({ featuredShowName }: HomeHeroProps) {
  return (
    <section className="home-hero" data-testid="home-hero">
      <div className="home-hero-copy">
        <div className="home-hero-eyebrow" data-testid="home-hero-eyebrow">
          Currently featured · {featuredShowName}
        </div>
        <h1 className="home-hero-title">
          The seasons,
          <br />
          ranked. <em>No spoilers.</em>
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
