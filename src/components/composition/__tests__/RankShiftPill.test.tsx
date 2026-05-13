import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RankShiftPill } from '../RankShiftPill'

describe('<RankShiftPill>', () => {
  it('renders an up arrow + delta when delta > 0', () => {
    render(<RankShiftPill delta={3} sentiment="warm-up" />)
    const pill = screen.getByTestId('rank-shift-pill')
    expect(pill).toHaveClass('rank-pill')
    expect(pill.textContent).toContain('↑')
    expect(pill.textContent).toContain('3')
    expect(pill.getAttribute('aria-label')).toBe('rank up 3')
  })

  it('renders a down arrow + abs delta when delta < 0', () => {
    render(<RankShiftPill delta={-2} sentiment="warm-down" />)
    const pill = screen.getByTestId('rank-shift-pill')
    expect(pill.textContent).toContain('↓')
    expect(pill.textContent).toContain('2')
    expect(pill.getAttribute('aria-label')).toBe('rank down 2')
  })

  it('renders a neutral dot when delta is 0', () => {
    render(<RankShiftPill delta={0} sentiment="neutral" />)
    const pill = screen.getByTestId('rank-shift-pill')
    expect(pill.textContent).toContain('·')
    expect(pill.getAttribute('aria-label')).toBe('no rank change')
  })

  it('applies the sentiment token to the inline color style', () => {
    render(<RankShiftPill delta={1} sentiment="hold" />)
    const pill = screen.getByTestId('rank-shift-pill')
    expect(pill.style.color).toContain('--color-sentiment-hold')
    expect(pill.style.background).toContain('--color-sentiment-hold')
    expect(pill.getAttribute('data-sentiment')).toBe('hold')
  })
})
