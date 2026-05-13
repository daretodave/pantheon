import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMark } from '../BrandMark'

describe('<BrandMark>', () => {
  it('renders at default 22px', () => {
    render(<BrandMark />)
    const svg = screen.getByTestId('brand-mark')
    expect(svg.getAttribute('width')).toBe('22')
    expect(svg.getAttribute('height')).toBe('22')
  })

  it.each([16, 22, 28, 48, 96, 240] as const)('respects allowed size %i', (size) => {
    render(<BrandMark size={size} />)
    const svg = screen.getByTestId('brand-mark')
    expect(svg.getAttribute('width')).toBe(String(size))
    expect(svg.getAttribute('height')).toBe(String(size))
  })

  it('always sets aria-hidden=true', () => {
    render(<BrandMark />)
    expect(screen.getByTestId('brand-mark').getAttribute('aria-hidden')).toBe('true')
  })

  it('uses currentColor for stroke on every drawn element', () => {
    render(<BrandMark />)
    const svg = screen.getByTestId('brand-mark')
    const stroked = svg.querySelectorAll('[stroke]')
    expect(stroked.length).toBeGreaterThan(0)
    for (const el of Array.from(stroked)) {
      expect(el.getAttribute('stroke')).toBe('currentColor')
    }
  })

  it('uses viewBox exactly "0 0 28 28"', () => {
    render(<BrandMark />)
    expect(screen.getByTestId('brand-mark').getAttribute('viewBox')).toBe('0 0 28 28')
  })

  it('appends className when provided', () => {
    render(<BrandMark className="custom" />)
    expect(screen.getByTestId('brand-mark').getAttribute('class')).toContain('custom')
  })
})
