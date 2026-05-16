'use client'

import { useEffect, useRef, useState } from 'react'
import type { EraBand } from '@/content'

// Phase 33b: era toolbar per `design/tiered.tv · Survivor.html`
// `.toolbar`. Chips: `All N` (preselected, always functional) + one
// per `canon.era_bands[]`. Filtering is CSS-toggle discipline — the
// server renders every entry with `data-era` and no hidden flag, so
// the full canon is always in the static HTML (SEO-safe, no DOM
// removal). A chip click sets `data-era-off` on entries whose
// `data-era` doesn't match (canon.css hides those) and writes
// `data-era-filter` on the page root for the visual + mode label.
// Era keys are per-show dynamic, so static CSS can't enumerate them;
// the boolean `data-era-off` attribute is the toggle CSS keys off.
// Graceful when `era_bands` is absent: only the All chip renders
// (a functional no-op).

type CanonEraToolbarProps = {
  bands: EraBand[]
  total: number
}

const ALL = 'all'

export function CanonEraToolbar({ bands, total }: CanonEraToolbarProps) {
  const [active, setActive] = useState<string>(ALL)
  const mountedRef = useRef(false)

  function apply(key: string) {
    if (typeof document === 'undefined') return
    const root = document.querySelector<HTMLElement>('[data-canon-page-root]')
    if (root) root.dataset['eraFilter'] = key
    const pane = document.querySelector<HTMLElement>(
      '[data-view-pane="canon"]',
    )
    if (!pane) return
    pane.querySelectorAll<HTMLElement>('[data-era]').forEach((el) => {
      const off = key !== ALL && el.dataset['era'] !== key
      if (off) el.dataset['eraOff'] = 'true'
      else delete el.dataset['eraOff']
    })
  }

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    apply(ALL)
  }, [])

  function onChip(key: string) {
    if (key === active) return
    setActive(key)
    apply(key)
  }

  const activeBand = bands.find((b) => b.key === active)
  const modeLabel = activeBand
    ? `${activeBand.label.toLowerCase()} only`
    : 'canon order'

  return (
    <div className="cp-toolbar" data-testid="canon-era-toolbar">
      <div
        className="cp-toolbar-left"
        role="tablist"
        aria-label="Filter the canon by era"
      >
        <button
          type="button"
          role="tab"
          aria-selected={active === ALL}
          className={active === ALL ? 'cp-chip on' : 'cp-chip'}
          data-filter={ALL}
          data-testid="era-chip-all"
          tabIndex={active === ALL ? 0 : -1}
          onClick={() => onChip(ALL)}
        >
          All {total}
        </button>
        {bands.map((band) => {
          const on = band.key === active
          return (
            <button
              key={band.key}
              type="button"
              role="tab"
              aria-selected={on}
              className={on ? 'cp-chip on' : 'cp-chip'}
              data-filter={band.key}
              data-testid={`era-chip-${band.key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => onChip(band.key)}
            >
              {band.label}
            </button>
          )
        })}
      </div>
      <div className="cp-toolbar-mode">
        view · <em data-testid="era-mode">{modeLabel}</em>
      </div>
    </div>
  )
}
