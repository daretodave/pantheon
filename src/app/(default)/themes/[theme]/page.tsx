import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllThemes, getTheme } from '@/content'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

type Params = { theme: string }

export function generateStaticParams(): Params[] {
  return getAllThemes().map((theme) => ({ theme: theme.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const theme = getTheme(params.theme)
  if (!theme)
    return buildMetadata({
      title: 'Theme',
      description: '',
      path: `/themes/${params.theme}`,
      noIndex: true,
    })
  return buildMetadata({
    title: theme.title,
    description: theme.description,
    path: `/themes/${theme.slug}`,
  })
}

export default function ThemePage({ params }: { params: Params }) {
  const theme = getTheme(params.theme)
  if (!theme) notFound()
  const ld = buildJsonLd({
    type: 'ItemList',
    name: theme.title,
    description: theme.description,
    path: `/themes/${theme.slug}`,
    items: theme.entries.map((entry) => ({
      position: entry.rank,
      name: `${entry.show} S${entry.season}`,
      path: `/shows/${entry.show}/season/${entry.season}`,
      description: entry.blurb,
    })),
  })

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 md:py-24">
      <script {...jsonLdScriptProps({ id: 'ld-theme', data: ld })} />
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl leading-tight text-ink-0 md:text-5xl">
          {theme.title}
        </h1>
        <p className="text-ink-1">{theme.description}</p>
      </header>

      <ol className="flex flex-col gap-4">
        {theme.entries.map((entry) => (
          <li key={`${entry.show}-${entry.season}`} className="flex flex-col gap-1">
            <span className="font-mono text-xs text-ink-3">
              {entry.show} · S{entry.season}
            </span>
            <p className="font-serif text-base leading-relaxed text-ink-1">
              {entry.blurb}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
