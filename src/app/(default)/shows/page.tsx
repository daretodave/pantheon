import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllShows } from '@/content'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Shows',
    description: 'Every show covered by pantheon, with editor and community rankings side by side.',
    path: '/shows',
  })
}

export default function ShowsIndexPage() {
  const shows = getAllShows()
  const ld = buildJsonLd({
    type: 'CollectionPage',
    name: 'Shows — pantheon',
    description: 'Browse every covered show.',
    path: '/shows',
  })

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 md:py-24">
      <script {...jsonLdScriptProps({ id: 'ld-shows-index', data: ld })} />
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
          Shows
        </h1>
        <p className="font-serif text-lg text-ink-1">
          Every show pantheon covers, ranked two ways.
        </p>
      </header>

      {shows.length === 0 ? (
        <p className="text-ink-2">
          Shows haven&rsquo;t been added yet — this page populates as the loop ships them.
        </p>
      ) : (
        <ul
          data-testid="shows-grid"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {shows.map((show) => (
            <li key={show.slug} className="rounded-lg border border-line-soft bg-paper-1 p-5">
              <Link
                href={`/shows/${show.slug}`}
                prefetch={false}
                className="flex flex-col gap-2"
              >
                <h2 className="font-serif text-xl text-ink-0">{show.name}</h2>
                <p className="text-sm text-ink-2">{show.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
