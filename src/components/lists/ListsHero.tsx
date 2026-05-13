import type { ThemeStats } from '@/content'
import { formatRevisedYear, plural } from '@/lib/themes-format'

type ListsHeroProps = {
  stats: ThemeStats
}

export function ListsHero({ stats }: ListsHeroProps) {
  const lede = `${stats.total} ${plural(stats.total, 'piece', 'pieces')} of editorial opinion, organized by the part of the craft they admire. Some span every show. Some live inside one. None of them spoil what they rank.`

  return (
    <header className="lists-hero" data-testid="lists-hero">
      <div className="lists-hero-eyebrow">Pantheon / Lists</div>
      <h1 className="lists-hero-title">
        Themed lists.
        <br />
        <em>Cross-canon.</em>
      </h1>
      <p className="lists-hero-lede">{lede}</p>
      <div className="lists-hero-stats" data-testid="lists-hero-stats">
        <div className="lists-stat" data-testid="lists-stat-total">
          <div className="lists-stat-val">{stats.total}</div>
          <div className="lists-stat-key">{plural(stats.total, 'List', 'Lists')}</div>
        </div>
        <div className="lists-stat" data-testid="lists-stat-shows">
          <div className="lists-stat-val">{stats.showsCovered}</div>
          <div className="lists-stat-key">Shows covered</div>
        </div>
        <div className="lists-stat" data-testid="lists-stat-revised">
          <div className="lists-stat-val">
            {formatRevisedYear(stats.lastIndexRevision)}
          </div>
          <div className="lists-stat-key">Index last revised</div>
        </div>
      </div>
    </header>
  )
}
