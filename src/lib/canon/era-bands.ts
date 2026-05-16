import type { CanonEntry, EraBand, Season } from '@/content'

// Phase 33b: map a canon entry to one of the show's authored
// `canon.era_bands[]` by matching the season's premiere year against
// each band's inclusive [start, end] range. First match wins (bands
// are authored gap-free + ordered, but overlap-tolerant). Returns
// undefined when the year is unknown or no band covers it — the
// toolbar treats undefined as "no era" (only the All chip applies).

export function yearOfSeason(season: Season | undefined): number | undefined {
  if (!season?.premiere_date) return undefined
  const year = new Date(season.premiere_date).getUTCFullYear()
  return Number.isFinite(year) ? year : undefined
}

export function eraKeyForYear(
  year: number | undefined,
  bands: EraBand[],
): string | undefined {
  if (year == null) return undefined
  for (const band of bands) {
    if (year >= band.range[0] && year <= band.range[1]) return band.key
  }
  return undefined
}

export function makeEraOf(
  seasonOf: (entry: CanonEntry) => Season | undefined,
  bands: EraBand[],
): (entry: CanonEntry) => string | undefined {
  if (bands.length === 0) return () => undefined
  return (entry: CanonEntry) =>
    eraKeyForYear(yearOfSeason(seasonOf(entry)), bands)
}
