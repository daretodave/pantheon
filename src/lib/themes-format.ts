import type { Theme, ThemeStatus } from '@/content'

export function formatRevisedYear(iso: string): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})/)
  return m?.[1] ?? iso
}

function dayDiff(fromIso: string, today: Date): number {
  const t = new Date(`${fromIso}T00:00:00Z`).getTime()
  const n = today.getTime()
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY
  return Math.floor((n - t) / 86_400_000)
}

export function formatRevisedAgo(iso: string, today: Date = new Date()): string {
  const diff = dayDiff(iso, today)
  if (diff <= 7) return 'this week'
  if (diff <= 31) return 'this month'
  return 'this year'
}

export function formatThemeStatus(
  status: ThemeStatus,
  lastRevised: string,
  today: Date = new Date(),
): string {
  switch (status) {
    case 'growing':
      return 'growing'
    case 'stable':
      return 'stable list'
    case 'updated':
      return `updated ${formatRevisedAgo(lastRevised, today)}`
    case 'started':
      return `started ${formatRevisedYear(lastRevised)}`
  }
}

export type FilterKey = 'all' | 'tone' | 'craft' | 'era' | 'single'

export const FILTER_KEYS: readonly FilterKey[] = [
  'all',
  'tone',
  'craft',
  'era',
  'single',
] as const

export const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  tone: 'By tone',
  craft: 'By craft',
  era: 'By era',
  single: 'Single-show',
}

export const GROUP_HEAD_LABELS: Record<Exclude<FilterKey, 'all'>, string> = {
  tone: 'By tone',
  craft: 'By craft',
  era: 'By era',
  single: 'Single-show pantheons',
}

export const FILTER_MODE_LABELS: Record<FilterKey, string> = {
  all: 'lists',
  tone: 'tone lists',
  craft: 'craft lists',
  era: 'era lists',
  single: 'single-show lists',
}

export function filterModeText(
  filter: FilterKey,
  counts: Record<FilterKey, number>,
): string {
  if (filter === 'all') {
    return `view · all ${counts.all} lists`
  }
  return `view · ${counts[filter]} ${FILTER_MODE_LABELS[filter]}`
}

export function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm
}

export function countShows(theme: Theme): number {
  const seen = new Set<string>()
  for (const e of theme.entries) seen.add(e.show)
  return seen.size
}
