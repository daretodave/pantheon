export function HomeDualCallout() {
  return (
    <section className="dual" data-testid="home-dual-callout">
      <div className="dual-cell" data-testid="home-dual-curated">
        <div className="dual-tag">01 · Curated</div>
        <h3 className="dual-title">Editor&apos;s Canon</h3>
        <p className="dual-blurb">
          A single, ordered list written by an editor who has watched the whole
          show twice. <b>Stable, opinionated, signed.</b> Revised quarterly when
          a new season changes the math.
        </p>
      </div>
      <div className="dual-cell" data-testid="home-dual-live">
        <div className="dual-tag">02 · Live</div>
        <h3 className="dual-title">Community Rank</h3>
        <p className="dual-blurb">
          Two seasons at a time, voted by readers.{' '}
          <b>Pairwise. Restless. Honest.</b> The numbers shift each week. Every
          voter has watched both seasons end to end.
        </p>
      </div>
    </section>
  )
}
