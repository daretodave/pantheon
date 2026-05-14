import type { Season, Show } from '@/content'

export function computeYearsOnAir(
  seasons: readonly Pick<Season, 'premiere_date'>[],
  status: Show['status'],
): string {
  const years = seasons
    .map((s) => (s.premiere_date ? new Date(s.premiere_date).getUTCFullYear() : null))
    .filter((y): y is number => typeof y === 'number')
  if (years.length === 0) return '—'
  const min = Math.min(...years)
  if (status === 'airing') return `${min}–present`
  const max = Math.max(...years)
  if (min === max) return String(min)
  return `${min}–${max}`
}
