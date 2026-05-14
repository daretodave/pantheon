// Custom event name dispatched by the header search trigger and
// listened to by the global <SearchHost>. A custom DOM event keeps
// the trigger button independent of the host's React state — the
// trigger doesn't need props, and host placement can move without
// rewiring the header.

export const SEARCH_OPEN_EVENT = 'tiered:search-open'

export function dispatchSearchOpen(): void {
  window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT))
}
