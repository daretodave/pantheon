import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { search } from '@/lib/search'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'

// Phase 15 — search. Force-dynamic so the response varies by
// query; SSR keeps results indexable + shareable.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Search',
    description: 'Find a show, season, or themed list across Pantheon.',
    path: '/search',
  })
}

type SearchParams = { q?: string }

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = (await searchParams) ?? {}
  const rawQuery = typeof params.q === 'string' ? params.q : ''
  const query = rawQuery.trim()
  const hits = query.length > 0 ? search(query) : []

  return (
    <section
      className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 md:py-24"
      data-testid="search-page"
    >
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
          Search
        </h1>
        <p className="text-ink-2">
          Find a show, season, or themed list. The seasons, ranked. No spoilers.
        </p>
      </header>

      <SearchForm initialQuery={query} />

      {query.length === 0 ? (
        <p className="text-ink-2" data-testid="search-empty-state">
          Type a show name, season title, or theme to find it.
        </p>
      ) : (
        <SearchResults hits={hits} query={query} />
      )}
    </section>
  )
}
