// Canon rationales state where the canon places a season in prose
// ("the canon places it twelfth because…", "Borneo earns the third
// slot…"). That spoken ordinal must always equal the entry's slot
// position. When the canon order is reworked but the prose is not
// rebased, the two drift — a reader-visible correctness bug on the
// flagship page. These helpers extract the spoken ordinal so a
// content-check invariant can hold prose to the slot.

const ONES = [
  'zeroth',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
]

const TEENS = [
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
  'fourteenth',
  'fifteenth',
  'sixteenth',
  'seventeenth',
  'eighteenth',
  'nineteenth',
]

const TENS_CARDINAL: Record<number, string> = {
  2: 'twenty',
  3: 'thirty',
  4: 'forty',
  5: 'fifty',
}

const TENS_ORDINAL: Record<number, string> = {
  2: 'twentieth',
  3: 'thirtieth',
  4: 'fortieth',
  5: 'fiftieth',
}

/** Render 1–59 as its English ordinal word ("twenty-first"). */
export function numberToPlacementOrdinal(n: number): string | null {
  if (!Number.isInteger(n) || n < 1 || n > 59) return null
  if (n < 10) return ONES[n] ?? null
  if (n < 20) return TEENS[n - 10] ?? null
  const tens = Math.floor(n / 10)
  const ones = n % 10
  if (ones === 0) return TENS_ORDINAL[tens] ?? null
  const tensWord = TENS_CARDINAL[tens]
  const onesWord = ONES[ones]
  if (!tensWord || !onesWord) return null
  return `${tensWord}-${onesWord}`
}

const WORD_TO_NUMBER: Map<string, number> = (() => {
  const m = new Map<string, number>()
  for (let n = 1; n <= 59; n++) {
    const w = numberToPlacementOrdinal(n)
    if (w) m.set(w, n)
  }
  return m
})()

// Longest-first so "twenty-first" wins over "first".
const ORDS = [...WORD_TO_NUMBER.keys()]
  .sort((a, b) => b.length - a.length)
  .join('|')

// `Season one earns the second slot …` — Borneo's form.
const EARNS_RE = new RegExp(`\\bearns the (${ORDS}) slot\\b`)

// The definitive placement sentence: a `canon|tiered.tv places|ranks`
// marker, then the subject (`it`, `the season`, or a 1–4-word
// proper-noun name), then the ordinal *immediately*. Requiring
// adjacency is what makes this robust: a rationale often opens with a
// non-numeric placement ("the canon places it where the concept
// lands", "ranks it honestly", "places it last") and states the
// numeric slot in a later sentence ("The canon places it
// twenty-fifth because …"). Scanning for the first ordinal *anywhere*
// after a marker wrongly grabs stray ordinals from prose like
// "first-ever stops" or "fans cite first"; demanding the ordinal sit
// right after the subject reads only the definitive sentence. Markers
// and ordinals are lowercase as written; the name subject is
// capital-initial — so the regex is intentionally case-sensitive.
const PLACES_RE = new RegExp(
  `(?:tiered\\.tv|canon) (?:places|ranks) ` +
    `(?:it|the season|[A-ZÔŌ]\\S*(?: (?:vs\\.|del|of|the|[A-ZÔŌ]\\S*)){0,3}) ` +
    `(${ORDS})\\b`,
)

/**
 * The ordinal a canon rationale claims for itself, or `null` when the
 * prose states no numeric placement (e.g. "places it last",
 * "mid-canon"). Season-number ordinals ("the nineteenth season camps
 * on Upolu") and incidental ordinals ("first-ever stops") are never
 * the marker, so they are ignored.
 */
export function extractPlacementOrdinal(rationale: string): number | null {
  const text = rationale.replace(/\s+/g, ' ')

  const earns = EARNS_RE.exec(text)
  if (earns?.[1]) {
    const n = WORD_TO_NUMBER.get(earns[1])
    if (n != null) return n
  }

  const places = PLACES_RE.exec(text)
  if (places?.[1]) {
    const n = WORD_TO_NUMBER.get(places[1])
    if (n != null) return n
  }

  return null
}
