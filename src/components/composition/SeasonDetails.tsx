// Phase 19c: 4-cell strip matching
// design/Pantheon · Heroes vs. Villains.html §SHELL.season-details.
// Hidden entirely when no details are available.

export type SeasonDetail = {
  key: string
  value: string
}

type SeasonDetailsProps = {
  details: SeasonDetail[]
}

export function SeasonDetails({ details }: SeasonDetailsProps) {
  if (details.length === 0) return null
  return (
    <div
      className="season-details"
      data-testid="season-details"
      aria-label="season details"
    >
      {details.map((d) => (
        <div className="detail" key={d.key} data-testid="season-detail">
          <div className="detail-key">{d.key}</div>
          <div className="detail-val">{d.value}</div>
        </div>
      ))}
    </div>
  )
}
