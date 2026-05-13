import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopNavTinted } from '../TopNavTinted'

describe('<TopNavTinted>', () => {
  it('renders the tinted topnav with brand and default links', () => {
    render(<TopNavTinted />)
    const nav = screen.getByTestId('top-nav-tinted')
    expect(nav).toHaveClass('topnav')
    expect(nav).toHaveClass('tinted')
    expect(screen.getByRole('link', { name: /pantheon home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shows/i })).toHaveAttribute('href', '/shows')
    expect(screen.getByRole('link', { name: /lists/i })).toHaveAttribute('href', '/themes')
  })

  it('renders a sign-in CTA by default', () => {
    render(<TopNavTinted />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/sign-in')
  })

  it('honors a custom brand label', () => {
    render(<TopNavTinted brand="Demo" />)
    expect(screen.getByLabelText(/pantheon home/i).textContent).toContain('Demo')
  })

  it('honors a custom link list', () => {
    render(<TopNavTinted links={[{ href: '/x', label: 'Other' }]} />)
    expect(screen.getByRole('link', { name: 'Other' })).toHaveAttribute('href', '/x')
  })
})
