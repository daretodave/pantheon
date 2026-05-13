import type { Metadata } from 'next'
import {
  getAllThemes,
  getFeaturedThemes,
  getShow,
  getShowsForTheme,
  getThemeStats,
  getThemesByCategory,
} from '@/content'
import type { Show, Theme } from '@/content'
import { Wrap } from '@/components/chrome/Wrap'
import { ListsHero } from '@/components/lists/ListsHero'
import { ListsFilterController } from '@/components/lists/ListsFilterController'
import { ListsFeaturedRow } from '@/components/lists/ListsFeaturedRow'
import { ListsAllSection } from '@/components/lists/ListsAllSection'
import type { FilterKey } from '@/lib/themes-format'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Themes',
    description:
      'Themed lists across every Pantheon canon — best premieres, best finales, cross-canon and single-show pantheons, organized by what they admire.',
    path: '/themes',
  })
}

function resolveShows(theme: Theme): Show[] {
  const slugs = getShowsForTheme(theme)
  const out: Show[] = []
  for (const slug of slugs) {
    const s = getShow(slug)
    if (s) out.push(s)
  }
  return out
}

export default function ThemesIndexPage() {
  const themes = getAllThemes()
  const stats = getThemeStats()
  const byCategory = getThemesByCategory()
  const featured = getFeaturedThemes(3)

  const showsByTheme: Record<string, Show[]> = {}
  for (const t of themes) showsByTheme[t.slug] = resolveShows(t)

  const counts: Record<FilterKey, number> = {
    all: themes.length,
    tone: byCategory.tone.length,
    craft: byCategory.craft.length,
    era: byCategory.era.length,
    single: byCategory.single.length,
  }

  const ld = {
    ...buildJsonLd({
      type: 'CollectionPage',
      name: 'Themes — pantheon',
      description: 'Themed lists across every Pantheon canon.',
      path: '/themes',
    }),
    numberOfItems: themes.length,
    hasPart: themes.slice(0, 10).map((t) => ({
      '@type': 'ItemList',
      name: t.title,
      url: `/themes/${t.slug}`,
    })),
  }

  if (themes.length === 0) {
    return (
      <Wrap>
        <script {...jsonLdScriptProps({ id: 'ld-themes-index', data: ld })} />
        <ListsHero stats={stats} />
        <p className="lists-all-wrap" style={{ paddingTop: 64, paddingBottom: 96 }}>
          Themed lists haven&rsquo;t shipped yet — this page populates as the loop drains the queue.
        </p>
      </Wrap>
    )
  }

  return (
    <Wrap>
      <script {...jsonLdScriptProps({ id: 'ld-themes-index', data: ld })} />
      <ListsHero stats={stats} />
      <ListsFilterController counts={counts}>
        <ListsFeaturedRow featured={featured} showsByTheme={showsByTheme} />
        <ListsAllSection
          byCategory={byCategory}
          showsByTheme={showsByTheme}
        />
      </ListsFilterController>
    </Wrap>
  )
}
