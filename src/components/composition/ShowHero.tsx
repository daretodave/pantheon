import type { ReactNode } from 'react'

type ShowHeroProps = {
  crumb: ReactNode
  title: string
  lede: string
  art: ReactNode
  shield?: ReactNode
}

export function ShowHero({ crumb, title, lede, art, shield }: ShowHeroProps) {
  return (
    <section className="show-hero" data-testid="show-hero" aria-label="show hero">
      <div className="show-hero-art" data-testid="show-hero-art">
        {art}
      </div>
      <div className="show-hero-meta">
        <div className="show-hero-crumb">{crumb}</div>
        <h1 className="show-hero-title">{title}</h1>
        <p className="show-hero-line">{lede}</p>
        {shield}
      </div>
    </section>
  )
}
