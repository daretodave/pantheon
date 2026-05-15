'use client'

// Phase 31c: FilterBar is a client-side chip switch that flips between
// canon and community season orderings on /shows/[show]. The host page
// renders both orderings in DOM, wrapped in an element carrying
// `data-season-ordering-host`. Chip clicks flip
// `data-active-filter` on that host and let CSS toggle visibility.
// URL state persists as `?view=canon|community` via
// history.replaceState — no soft navigation, no refetch.

import { useEffect, useRef, useState } from 'react'

export type FilterKey = 'canon' | 'community'

type FilterOption = {
  key: FilterKey
  label: string
}

type FilterBarProps = {
  options?: FilterOption[]
  activeKey?: FilterKey
  mode?: string
}

const DEFAULTS: FilterOption[] = [
  { key: 'canon', label: 'Canon' },
  { key: 'community', label: 'Community' },
]

const MODE_LABEL: Record<FilterKey, string> = {
  canon: 'canon order',
  community: 'community order',
}

function readInitialKey(defaultKey: FilterKey): FilterKey {
  if (typeof window === 'undefined') return defaultKey
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('view')
  if (raw === 'community' || raw === 'canon') return raw
  return defaultKey
}

function applyHost(active: FilterKey) {
  if (typeof document === 'undefined') return
  document
    .querySelectorAll<HTMLElement>('[data-season-ordering-host]')
    .forEach((el) => {
      el.dataset['activeFilter'] = active
    })
}

export function FilterBar({
  options = DEFAULTS,
  activeKey: initialKey = 'canon',
  mode,
}: FilterBarProps) {
  const [active, setActive] = useState<FilterKey>(initialKey)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    const fromUrl = readInitialKey(initialKey)
    setActive(fromUrl)
    applyHost(fromUrl)
  }, [initialKey])

  useEffect(() => {
    applyHost(active)
  }, [active])

  function onChip(next: FilterKey) {
    if (next === active) return
    setActive(next)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (next === 'canon') url.searchParams.delete('view')
      else url.searchParams.set('view', next)
      window.history.replaceState({}, '', url.toString())
    }
  }

  const modeLabel = mode ?? `view · ${MODE_LABEL[active]}`

  return (
    <div
      className="filter-bar"
      data-testid="filter-bar"
      data-active-filter={active}
    >
      <div className="filter-set" role="tablist" aria-label="season filter">
        {options.map((o) => {
          const isActive = o.key === active
          return (
            <button
              key={o.key}
              type="button"
              className={isActive ? 'chip on' : 'chip'}
              role="tab"
              aria-selected={isActive}
              data-filter={o.key}
              data-testid={`filter-chip-${o.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChip(o.key)}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <span className="filter-mode">{modeLabel}</span>
    </div>
  )
}
