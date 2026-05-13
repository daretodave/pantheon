import Link from 'next/link'
import type { SearchHit } from '@/lib/search'
import { groupByType } from '@/lib/search'

type SearchResultsProps = {
  hits: SearchHit[]
  query: string
}

function HitCard({ hit }: { hit: SearchHit }) {
  return (
    <li
      className="flex flex-col gap-1 rounded border border-line-soft bg-paper-1 p-4"
      data-testid="search-hit"
      data-hit-type={hit.type}
    >
      <Link
        href={hit.href}
        prefetch={false}
        className="font-serif text-lg text-ink-0 hover:underline"
        data-testid="search-hit-link"
      >
        {hit.title}
      </Link>
      <p className="text-sm text-ink-2" data-testid="search-hit-snippet">
        {hit.snippet}
      </p>
    </li>
  )
}

function Group({
  label,
  hits,
  testId,
}: {
  label: string
  hits: SearchHit[]
  testId: string
}) {
  if (hits.length === 0) return null
  return (
    <section className="flex flex-col gap-3" data-testid={testId}>
      <h2 className="font-serif text-xl text-ink-0">{label}</h2>
      <ul className="flex flex-col gap-2">
        {hits.map((h) => (
          <HitCard key={`${h.type}:${h.href}`} hit={h} />
        ))}
      </ul>
    </section>
  )
}

export function SearchResults({ hits, query }: SearchResultsProps) {
  if (hits.length === 0) {
    return (
      <p
        className="text-ink-2"
        data-testid="search-empty-results"
      >
        No matches for &ldquo;{query}&rdquo;. Try a different word.
      </p>
    )
  }
  const groups = groupByType(hits)
  return (
    <div className="flex flex-col gap-8" data-testid="search-results">
      <Group label="Shows" hits={groups.shows} testId="search-group-shows" />
      <Group label="Seasons" hits={groups.seasons} testId="search-group-seasons" />
      <Group label="Themes" hits={groups.themes} testId="search-group-themes" />
    </div>
  )
}
