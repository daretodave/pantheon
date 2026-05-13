'use client'

import { useState, type ReactNode } from 'react'
import {
  FILTER_KEYS,
  FILTER_LABELS,
  filterModeText,
  type FilterKey,
} from '@/lib/themes-format'

type ListsFilterControllerProps = {
  counts: Record<FilterKey, number>
  children: ReactNode
}

export function ListsFilterController({
  counts,
  children,
}: ListsFilterControllerProps) {
  const [filter, setFilter] = useState<FilterKey>('all')

  return (
    <div
      className="lists-filter-scope"
      data-testid="lists-filter-scope"
      data-active-filter={filter}
    >
      <div className="lists-filter-bar" data-testid="lists-filter-bar">
        <div className="lists-filter-set" role="group" aria-label="Filter lists by category">
          {FILTER_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`chip${filter === key ? ' on' : ''}`}
              data-filter={key}
              data-testid={`lists-chip-${key}`}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
        <span
          className="lists-filter-mode"
          data-testid="lists-filter-mode"
        >
          {filterModeText(filter, counts)}
        </span>
      </div>
      {children}
    </div>
  )
}
