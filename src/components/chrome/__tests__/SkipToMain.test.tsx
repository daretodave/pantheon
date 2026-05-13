import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SkipToMain } from '../SkipToMain'

describe('<SkipToMain>', () => {
  it('renders an anchor link targeting #main', () => {
    render(<SkipToMain />)
    const link = screen.getByTestId('skip-to-main')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('#main')
    expect(link.textContent).toBe('Skip to main content')
  })

  it('applies the skip-to-main class for the visually-hidden + focus styles', () => {
    render(<SkipToMain />)
    expect(screen.getByTestId('skip-to-main').className).toContain('skip-to-main')
  })
})
