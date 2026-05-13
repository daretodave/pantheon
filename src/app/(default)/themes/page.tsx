import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllThemes } from '@/content'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Themes',
    description: 'Cross-show themed rankings: best premieres, best finales, best post-merge runs, and more.',
    path: '/themes',
  })
}

export default function ThemesIndexPage() {
  const themes = getAllThemes()
  const ld = buildJsonLd({
    type: 'CollectionPage',
    name: 'Themes — pantheon',
    description: 'Cross-show themed rankings.',
    path: '/themes',
  })

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 md:py-24">
      <script {...jsonLdScriptProps({ id: 'ld-themes-index', data: ld })} />
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
          Themes
        </h1>
        <p className="font-serif text-lg text-ink-1">
          Cross-show rankings — patterns that cut across formats.
        </p>
      </header>

      {themes.length === 0 ? (
        <p className="text-ink-2">
          Themed lists haven&rsquo;t been added yet — this page populates as the loop ships them.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {themes.map((theme) => (
            <li key={theme.slug} className="rounded-lg border border-line-soft bg-paper-1 p-5">
              <Link
                href={`/themes/${theme.slug}`}
                prefetch={false}
                className="flex flex-col gap-2"
              >
                <h2 className="font-serif text-xl text-ink-0">{theme.title}</h2>
                <p className="text-sm text-ink-2">{theme.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
