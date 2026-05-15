export function CommunityMovers() {
  return (
    <section className="cp-movers" data-testid="community-movers">
      <div className="cp-movers-head">
        <h2>What moved this week.</h2>
        <span className="meta">Top changes · sentiment-tagged</span>
      </div>
      <div
        className="cp-movers-empty"
        data-testid="community-movers-empty"
        data-empty="true"
      >
        Movers populate once weekly recomputes start producing deltas. Until then, the
        community rank mirrors the canon and nothing has moved.
      </div>
    </section>
  )
}
