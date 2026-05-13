// Phase 19c: presentational filter bar matching
// design/Pantheon · Survivor.html §FILTERS. The three chips are
// rendered as <button>s with `data-active-filter` markup so SEO sees
// a stable default order; real filter wiring (a per-tab data sort)
// is a separate phase candidate. For 19c, clicks are no-ops — the
// chips communicate ambition without lying about coverage.

type FilterOption = {
  key: string
  label: string
}

type FilterBarProps = {
  options?: FilterOption[]
  activeKey?: string
  mode?: string
}

const DEFAULTS: FilterOption[] = [
  { key: 'canon', label: 'Canon' },
  { key: 'community', label: 'Community' },
  { key: 'era', label: 'By era' },
]

export function FilterBar({
  options = DEFAULTS,
  activeKey = 'canon',
  mode = 'view · canon order',
}: FilterBarProps) {
  return (
    <div
      className="filter-bar"
      data-testid="filter-bar"
      data-active-filter={activeKey}
    >
      <div className="filter-set" role="tablist" aria-label="season filter">
        {options.map((o) => {
          const active = o.key === activeKey
          return (
            <button
              key={o.key}
              type="button"
              className={active ? 'chip on' : 'chip'}
              role="tab"
              aria-selected={active}
              data-filter={o.key}
              tabIndex={active ? 0 : -1}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <span className="filter-mode">{mode}</span>
    </div>
  )
}
