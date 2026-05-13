import type { ReactNode } from 'react'

export type ShowHeroStat = {
  value: string | number
  key: string
}

type ShowHeroProps = {
  // Left cover
  title: string
  blurb: string
  // Right meta column
  crumb: ReactNode
  stats?: ShowHeroStat[]
  tagline?: string
  shield?: ReactNode
}

// Phase 19c: two-column hero ported from
// design/Pantheon · Survivor.html §HERO. Left cover holds the big
// wordmark + serif italic sub; right meta column holds the crumb,
// the stats strip, the tagline, and the shield. The chrome is
// already tinted via the segment layout's <ShowPaletteScope>.

export function ShowHero({
  title,
  blurb,
  crumb,
  stats,
  tagline,
  shield,
}: ShowHeroProps) {
  return (
    <section className="show-hero" data-testid="show-hero" aria-label="show hero">
      <div className="show-hero-cover" data-testid="show-hero-cover">
        <h1 className="wordmark">{title}</h1>
        <p className="show-hero-sub">{blurb}</p>
      </div>
      <div className="show-hero-meta">
        <div className="show-hero-crumb">{crumb}</div>
        {stats && stats.length > 0 ? (
          <div className="show-hero-stats" data-testid="show-hero-stats">
            {stats.map((s) => (
              <div className="stat" key={s.key}>
                <span className="stat-val">{s.value}</span>
                <span className="stat-key">{s.key}</span>
              </div>
            ))}
          </div>
        ) : null}
        {tagline ? <p className="show-hero-line">{tagline}</p> : null}
        {shield}
      </div>
    </section>
  )
}
