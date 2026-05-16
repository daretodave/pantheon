import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonTOC, type TOCSection } from '../SeasonTOC'

const sections: TOCSection[] = [
  { id: 's-take', num: '01', label: 'The take' },
  { id: 's-shape', num: '02', label: 'The shape of the season' },
  { id: 's-where', num: '03', label: 'Where it sits in the canon' },
]

describe('<SeasonTOC>', () => {
  let originalObserver: typeof IntersectionObserver | undefined

  beforeEach(() => {
    originalObserver = globalThis.IntersectionObserver
    class StubObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
      root = null
      rootMargin = ''
      thresholds = []
    }
    globalThis.IntersectionObserver = vi.fn(
      () => new StubObserver(),
    ) as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    if (originalObserver) {
      globalThis.IntersectionObserver = originalObserver
    }
  })

  it('returns null when no sections are provided', () => {
    const { container } = render(<SeasonTOC sections={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one toc-link per section', () => {
    render(<SeasonTOC sections={sections} />)
    expect(screen.getAllByTestId('toc-link')).toHaveLength(3)
  })

  it('marks the first section active by default', () => {
    render(<SeasonTOC sections={sections} />)
    const links = screen.getAllByTestId('toc-link') as HTMLElement[]
    const [first, second] = links
    if (!first || !second) throw new Error('expected toc links')
    expect(first.getAttribute('aria-current')).toBe('true')
    expect(second.getAttribute('aria-current')).toBeNull()
  })

  it('uses the section id in the href anchor', () => {
    render(<SeasonTOC sections={sections} />)
    const links = screen.getAllByTestId('toc-link') as HTMLElement[]
    const first = links[0]
    const third = links[2]
    if (!first || !third) throw new Error('expected toc links')
    expect(first.getAttribute('href')).toBe('#s-take')
    expect(third.getAttribute('href')).toBe('#s-where')
  })

  it('renders a current-progress dot on every row, active class on the first', () => {
    render(<SeasonTOC sections={sections} />)
    const links = screen.getAllByTestId('toc-link') as HTMLElement[]
    for (const a of links) {
      expect(a.querySelector('.toc-dot')).not.toBeNull()
    }
    const first = links[0]
    if (!first) throw new Error('expected toc links')
    expect(first.classList.contains('active')).toBe(true)
  })

  it('renders the num and label for each section', () => {
    render(<SeasonTOC sections={sections} />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('The take')).toBeInTheDocument()
    expect(screen.getByText('Where it sits in the canon')).toBeInTheDocument()
  })
})
