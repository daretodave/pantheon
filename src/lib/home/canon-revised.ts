/**
 * The home hero's "Canon revised" stat — formatted as `MM / YY` to match
 * `design/tiered.tv · Home.html` ("04 / 26").
 *
 * Until a canon ships a `revised` frontmatter field, the value is the
 * current month (the home is `force-static`, so it's pinned at build).
 */
export function formatCanonRevisedLabel(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2).padStart(2, '0')
  return `${month} / ${year}`
}

export function getCanonRevisedLabel(now: Date = new Date()): string {
  return formatCanonRevisedLabel(now)
}
