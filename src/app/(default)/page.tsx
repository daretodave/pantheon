import { getAllSeasons, getAllShows, getAllThemes, getShow } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeShowGrid } from '@/components/home/HomeShowGrid'
import { HomeListGrid } from '@/components/home/HomeListGrid'
import { ShowTile } from '@/components/home/ShowTile'
import { ListTile } from '@/components/home/ListTile'

// Phase 16 — home page hero. The cold-search landing surface.
// Static across the board: content is build-time stable, so SSR
// adds nothing.

export const dynamic = 'force-static'

const FEATURED_SHOW_SLUG = 'survivor'
const FEATURED_MAX = 5

export default function HomePage() {
  const featured = getShow(FEATURED_SHOW_SLUG)
  const shows = getAllShows()
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, FEATURED_MAX)
  const themes = getAllThemes().slice(0, FEATURED_MAX)

  return (
    <div className="screen home" data-testid="hero">
      <ShowPaletteScope show={FEATURED_SHOW_SLUG}>
        <HomeHero featuredShowName={featured?.name ?? 'Pantheon'} />
      </ShowPaletteScope>

      <HomeShowGrid>
        {shows.map((show) => (
          <ShowTile
            key={show.slug}
            show={show}
            seasonCount={getAllSeasons(show.slug).length}
          />
        ))}
      </HomeShowGrid>

      <HomeListGrid>
        {themes.map((theme) => (
          <ListTile key={theme.slug} theme={theme} />
        ))}
      </HomeListGrid>
    </div>
  )
}
