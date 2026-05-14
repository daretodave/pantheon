'use client'

import { dispatchSearchOpen } from './events'

// Header search button. Replaces the legacy `<Link href="/search">`.
// The button dispatches a custom event that <SearchHost> listens to
// — no shared React context required so the host can sit in any
// layout the trigger doesn't directly nest under.
export function SearchTrigger() {
  return (
    <button
      type="button"
      className="site-header-search"
      data-testid="site-header-search-trigger"
      aria-label="Open search"
      onClick={dispatchSearchOpen}
    >
      <span aria-hidden="true">⌕</span> Search
      <span className="site-header-search-kbd" aria-hidden="true">
        ⌘K
      </span>
    </button>
  )
}
