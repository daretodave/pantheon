export {
  __resetContentCache,
  getAllSeasons,
  getAllShows,
  getAllThemes,
  getCanon,
  getFeaturedThemes,
  getLegalDoc,
  getRelatedThemes,
  getSeason,
  getSeasonBySlug,
  getShow,
  getShowsForTheme,
  getTheme,
  getThemeStats,
  getThemesByCategory,
  loadAllContent,
} from './loaders'

export type { ThemeStats } from './loaders'

export { ContentValidationError } from './errors'

export type {
  CanonEntry,
  CanonFile,
  CommunityRankHint,
  EraBand,
  LegalDoc,
  Season,
  SeasonFrontmatter,
  Show,
  ShowFrontmatter,
  ShowTier,
  Theme,
  ThemeCategory,
  ThemeEntry,
  ThemeFrontmatter,
  ThemeSentiment,
  ThemeStatus,
  WatchListItem,
} from './schemas'

export { getFeaturedShow, getFeaturedShowSlug } from './featured'

export { setContentRoot } from './paths'
