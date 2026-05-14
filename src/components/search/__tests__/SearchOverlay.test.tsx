import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SearchIndexItem } from '@/lib/searchIndex'
import { SearchOverlay } from '../SearchOverlay'

const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn() }

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

const ITEMS: SearchIndexItem[] = [
  { type: 'show', name: 'Survivor', meta: '47 seasons · canon + community', color: '#D55E36', href: '/shows/survivor' },
  { type: 'show', name: 'Top Chef', meta: '21 seasons · canon + community', color: '#B86A2E', href: '/shows/top-chef' },
  {
    type: 'season',
    name: 'Heroes vs. Villains',
    meta: 'Survivor · season 20',
    color: '#D55E36',
    href: '/shows/survivor/season/20',
    tier: 'S',
  },
  { type: 'list', name: 'Best premieres ever', meta: '3 shows · 18 entries', color: '#E0843A', href: '/themes/best-premieres' },
  { type: 'tier', name: 'S tier', meta: '2 shows · format-defining', color: '#E8B65A', href: '/shows#tier-S' },
]

describe('<SearchOverlay>', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <SearchOverlay items={ITEMS} open={false} onClose={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the modal + all groups when opened with no query', () => {
    render(<SearchOverlay items={ITEMS} open={true} onClose={() => {}} />)
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('search-group-show')).toBeInTheDocument()
    expect(screen.getByTestId('search-group-season')).toBeInTheDocument()
    expect(screen.getByTestId('search-group-list')).toBeInTheDocument()
    expect(screen.getByTestId('search-group-tier')).toBeInTheDocument()
  })

  it('typing narrows the result list and highlights the match', () => {
    render(<SearchOverlay items={ITEMS} open={true} onClose={() => {}} />)
    const input = screen.getByTestId('search-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'surv' } })
    const rows = screen.getAllByTestId('search-row')
    expect(rows.length).toBeGreaterThan(0)
    expect(within(rows[0]!).getByText('Surv').tagName.toLowerCase()).toBe('mark')
  })

  it('filter chip narrows by type', () => {
    render(<SearchOverlay items={ITEMS} open={true} onClose={() => {}} />)
    fireEvent.click(screen.getByTestId('search-chip-list'))
    const rows = screen.getAllByTestId('search-row')
    expect(rows.length).toBe(1)
    expect(rows[0]).toHaveAttribute('data-hit-type', 'list')
  })

  it('Enter on a focused row navigates and closes', () => {
    const onClose = vi.fn()
    router.push.mockClear()
    render(<SearchOverlay items={ITEMS} open={true} onClose={onClose} />)
    const overlay = screen.getByTestId('search-overlay')
    fireEvent.keyDown(overlay, { key: 'Enter' })
    expect(router.push).toHaveBeenCalledWith(ITEMS[0]!.href)
    expect(onClose).toHaveBeenCalled()
  })

  it('Escape closes the overlay', () => {
    const onClose = vi.fn()
    render(<SearchOverlay items={ITEMS} open={true} onClose={onClose} />)
    fireEvent.keyDown(screen.getByTestId('search-overlay'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('ArrowDown moves focus to the next row', () => {
    render(<SearchOverlay items={ITEMS} open={true} onClose={() => {}} />)
    const overlay = screen.getByTestId('search-overlay')
    fireEvent.keyDown(overlay, { key: 'ArrowDown' })
    const rows = screen.getAllByTestId('search-row')
    expect(rows[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the empty state when nothing matches', () => {
    render(<SearchOverlay items={ITEMS} open={true} onClose={() => {}} />)
    const input = screen.getByTestId('search-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'zzznever' } })
    expect(screen.getByTestId('search-empty')).toBeInTheDocument()
  })
})
