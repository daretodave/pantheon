import { getAllSeasons, getAllShows, getAllThemes, getFeaturedShow } from '@/content'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeShowGrid } from '@/components/home/HomeShowGrid'
import { HomeMoreShows } from '@/components/home/HomeMoreShows'
import { HomeDualCallout } from '@/components/home/HomeDualCallout'
import { HomeListsStack } from '@/components/home/HomeListsStack'
import { HomeListRow } from '@/components/home/HomeListRow'
import { ShowTile } from '@/components/home/ShowTile'
import { getCanonRevisedLabel } from '@/lib/home/canon-revised'

// Phase 27 — homepage rebuilt against `design/tiered.tv · Home.html`.
// Fluid hero + stat strip; 3-up featured tiles + a sub-row + 6 compact
// tiles below; dual-rank callout; themed-list stack. Color + type only.

export const dynamic = 'force-static'

const FEATURED_TILES = 3
const COMPACT_TILES = 6
const LIST_ROWS = 4

export default function HomePage() {
  const featured = getFeaturedShow()
  const allShows = getAllShows()
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
  const featuredShows = allShows.slice(0, FEATURED_TILES)
  const compactShows = allShows.slice(
    FEATURED_TILES,
    FEATURED_TILES + COMPACT_TILES,
  )
  const themes = getAllThemes().slice(0, LIST_ROWS)
  const canonRevisedLabel = getCanonRevisedLabel()

  return (
    <div className="screen home" data-testid="hero">
      {featured ? (
        <HomeHero
          featured={featured}
          canonRevisedLabel={canonRevisedLabel}
        />
      ) : null}

      <HomeShowGrid totalShows={allShows.length}>
        {featuredShows.map((show) => (
          <ShowTile
            key={show.slug}
            show={show}
            seasonCount={getAllSeasons(show.slug).length}
            variant="featured"
          />
        ))}
      </HomeShowGrid>

      {compactShows.length > 0 ? (
        <HomeMoreShows count={compactShows.length}>
          {compactShows.map((show) => (
            <ShowTile
              key={show.slug}
              show={show}
              seasonCount={getAllSeasons(show.slug).length}
              variant="compact"
            />
          ))}
        </HomeMoreShows>
      ) : null}

      <HomeDualCallout />

      <HomeListsStack>
        {themes.map((theme) => (
          <HomeListRow key={theme.slug} theme={theme} />
        ))}
      </HomeListsStack>
    </div>
  )
}
