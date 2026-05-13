// Phase 19c: stub of design/Pantheon · Survivor.html §SHIFTS. The
// real shifts row reads a 72-hour rank-delta signal that hasn't
// been wired yet (separate phase candidate). For 19c we render the
// section heading + an honest empty state, so the visual surface is
// complete without faking shift data.

type ShiftsRowProps = {
  // When the shifts pipeline lights up, this slot accepts the
  // rendered shift cards (one per recent rank change).
  cards?: React.ReactNode
}

export function ShiftsRow({ cards }: ShiftsRowProps) {
  const empty = !cards
  return (
    <section
      className="show-shifts"
      data-testid="shifts-row"
      aria-labelledby="shifts-heading"
    >
      <div className="section-head">
        <h2 id="shifts-heading">What changed this week.</h2>
        <span className="sec-meta">Updated Thursday · sentiment-tagged</span>
      </div>
      {empty ? (
        <p
          className="shifts-empty"
          data-testid="shifts-empty"
          aria-live="polite"
        >
          No shifts this week.
        </p>
      ) : (
        <div className="shifts-row" data-testid="shifts-cards">
          {cards}
        </div>
      )}
    </section>
  )
}
