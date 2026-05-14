'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchIndexItem, SearchIndexItemType } from '@/lib/searchIndex'
import { highlightSegments } from './highlight'
import {
  filterAndRank,
  groupByType,
  SEARCH_TYPE_ORDER,
  TYPE_DISPLAY,
  type SearchFilter,
} from './scoring'

type SearchOverlayProps = {
  items: readonly SearchIndexItem[]
  open: boolean
  onClose: () => void
}

const FILTERS: { value: SearchFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'show', label: 'Shows' },
  { value: 'season', label: 'Seasons' },
  { value: 'list', label: 'Lists' },
  { value: 'tier', label: 'Tiers' },
]

export function SearchOverlay({ items, open, onClose }: SearchOverlayProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SearchFilter>('all')
  const [focused, setFocused] = useState(0)

  // Flatten the grouped results into a single ordered array so
  // the keyboard nav can move through every row regardless of group.
  const flat = useMemo(() => filterAndRank(items, query, filter), [items, query, filter])
  const grouped = useMemo(() => groupByType(flat), [flat])

  // Reset state when the overlay opens.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setFilter('all')
    setFocused(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [open])

  // Lock background scroll while the overlay is open.
  useEffect(() => {
    if (!open) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [open])

  // Clamp focus when results shrink.
  useEffect(() => {
    if (focused >= flat.length) setFocused(0)
  }, [flat.length, focused])

  const navigate = useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (flat.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocused((f) => (f + 1) % flat.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocused((f) => (f - 1 + flat.length) % flat.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const hit = flat[focused]
        if (hit) navigate(hit.href)
      }
    },
    [flat, focused, navigate, onClose],
  )

  // Scroll the focused row into view. Guarded: jsdom doesn't
  // implement scrollIntoView, so feature-detect before calling.
  useEffect(() => {
    const el = resultsRef.current?.querySelector<HTMLAnchorElement>(
      `[data-search-row-idx="${focused}"]`,
    )
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [focused])

  if (!open) return null

  let idx = 0

  return (
    <div
      className="search-overlay open"
      role="dialog"
      aria-modal="true"
      aria-label="Search tiered.tv"
      data-testid="search-overlay"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="search-modal" role="document">
        <div className="search-head">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <label
            htmlFor={inputId}
            style={{ position: 'absolute', left: '-9999px' }}
          >
            Search
          </label>
          <input
            ref={inputRef}
            id={inputId}
            className="search-input"
            type="text"
            placeholder="Search shows, lists, seasons, tiers…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            data-testid="search-input"
            onChange={(e) => {
              setQuery(e.target.value)
              setFocused(0)
            }}
          />
          <button
            type="button"
            className="search-close"
            data-testid="search-close"
            aria-label="Close search"
            onClick={onClose}
          >
            esc
          </button>
        </div>

        <div
          className="search-filters"
          role="tablist"
          aria-label="Filter search results by type"
        >
          {FILTERS.map((f) => {
            const on = f.value === filter
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={on}
                className={on ? 'search-chip on' : 'search-chip'}
                data-filter={f.value}
                data-testid={`search-chip-${f.value}`}
                onClick={() => {
                  setFilter(f.value)
                  setFocused(0)
                  inputRef.current?.focus()
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div
          ref={resultsRef}
          className="search-results"
          role="listbox"
          aria-label="Search results"
          data-testid="search-results"
        >
          {flat.length === 0 ? (
            <div className="search-empty" data-testid="search-empty">
              {query.trim().length === 0 ? (
                <>
                  Start typing to find a <b>show</b>, <b>season</b>, or{' '}
                  <b>list</b>.
                  <div className="sub">
                    Try a show name, a season number, or a tier letter.
                  </div>
                </>
              ) : (
                <>
                  No matches for <b>“{query.trim()}”</b>.
                  <div className="sub">
                    Try a show name, a season number, or a tier letter.
                  </div>
                </>
              )}
            </div>
          ) : (
            SEARCH_TYPE_ORDER.map((type: SearchIndexItemType) => {
              const group = grouped[type]
              if (group.length === 0) return null
              return (
                <div
                  key={type}
                  className="search-group"
                  data-testid={`search-group-${type}`}
                >
                  <div className="search-group-head">
                    {TYPE_DISPLAY[type]}{' '}
                    <span className="search-group-count">· {group.length}</span>
                  </div>
                  {group.map((item) => {
                    const myIdx = idx++
                    const focusedRow = myIdx === focused
                    return (
                      <a
                        key={`${item.type}:${item.href}`}
                        className={focusedRow ? 'search-row focused' : 'search-row'}
                        href={item.href}
                        role="option"
                        aria-selected={focusedRow}
                        data-hit-type={item.type}
                        data-search-row-idx={myIdx}
                        data-testid="search-row"
                        onMouseEnter={() => setFocused(myIdx)}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(item.href)
                        }}
                      >
                        <span
                          className="search-row-dot"
                          style={{ background: item.color }}
                          aria-hidden="true"
                        />
                        <div className="search-row-body">
                          <span className="search-row-name">
                            {highlightSegments(item.name, query).map((seg, i) =>
                              seg.match ? (
                                <mark key={i}>{seg.text}</mark>
                              ) : (
                                <span key={i}>{seg.text}</span>
                              ),
                            )}
                          </span>
                          <span className="search-row-meta">{item.meta}</span>
                        </div>
                        {item.tier ? (
                          <span className="search-row-tier">{item.tier}</span>
                        ) : null}
                        <span
                          className="search-row-arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </a>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        <div className="search-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate&nbsp;&nbsp;<kbd>↵</kbd> open&nbsp;&nbsp;
            <kbd>esc</kbd> close
          </span>
          <span className="search-foot-promise">
            no spoilers. <em>every result is safe.</em>
          </span>
        </div>
      </div>
    </div>
  )
}
