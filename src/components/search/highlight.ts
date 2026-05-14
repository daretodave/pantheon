// Splits `text` around case-insensitive occurrences of `query` so
// matched segments can be rendered as <mark>. Returns an alternating
// array of plain + match segments, starting with plain (may be empty).

export type HighlightSegment = { text: string; match: boolean }

export function highlightSegments(text: string, query: string): HighlightSegment[] {
  const q = query.trim()
  if (!q) return [{ text, match: false }]
  const lowerText = text.toLowerCase()
  const lowerQ = q.toLowerCase()
  const out: HighlightSegment[] = []
  let cursor = 0
  while (cursor < text.length) {
    const idx = lowerText.indexOf(lowerQ, cursor)
    if (idx === -1) {
      out.push({ text: text.slice(cursor), match: false })
      break
    }
    if (idx > cursor) out.push({ text: text.slice(cursor, idx), match: false })
    out.push({ text: text.slice(idx, idx + q.length), match: true })
    cursor = idx + q.length
  }
  return out
}
