import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { EraBand } from '@/content'
import { CanonEraToolbar } from '../CanonEraToolbar'

const BANDS: EraBand[] = [
  { key: 'pioneer', label: 'Pioneer', range: [2000, 2003] },
  { key: 'new-era', label: 'New era', range: [2021, 2026] },
]

function Harness({ bands, total }: { bands: EraBand[]; total: number }) {
  return (
    <div data-canon-page-root data-testid="root">
      <div data-view-pane="canon">
        <CanonEraToolbar bands={bands} total={total} />
        <a className="cp-hero-entry" data-testid="e-pioneer" data-era="pioneer">
          a
        </a>
        <a className="cp-mid-entry" data-testid="e-new" data-era="new-era">
          b
        </a>
      </div>
    </div>
  )
}

describe('<CanonEraToolbar>', () => {
  it('preselects the All chip and renders one chip per era band', () => {
    render(<Harness bands={BANDS} total={47} />)
    const all = screen.getByTestId('era-chip-all')
    expect(all).toHaveTextContent('All 47')
    expect(all).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('era-chip-pioneer')).toHaveTextContent('Pioneer')
    expect(screen.getByTestId('era-chip-new-era')).toHaveTextContent('New era')
  })

  it('renders only the All chip when no era bands are authored', () => {
    render(<Harness bands={[]} total={3} />)
    expect(screen.getByTestId('era-chip-all')).toHaveTextContent('All 3')
    expect(screen.queryByTestId('era-chip-pioneer')).toBeNull()
  })

  it('filters non-matching entries via data-era-off and updates the mode label', () => {
    render(<Harness bands={BANDS} total={47} />)
    const pioneerEntry = screen.getByTestId('e-pioneer')
    const newEntry = screen.getByTestId('e-new')

    fireEvent.click(screen.getByTestId('era-chip-pioneer'))
    expect(pioneerEntry).not.toHaveAttribute('data-era-off')
    expect(newEntry).toHaveAttribute('data-era-off', 'true')
    expect(screen.getByTestId('root')).toHaveAttribute(
      'data-era-filter',
      'pioneer',
    )
    expect(screen.getByTestId('era-mode')).toHaveTextContent('pioneer only')

    fireEvent.click(screen.getByTestId('era-chip-all'))
    expect(pioneerEntry).not.toHaveAttribute('data-era-off')
    expect(newEntry).not.toHaveAttribute('data-era-off')
    expect(screen.getByTestId('era-mode')).toHaveTextContent('canon order')
  })
})
