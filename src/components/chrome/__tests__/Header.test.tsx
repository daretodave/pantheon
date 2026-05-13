import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Header } from '../Header'

describe('<Header>', () => {
  it('renders the BrandMark + Pantheon wordmark linked to /', () => {
    render(<Header />)
    expect(screen.getByTestId('brand-mark')).toBeInTheDocument()
    const brand = screen.getByTestId('site-header-brand')
    expect(brand).toHaveAttribute('href', '/')
    expect(brand).toHaveTextContent('Pantheon')
  })

  it('renders the three nav links: Shows / Lists / About', () => {
    render(<Header />)
    const nav = screen.getByRole('navigation', { name: /primary/i })
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    )
    expect(hrefs).toEqual(['/shows', '/themes', '/about'])
  })

  it('renders the Search link pointing to /search', () => {
    render(<Header />)
    const search = screen.getByTestId('site-header-search-link')
    expect(search).toHaveAttribute('href', '/search')
    expect(search).toHaveTextContent(/Search/i)
  })

  it('renders the Sign in pill pointing to /sign-in', () => {
    render(<Header />)
    const signIn = screen.getByTestId('site-header-signin-link')
    expect(signIn).toHaveAttribute('href', '/sign-in')
    expect(signIn).toHaveTextContent(/Sign in/i)
  })

  it('applies tinted class + data-tinted attribute when tinted={true}', () => {
    render(<Header tinted />)
    const header = screen.getByTestId('site-header')
    expect(header.className).toContain('tinted')
    expect(header.getAttribute('data-tinted')).toBe('true')
  })

  it('does not apply tinted class by default', () => {
    render(<Header />)
    const header = screen.getByTestId('site-header')
    expect(header.className).not.toContain('tinted')
    expect(header.getAttribute('data-tinted')).toBeNull()
  })
})
