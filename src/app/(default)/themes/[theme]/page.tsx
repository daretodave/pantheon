import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  type Show,
  getAllSeasons,
  getAllShows,
  getAllThemes,
  getRelatedThemes,
  getShow,
  getShowsForTheme,
  getTheme,
  getThemesByCategory,
  type Theme,
} from '@/content'
import { Wrap } from '@/components/chrome/Wrap'
import { AdjacentLists } from '@/components/lists/AdjacentLists'
import { ListDetailHero } from '@/components/lists/ListDetailHero'
import { ListEntryStack } from '@/components/lists/ListEntryStack'
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

function resolveRelated(theme: Theme): Theme[] {
  const direct = getRelatedThemes(theme, 2)
  if (direct.length >= 2) return direct
  const sameCat = getThemesByCategory()
    [theme.category].filter((t) => t.slug !== theme.slug)
    .filter((t) => !direct.some((d) => d.slug === t.slug))
  return [...direct, ...sameCat].slice(0, 2)
}

export default function ThemePage({ params }: { params: Params }) {
  const theme = getTheme(params.theme)
  if (!theme) notFound()

  const showSlugs = getShowsForTheme(theme)
  const allShows = getAllShows()
  const showsBySlug = new Map<string, Show>(
    allShows.map((s) => [s.slug, s]),
  )
  const heroShows: Show[] = showSlugs
    .map((slug) => getShow(slug))
    .filter((s): s is Show => s !== null)

  // 31a: build a `<show>:<season-number>` → slug map so the entry
  // stack and the JSON-LD self-links emit the canonical slug form.
  // theme.entries[].season stays numeric (cross-show join key); only
  // the rendered href flips.
  const seasonSlugByKey = new Map<string, string>()
  for (const showSlug of showSlugs) {
    for (const season of getAllSeasons(showSlug)) {
      seasonSlugByKey.set(`${showSlug}:${season.number}`, season.slug)
    }
  }
  const seasonHref = (showSlug: string, n: number): string => {
    const slug = seasonSlugByKey.get(`${showSlug}:${n}`)
    return slug ? `/shows/${showSlug}/season/${slug}` : `/shows/${showSlug}/season/${n}`
  }

  const related = resolveRelated(theme)

  const ld = buildJsonLd({
    type: 'ItemList',
    name: theme.title,
    description: theme.description,
    path: `/themes/${theme.slug}`,
    author: theme.curator,
    dateModified: theme.last_revised,
    items: theme.entries
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => ({
        position: entry.rank,
        name: `${showsBySlug.get(entry.show)?.name ?? entry.show} S${entry.season}: ${entry.title}`,
        path: seasonHref(entry.show, entry.season),
        description: entry.blurb,
      })),
  })

  return (
    <Wrap width="narrow">
      <script {...jsonLdScriptProps({ id: 'ld-theme', data: ld })} />
      <ListDetailHero theme={theme} shows={heroShows} />
      <ListEntryStack
        theme={theme}
        showsBySlug={showsBySlug}
        seasonSlugByKey={seasonSlugByKey}
      />
      <AdjacentLists theme={theme} related={related} />
    </Wrap>
  )
}
