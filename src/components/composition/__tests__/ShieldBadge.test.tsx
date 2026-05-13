import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShieldBadge } from '../ShieldBadge'

describe('<ShieldBadge>', () => {
  it('renders the default no-spoiler promise', () => {
    render(<ShieldBadge />)
    const badge = screen.getByTestId('shield-badge')
    expect(badge).toHaveClass('shield')
    expect(badge).not.toHaveClass('inline')
    expect(badge.textContent).toMatch(/no spoilers/i)
    expect(badge).toHaveAttribute('role', 'note')
  })

  it('adds the inline modifier when inline is set', () => {
    render(<ShieldBadge inline />)
    const badge = screen.getByTestId('shield-badge')
    expect(badge).toHaveClass('shield')
    expect(badge).toHaveClass('inline')
    expect(badge.getAttribute('data-inline')).toBe('true')
  })

  it('renders a custom message', () => {
    render(<ShieldBadge message="Custom promise text" />)
    expect(screen.getByTestId('shield-badge').textContent).toContain('Custom promise text')
  })
})
