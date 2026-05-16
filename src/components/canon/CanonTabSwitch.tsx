'use client'

import { useEffect, useState } from 'react'

type View = 'canon' | 'community'

type CanonTabSwitchProps = {
  initialView: View
}

const TABS: Array<{ key: View; marker: string; name: string; cap: string }> = [
  { key: 'canon', marker: '01', name: "Editor's Canon", cap: 'curated' },
  { key: 'community', marker: '02', name: 'Community', cap: 'live' },
]

// Phase 33: same-page toggle. The two-route canon/community split is
// gone — this flips `data-view` on the ranking root in place, syncs
// `?view=` + the `#canon`/`#community` hash via replaceState (no
// navigation), and on mount reconciles with `?view=` then the hash so
// a deep-link / 308 lands on the right pane. The page already SSRs
// both panes; CSS keys visibility off the root's `data-view`.
export function CanonTabSwitch({ initialView }: CanonTabSwitchProps) {
  const [view, setView] = useState<View>(initialView)

  useEffect(() => {
    function fromUrl(): View | null {
      if (typeof window === 'undefined') return null
      const q = new URLSearchParams(window.location.search).get('view')
      if (q === 'community' || q === 'canon') return q
      const h = window.location.hash.replace('#', '')
      if (h === 'community' || h === 'canon') return h
      return null
    }
    const next = fromUrl()
    if (next && next !== view) setView(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-canon-page-root]')
    if (root) root.dataset['view'] = view
  }, [view])

  function activate(next: View) {
    if (next === view) return
    setView(next)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (next === 'community') url.searchParams.set('view', 'community')
      else url.searchParams.delete('view')
      url.hash = next
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div className="cp-tabs" role="tablist" data-testid="canon-tabs">
      {TABS.map((tab) => {
        const on = tab.key === view
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            className={on ? 'cp-tab on' : 'cp-tab'}
            data-tab={tab.key}
            data-testid={`canon-tab-${tab.key}`}
            onClick={() => activate(tab.key)}
          >
            <span className="cp-tab-marker">{tab.marker}</span>
            <span>
              <span className="cp-tab-name">{tab.name}</span>
              <span className="cp-tab-cap">{tab.cap}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
