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

// Phase 34: structural validation of an authored `canon.era_bands[]`
// against the show's aired-season span. The strict `content-check`
// invariant treats a non-empty return as a failure list. Rules:
//   1. each band's range is well-formed (start <= end);
//   2. bands are gap-free AND overlap-free once sorted by start —
//      adjacent ranges must abut exactly (prev.end + 1 === next.start);
//   3. the union of band ranges covers the full aired span
//      [minAiredYear, maxAiredYear] (a superset is fine — bands may
//      start before the first seeded season, e.g. The Challenge).
// Together (2) + (3) guarantee every aired season year falls in
// exactly one band. Absence of bands is NOT judged here — the caller
// decides whether absence is tolerated (lax) or required (strict).
export function validateEraBandCoverage(
  bands: EraBand[],
  airedYears: number[],
): string[] {
  if (bands.length === 0) return []
  const problems: string[] = []
  const sorted = [...bands].sort((a, b) => a.range[0] - b.range[0])

  for (const band of sorted) {
    if (band.range[0] > band.range[1]) {
      problems.push(
        `era band "${band.key}" has an inverted range [${band.range[0]}, ${band.range[1]}]`,
      )
    }
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (!prev || !cur) continue
    if (cur.range[0] === prev.range[0]) continue // inverted-range case already flagged
    const expected = prev.range[1] + 1
    if (cur.range[0] > expected) {
      problems.push(
        `era bands have a gap between "${prev.key}" (ends ${prev.range[1]}) and "${cur.key}" (starts ${cur.range[0]}) — ranges must abut`,
      )
    } else if (cur.range[0] < expected) {
      problems.push(
        `era bands "${prev.key}" (ends ${prev.range[1]}) and "${cur.key}" (starts ${cur.range[0]}) overlap — ranges must abut`,
      )
    }
  }

  if (airedYears.length > 0) {
    const minYear = Math.min(...airedYears)
    const maxYear = Math.max(...airedYears)
    const unionStart = sorted[0]?.range[0] ?? Number.POSITIVE_INFINITY
    const unionEnd =
      sorted[sorted.length - 1]?.range[1] ?? Number.NEGATIVE_INFINITY
    if (unionStart > minYear) {
      problems.push(
        `era bands start at ${unionStart} but the earliest aired season is ${minYear} — bands must cover the aired span`,
      )
    }
    if (unionEnd < maxYear) {
      problems.push(
        `era bands end at ${unionEnd} but the latest aired season is ${maxYear} — bands must cover the aired span`,
      )
    }
  }

  return problems
}
