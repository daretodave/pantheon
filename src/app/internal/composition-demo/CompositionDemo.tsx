import {
  Column,
  Facade,
  Frieze,
  Ornament,
  PaletteScope,
  Pediment,
  Sigil,
} from '@/components/facade'
import {
  RankShiftPill,
  SeasonCard,
  SeasonGrid,
  SeasonHead,
  SeasonShell,
  ShieldBadge,
  ShowHero,
  ShowSplit,
  TopNavTinted,
} from '@/components/composition'

type DemoSeason = {
  n: number | string
  title: string
  tag: string
  shift?: { delta: number; sentiment: 'warm-up' | 'warm-down' | 'neutral' | 'hold' }
}

const SEASONS: DemoSeason[] = [
  { n: 20, title: 'Heroes vs. Villains', tag: 'the format at its loudest', shift: { delta: 3, sentiment: 'warm-up' } },
  { n: 1, title: 'Borneo', tag: 'the genre, invented mid-air', shift: { delta: 0, sentiment: 'hold' } },
  { n: 7, title: 'Pearl Islands', tag: 'pirates, marooning, theater' },
  { n: 16, title: 'Micronesia: Fans vs. Favorites', tag: 'the meta-season that earned it', shift: { delta: 2, sentiment: 'warm-up' } },
  { n: 28, title: 'Cagayan', tag: 'three tribes, no quiet hour', shift: { delta: -2, sentiment: 'warm-down' } },
  { n: 32, title: 'Kaôh Rōng', tag: 'the harshest production yet' },
]

function FacadeArt() {
  return (
    <Facade title="Survivor facade">
      <Pediment />
      <Frieze />
      <Column position="left" />
      <Column position="center" />
      <Column position="right" />
      <Ornament cx={200} cy={500} />
      <Ornament cx={600} cy={500} />
      <Ornament cx={1000} cy={500} />
    </Facade>
  )
}

function ShowHomeComposition() {
  return (
    <section aria-labelledby="demo-show-home">
      <h2 id="demo-show-home" className="demo-heading">
        2. Show home composition (ShowHero + ShowSplit + SeasonGrid)
      </h2>
      <PaletteScope show="survivor">
        <div className="screen show-home" data-testid="demo-show-home-screen">
          <TopNavTinted />
          <ShowHero
            crumb="Pantheons / Survivor"
            title="Survivor"
            lede="47 seasons of strangers on a beach. We've ranked every single one. No spoilers, no exceptions."
            art={<FacadeArt />}
            shield={<ShieldBadge />}
          />
          <ShowSplit
            canon={{
              href: '/shows/survivor/canon',
              tag: '01 · CURATED',
              title: "Editor's Canon",
              blurb: 'One ranking, written by someone who has seen every season twice.',
              go: 'Read the canon →',
            }}
            community={{
              href: '/shows/survivor/community',
              tag: '02 · LIVE',
              title: 'Community Rank',
              blurb: 'Voted weekly by 41,000 readers. Updated as the votes come in.',
              go: 'See the vote →',
            }}
          />
          <section className="show-seasons">
            <div className="section-head">
              <h2>All seasons, ranked</h2>
            </div>
            <SeasonGrid>
              {SEASONS.map((s, i) => (
                <SeasonCard
                  key={s.n}
                  rank={i + 1}
                  title={s.title}
                  tag={s.tag}
                  seasonNumber={s.n}
                  href={`/shows/survivor/season/${s.n}`}
                  shift={s.shift ?? null}
                />
              ))}
            </SeasonGrid>
          </section>
        </div>
      </PaletteScope>
    </section>
  )
}

function SeasonPageComposition() {
  return (
    <section aria-labelledby="demo-season-page">
      <h2 id="demo-season-page" className="demo-heading">
        3. Season page composition (SeasonShell + SeasonHead)
      </h2>
      <PaletteScope show="survivor">
        <div className="screen season-page" data-testid="demo-season-page-screen">
          <TopNavTinted />
          <SeasonShell
            main={
              <>
                <SeasonHead
                  crumb={
                    <>
                      Pantheons / Survivor / <span>Season 20</span>
                    </>
                  }
                  sigil={
                    <Sigil size={56} title="Survivor sigil">
                      <Pediment />
                      <Column position="center" />
                    </Sigil>
                  }
                  title="Heroes vs. Villains"
                  rankRow={
                    <>
                      <div className="season-rank-tag">
                        <span className="season-rank-label">Editor's Canon</span>
                        <span className="season-rank-num">#07</span>
                      </div>
                      <div className="season-rank-tag">
                        <span className="season-rank-label">Community</span>
                        <span className="season-rank-num">#04</span>
                        <RankShiftPill delta={3} sentiment="warm-up" />
                      </div>
                      <ShieldBadge inline />
                    </>
                  }
                />
                <div className="season-body">
                  <p className="season-lede">
                    A returnees season that finally let the format show what it could really do.
                  </p>
                  <p>
                    Twenty veterans, ten cast as heroes and ten as villains, sent back to Samoa with
                    no patience for the early-game small-talk. The first day plays like the eighth
                    day of any other season.
                  </p>
                </div>
              </>
            }
            aside={
              <>
                <div className="aside-head">
                  <h3>The thread</h3>
                  <span className="aside-meta">412 comments</span>
                </div>
                <p style={{ fontSize: 13, opacity: 0.7 }}>
                  Comment input + thread land in phase 9. Aside slot reserved.
                </p>
              </>
            }
          />
        </div>
      </PaletteScope>
    </section>
  )
}

function HomeTileComposition() {
  return (
    <section aria-labelledby="demo-home-tile">
      <h2 id="demo-home-tile" className="demo-heading">
        1. Home composition (show tile, list teaser)
      </h2>
      <div className="screen" data-testid="demo-home-tile-screen">
        <TopNavTinted />
        <div className="home-show-grid">
          <PaletteScope show="survivor">
            <a className="show-tile" href="/shows/survivor" data-testid="demo-show-tile">
              <div className="show-tile-art">
                <Sigil size={96} title="Survivor sigil">
                  <Pediment />
                  <Column position="center" />
                </Sigil>
              </div>
              <div>
                <div className="show-tile-name">Survivor</div>
                <div className="show-tile-blurb">47 seasons. One torch at a time.</div>
                <div className="show-tile-meta">
                  <span>47 seasons · ranked</span>
                  <span className="show-tile-arrow">→</span>
                </div>
              </div>
            </a>
          </PaletteScope>
        </div>
        <div className="home-list-grid">
          <a className="list-tile" href="/themes/best-finales">
            <span
              className="list-tile-dot"
              style={{ background: 'var(--color-sentiment-warm-down)' }}
            />
            <div>
              <div className="list-tile-title">The 12 most reviled finales</div>
              <div className="list-tile-meta">reality · cross-show · 12 entries</div>
            </div>
            <span className="list-tile-arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export function CompositionDemo() {
  return (
    <article style={{ padding: '32px 16px', maxWidth: 1200, margin: '0 auto' }}>
      <h1>Composition primitives — demo</h1>
      <p>
        Three real-screen compositions assembled from the phase 4a primitives, scoped to the
        Survivor palette via <code>&lt;PaletteScope show=&quot;survivor&quot;&gt;</code>.
      </p>
      <HomeTileComposition />
      <ShowHomeComposition />
      <SeasonPageComposition />
    </article>
  )
}
