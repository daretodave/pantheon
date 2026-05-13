import type { ReactNode } from 'react'

type ShowHeroProps = {
  crumb: ReactNode
  title: string
  lede: string
  shield?: ReactNode
}

// Phase 19a placeholder: the rich hero (full-bleed paper,
// wordmark + meta column) is rebuilt in phase 19c against
// design/Pantheon · Survivor.html.

export function ShowHero({ crumb, title, lede, shield }: ShowHeroProps) {
  return (
    <section className="show-hero" data-testid="show-hero" aria-label="show hero">
      <div className="show-hero-meta">
        <div className="show-hero-crumb">{crumb}</div>
        <h1 className="show-hero-title">{title}</h1>
        <p className="show-hero-line">{lede}</p>
        {shield}
      </div>
    </section>
  )
}
