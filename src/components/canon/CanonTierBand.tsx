import type { CanonEntry, Season } from '@/content'
import {
  DEFAULT_TIER_HEADINGS,
  tierRangeLabel,
  type TierBand,
} from '@/lib/canon/tier-bands'
import { CanonHeroEntries } from './CanonHeroEntries'
import { CanonMidEntries } from './CanonMidEntries'
import { CanonCompactEntries } from './CanonCompactEntries'
import { CanonTailEntries } from './CanonTailEntries'

type CanonTierBandProps = {
  band: TierBand
  seasonHref: (entry: CanonEntry) => string
  seasonOf: (entry: CanonEntry) => Season | undefined
}

const TIER_HEADLINES: Record<TierBand['key'], string> = {
  S: 'The seasons that defend the show.',
  A: 'The seasons we would watch again next week.',
  B: 'The seasons that count.',
  C: 'The seasons we have made peace with.',
}

function bodyForBand(band: TierBand, seasonHref: CanonTierBandProps['seasonHref'], seasonOf: CanonTierBandProps['seasonOf']) {
  switch (band.key) {
    case 'S':
      return (
        <CanonHeroEntries
          entries={band.entries}
          seasonHref={seasonHref}
          seasonOf={seasonOf}
        />
      )
    case 'A':
      return (
        <CanonMidEntries
          entries={band.entries}
          seasonHref={seasonHref}
          seasonOf={seasonOf}
        />
      )
    case 'B':
      return <CanonCompactEntries entries={band.entries} seasonHref={seasonHref} />
    case 'C':
      return <CanonTailEntries entries={band.entries} seasonHref={seasonHref} />
  }
}

export function CanonTierBand({ band, seasonHref, seasonOf }: CanonTierBandProps) {
  const headline = TIER_HEADLINES[band.key]
  const blurb = band.blurb ?? DEFAULT_TIER_HEADINGS[band.key]
  const count =
    band.entries.length === 1
      ? 'one entry'
      : `${band.entries.length} entries`
  return (
    <section className="cp-tier" data-testid="canon-tier" data-tier={band.key}>
      <div className="cp-tier-head" data-testid="canon-tier-head">
        <div className="cp-tier-letter">{band.key}</div>
        <div className="cp-tier-mid">
          <h2>{headline}</h2>
          <p>{blurb}</p>
        </div>
        <div className="cp-tier-count">
          {tierRangeLabel(band)} · {count}
        </div>
      </div>
      {bodyForBand(band, seasonHref, seasonOf)}
    </section>
  )
}
