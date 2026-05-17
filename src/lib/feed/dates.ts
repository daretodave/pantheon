// Phase 32: deterministic publish-date derivation for RSS items.
//
// The phase row says "sorted by mtime or a `published` frontmatter
// field". There is no `published` field, and file mtime is the git
// *checkout* time in CI (every build == "now"), so mtime yields a
// non-deterministic, useless ordering. Feeds derive a stable date
// from existing frontmatter instead — see phase_32 brief Decision 1.

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseIsoDate(iso: string | undefined | null): Date | null {
  if (!iso || !ISO_RE.test(iso)) return null
  const d = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function yearStart(year: number): Date {
  return new Date(Date.UTC(year, 0, 1))
}

// premiere_date → aired_year-01-01 → show est_year-01-01.
// `est_year` is always present on the show contract, so this
// always resolves to a real Date.
export function seasonDate(
  season: { premiere_date?: string; aired_year?: number },
  showEstYear: number,
): Date {
  return (
    parseIsoDate(season.premiere_date) ??
    (season.aired_year != null ? yearStart(season.aired_year) : null) ??
    yearStart(showEstYear)
  )
}
