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
// One <header> + one <footer> + brand mark + "tiered.tv" wordmark in
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
      '[data-testid=home-hero-stats]',
      '[data-testid=home-cover-go]',
      '[data-testid=home-show-grid]',
      '[data-testid=home-more-shows]',
      '[data-testid=home-dual-callout]',
      '[data-testid=home-lists-stack]',
      ...chromeVisible,
    ],
  },
  '/shows': {
    expectH1Pattern: /All shows/i,
    expectJsonLdType: 'CollectionPage',
    expectVisible: [
      '[data-testid=shows-tiered]',
      '[data-testid=shows-hero]',
      '[data-testid=shows-hero-stats]',
      '[data-testid=shows-stat-shows]',
      '[data-testid=shows-stat-seasons]',
      '[data-testid=shows-stat-revised]',
      '[data-testid=tier-section]',
      '[data-testid=tier-head]',
      '[data-testid=tier-glyph]',
      '[data-testid=shows-tile]',
      '[data-testid=how-tiers-move]',
    ],
  },
  '/shows/[show]': {
    // Phase 33: consolidated show page — hero + the ranking
    // (sticky tabs, canon pane SSR'd + community pane SSR'd) + themed
    // lists. Both panes are in the DOM regardless of active view (CSS
    // toggles visibility), so the smoke walker asserts the canon pane
    // visible (default view) and the ranking scaffold present.
    // Phase 37 nit 4: the shifts section is absent until phase 35
    // wires the 72-hour signal — not a required selector.
    expectVisible: [
      '[data-testid=bullet]',
      '[data-testid=shield-badge]',
      '[data-testid=show-hero]',
      '[data-testid=show-hero-cover]',
      '[data-testid=show-hero-stats]',
      '[data-testid=show-ranking][data-view=canon]',
      '[data-testid=ranking-intro]',
      '[data-testid=canon-tabs]',
      '[data-testid=canon-view-pane]',
    ],
    expectNotVisible: [
      '[data-testid=show-facade-art]',
      '[data-testid=show-sigil-art]',
      '[data-testid=show-split]',
    ],
    expectJsonLdType: 'CollectionPage',
  },
  '/shows/[show]/season/[slug]': {
    expectVisible: [
      '[data-testid=season-page-screen]',
      '[data-testid=season-hero]',
      '[data-testid=season-h1]',
      '[data-testid=season-lede]',
      '[data-testid=info-card]',
      '[data-testid=info-row-canon]',
      '[data-testid=info-row-vote]',
      '[data-testid=info-row-shield]',
      '[data-testid=vote-pair]',
      '[data-testid=season-thread]',
      '[data-testid=comment-thread]',
      '[data-testid=season-article]',
      '[data-testid=section-take]',
      '[data-testid=section-where]',
      '[data-testid=shield-badge]',
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
    expectVisible: [
      '[data-testid=wrap][data-width=narrow]',
      '[data-testid=list-hero]',
      '[data-testid=list-title]',
      '[data-testid=list-tagline]',
      '[data-testid=list-meta]',
      '[data-testid=list-meta-entries]',
      '[data-testid=list-meta-spans]',
      '[data-testid=list-meta-curator]',
      '[data-testid=list-meta-revised]',
      '[data-testid=list-tools]',
      '[data-testid=list-save]',
      '[data-testid=list-share]',
      '[data-testid=list-suggest]',
      '[data-testid=list-shield]',
      '[data-testid=list-entries]',
      '[data-testid=list-entry-stack]',
      '[data-testid=list-entry]',
    ],
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
}
