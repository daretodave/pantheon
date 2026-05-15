'use client'

import { useEffect, useState } from 'react'

type View = 'canon' | 'community'

type CanonTabSwitchProps = {
  initialView: View
  canonHref: string
  communityHref: string
}

const TABS: Array<{ key: View; marker: string; name: string; cap: string }> = [
  { key: 'canon', marker: '01', name: "Editor's Canon", cap: ' · curated' },
  { key: 'community', marker: '02', name: 'Community', cap: ' · live' },
]

export function CanonTabSwitch({
  initialView,
  canonHref,
  communityHref,
}: CanonTabSwitchProps) {
  const [view, setView] = useState<View>(initialView)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-canon-page-root]')
    if (root) root.dataset['view'] = view
  }, [view])

  function activate(next: View) {
    if (next === view) return
    setView(next)
    const href = next === 'canon' ? canonHref : communityHref
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', href)
    }
  }

  return (
    <div className="cp-tabs" role="tablist" data-testid="canon-tabs">
      {TABS.map((tab) => {
        const on = tab.key === view
        const href = tab.key === 'canon' ? canonHref : communityHref
        return (
          <a
            key={tab.key}
            href={href}
            role="tab"
            aria-selected={on}
            className={on ? 'cp-tab on' : 'cp-tab'}
            data-tab={tab.key}
            data-testid={`canon-tab-${tab.key}`}
            onClick={(e) => {
              e.preventDefault()
              activate(tab.key)
            }}
          >
            <span className="cp-tab-marker">{tab.marker}</span>
            <span>
              <span className="cp-tab-name">{tab.name}</span>
              <span className="cp-tab-cap">{tab.cap}</span>
            </span>
          </a>
        )
      })}
    </div>
  )
}
