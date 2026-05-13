export type PageReadAssertion = {
  expectStatus?: number
  expectH1Pattern?: RegExp
  expectVisible?: string[]
  expectNotVisible?: string[]
  expectNoConsoleErrors?: boolean
  expectNoHorizontalScroll?: boolean
  expectMetaDescription?: RegExp
  expectJsonLdType?: string
}

// Chrome assertions that hold for every URL — phase 19b contract.
// One <header> + one <footer> + brand mark + "Pantheon" wordmark in
// both + theme toggle in footer + the "an experiment" line is gone.
const chromeVisible = [
  '[data-testid=site-header]',
  '[data-testid=site-footer]',
  '[data-testid=site-footer-promise]',
]

export const pageReads: Record<string, PageReadAssertion> = {
  '/': {
    expectH1Pattern: /The seasons.*ranked.*no spoilers/i,
    expectVisible: [
      '[data-testid=hero]',
      '[data-testid=home-hero]',
      '[data-testid=home-hero-cover]',
      '[data-testid=home-cover-go]',
      '[data-testid=home-show-grid]',
      '[data-testid=home-list-grid]',
      ...chromeVisible,
    ],
  },
  '/shows': {
    expectH1Pattern: /Shows/i,
    expectJsonLdType: 'CollectionPage',
  },
  '/shows/[show]': {
    expectVisible: [
      '[data-testid=bullet]',
      '[data-testid=season-grid]',
      '[data-testid=shield-badge]',
      '[data-testid=show-hero]',
      '[data-testid=show-hero-cover]',
      '[data-testid=show-hero-stats]',
      '[data-testid=show-split]',
      '[data-testid=shifts-row]',
      '[data-testid=filter-bar]',
    ],
    expectNotVisible: [
      '[data-testid=show-facade-art]',
      '[data-testid=show-sigil-art]',
    ],
    expectJsonLdType: 'CollectionPage',
  },
  '/shows/[show]/canon': {
    expectH1Pattern: /Editor['’]s Canon/i,
    expectJsonLdType: 'ItemList',
  },
  '/shows/[show]/community': {
    expectH1Pattern: /Community Rank/i,
    expectJsonLdType: 'ItemList',
  },
  '/shows/[show]/season/[n]': {
    expectVisible: [
      '[data-testid=vote-pair]',
      '[data-testid=comment-thread]',
      '[data-testid=shield-badge]',
      '[data-testid=season-page-screen]',
      '[data-testid=season-body]',
      '[data-testid=season-lede]',
      '[data-testid=season-rank-row]',
      '[data-testid=rank-tag]',
    ],
    expectJsonLdType: 'Article',
  },
  '/themes': {
    expectH1Pattern: /Themed lists/i,
    expectJsonLdType: 'CollectionPage',
    expectVisible: [
      '[data-testid=wrap]',
      '[data-testid=lists-hero]',
      '[data-testid=lists-hero-stats]',
      '[data-testid=lists-stat-total]',
      '[data-testid=lists-stat-shows]',
      '[data-testid=lists-stat-revised]',
      '[data-testid=lists-filter-bar]',
      '[data-testid=lists-chip-all]',
      '[data-testid=lists-chip-tone]',
      '[data-testid=lists-chip-craft]',
      '[data-testid=lists-chip-era]',
      '[data-testid=lists-chip-single]',
      '[data-testid=lists-all-section]',
      '[data-testid=lists-group]',
    ],
  },
  '/themes/[theme]': {
    expectJsonLdType: 'ItemList',
  },
  '/about': {
    expectH1Pattern: /About/i,
  },
  '/terms': {
    expectH1Pattern: /Terms/i,
  },
  '/privacy': {
    expectH1Pattern: /Privacy/i,
  },
  '/sign-in': {
    expectH1Pattern: /Sign in/i,
    expectVisible: ['form[action*="auth"]'],
  },
  '/u/[handle]': {
    expectH1Pattern: /@/,
  },
  '/mod': {
    expectH1Pattern: /Moderation/i,
  },
  '/search': {
    expectH1Pattern: /Search/i,
    expectVisible: ['[data-testid=search-form]'],
  },
}
