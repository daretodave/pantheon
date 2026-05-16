'use client'

import { useEffect, useState } from 'react'

// Phase 30: sticky TOC for the season-page body grid. Each row links
// to a numbered article section. Uses IntersectionObserver to mark
// the row matching the section closest to the top of the viewport.
// Reduced-motion path falls through `scroll-behavior: auto` (the
// component never animates directly — it sets aria-current on the
// active anchor, and the native anchor jump is instant under reduced
// motion via the CSS layer).

export type TOCSection = {
  id: string
  num: string
  label: string
}

type SeasonTOCProps = {
  sections: readonly TOCSection[]
}

export function SeasonTOC({ sections }: SeasonTOCProps) {
  const first = sections[0]?.id ?? ''
  const [activeId, setActiveId] = useState<string>(first)

  useEffect(() => {
    if (sections.length === 0) return
    if (typeof IntersectionObserver === 'undefined') return
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el != null)
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Track which sections are inside the upper viewport band.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
        if (visible.length === 0) return
        // Pick the one nearest the top of the band.
        visible.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
        const top = visible[0]
        if (top) setActiveId(top.id)
      },
      {
        rootMargin: '-96px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 1],
      },
    )
    for (const t of targets) observer.observe(t)
    return () => observer.disconnect()
  }, [sections])

  if (sections.length === 0) return null

  return (
    <nav className="toc" aria-label="On this page" data-testid="season-toc">
      <div className="toc-head">On this page</div>
      <ol className="toc-list">
        {sections.map((s) => {
          const isActive = s.id === activeId
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={isActive ? 'active' : undefined}
                aria-current={isActive ? 'true' : undefined}
                data-testid="toc-link"
                data-toc-id={s.id}
                onClick={() => setActiveId(s.id)}
              >
                <span className="toc-dot" aria-hidden="true" />
                <span className="toc-num">{s.num}</span>
                <span>{s.label}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
