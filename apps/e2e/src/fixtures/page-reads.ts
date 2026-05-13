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

export const pageReads: Record<string, PageReadAssertion> = {
  '/': {
    expectH1Pattern: /Pantheon/,
    expectVisible: ['[data-testid=hero]'],
  },
  '/shows': {
    expectH1Pattern: /Shows/i,
    expectJsonLdType: 'CollectionPage',
  },
  '/shows/[show]': {
    expectVisible: [
      '[data-testid=facade]',
      '[data-testid=season-grid]',
      '[data-testid=shield-badge]',
      '[data-testid=show-hero]',
      '[data-testid=show-split]',
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
    ],
    expectJsonLdType: 'Article',
  },
  '/themes': {
    expectH1Pattern: /Themes/i,
    expectJsonLdType: 'CollectionPage',
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
}
