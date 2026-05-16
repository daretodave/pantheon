// Phase 37: section of design/tiered.tv · Survivor.html §SHIFTS.
// The real shifts row reads a 72-hour rank-delta signal not wired
// until phase 35. Until then the section renders nothing at all —
// an empty "What changed this week." box plus its rule is permanent
// dead space, so we omit the whole surface while there are no cards.
// It returns automatically once phase 35 passes real `cards`.

type ShiftsRowProps = {
  // When the shifts pipeline lights up, this slot accepts the
  // rendered shift cards (one per recent rank change).
  cards?: React.ReactNode
}

export function ShiftsRow({ cards }: ShiftsRowProps) {
  if (!cards) return null
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
      <div className="shifts-row" data-testid="shifts-cards">
        {cards}
      </div>
    </section>
  )
}
