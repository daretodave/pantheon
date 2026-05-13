import { FEATURED_SHOW_SLUG, getAllSeasons, getAllShows, getAllThemes, getShow } from '@/content'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeShowGrid } from '@/components/home/HomeShowGrid'
import { HomeListGrid } from '@/components/home/HomeListGrid'
import { ShowTile } from '@/components/home/ShowTile'
import { ListTile } from '@/components/home/ListTile'

// Phase 19e — homepage to spec. Split hero with featured-show cover
// + cold-search promise, Pantheons grid (3-up), themed lists rail
// (1-column). Color + type only; the chrome wrap is applied by the
// (default) layout — no full-bleed escape for the home page.

export const dynamic = 'force-static'

const FEATURED_TILES = 3

export default function HomePage() {
  const featured = getShow(FEATURED_SHOW_SLUG)
  const shows = getAllShows()
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, FEATURED_TILES)
  const themes = getAllThemes().slice(0, FEATURED_TILES)

  return (
    <div className="screen home" data-testid="hero">
      {featured ? <HomeHero featured={featured} /> : null}

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
