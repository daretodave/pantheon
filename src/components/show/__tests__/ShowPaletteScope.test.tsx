import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ShowPaletteScope } from '../ShowPaletteScope'

const PALETTE = { paper: '#0E2A2A', ink: '#EFE2BD', primary: '#D55E36' }

describe('<ShowPaletteScope>', () => {
  it('writes show-palette CSS vars from an explicit palette prop', () => {
    render(<ShowPaletteScope palette={PALETTE}>x</ShowPaletteScope>)
    const node = screen.getByTestId('show-palette-scope') as HTMLDivElement
    expect(node.style.getPropertyValue('--show-paper')).toBe('#0E2A2A')
    expect(node.style.getPropertyValue('--show-ink')).toBe('#EFE2BD')
    expect(node.style.getPropertyValue('--show-primary')).toBe('#D55E36')
  })

  it('resolves the palette from content when only show slug is passed', () => {
    render(<ShowPaletteScope show="survivor">x</ShowPaletteScope>)
    const node = screen.getByTestId('show-palette-scope') as HTMLDivElement
    expect(node.dataset['show']).toBe('survivor')
    expect(node.style.getPropertyValue('--show-primary')).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('writes no CSS vars when neither palette nor known show is provided', () => {
    render(<ShowPaletteScope show="not-a-real-show">x</ShowPaletteScope>)
    const node = screen.getByTestId('show-palette-scope') as HTMLDivElement
    expect(node.style.getPropertyValue('--show-primary')).toBe('')
  })
})
