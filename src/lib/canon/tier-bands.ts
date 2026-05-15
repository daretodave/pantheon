import type { CanonEntry } from '@/content'

export type TierKey = 'S' | 'A' | 'B' | 'C'

export type TierBand = {
  key: TierKey
  entries: CanonEntry[]
  blurb?: string | null
}

const DEFAULT_BLURBS: Record<TierKey, string> = {
  S: 'The seasons that defend the show.',
  A: 'Deep canon. Seasons we trust to deliver.',
  B: 'Classic stalwarts and format landmarks.',
  C: 'The seasons whose texture is more historical than rewarding.',
}

export const DEFAULT_TIER_HEADINGS: Record<TierKey, string> = DEFAULT_BLURBS

export function tierKeyForRank(rank: number): TierKey {
  if (rank <= 5) return 'S'
  if (rank <= 15) return 'A'
  if (rank <= 30) return 'B'
  return 'C'
}

export type CanonTierBlurbs = {
  s?: string | null
  a?: string | null
  b?: string | null
  c?: string | null
}

export function buildTierBands(
  entries: CanonEntry[],
  blurbs: CanonTierBlurbs = {},
): TierBand[] {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank)
  const byTier: Record<TierKey, CanonEntry[]> = { S: [], A: [], B: [], C: [] }
  for (const e of sorted) byTier[tierKeyForRank(e.rank)].push(e)
  const blurbFor: Record<TierKey, string | undefined> = {
    S: blurbs.s ?? undefined,
    A: blurbs.a ?? undefined,
    B: blurbs.b ?? undefined,
    C: blurbs.c ?? undefined,
  }
  const out: TierBand[] = []
  for (const key of ['S', 'A', 'B', 'C'] as TierKey[]) {
    if (byTier[key].length === 0) continue
    out.push({ key, entries: byTier[key], blurb: blurbFor[key] ?? null })
  }
  return out
}

export function tierRangeLabel(band: TierBand): string {
  if (band.entries.length === 0) return ''
  const first = band.entries[0]?.rank ?? 0
  const last = band.entries.at(-1)?.rank ?? first
  const pad = (n: number) => String(n).padStart(2, '0')
  if (first === last) return pad(first)
  return `${pad(first)} — ${pad(last)}`
}
