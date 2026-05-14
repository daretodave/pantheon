import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeaderView } from '../HeaderView'

describe('<HeaderView>', () => {
  it('renders the BrandMark + tiered.tv wordmark linked to /', () => {
    render(<HeaderView />)
    expect(screen.getByTestId('brand-mark')).toBeInTheDocument()
    const brand = screen.getByTestId('site-header-brand')
    expect(brand).toHaveAttribute('href', '/')
    expect(brand).toHaveTextContent('tiered.tv')
  })

  it('renders the three nav links: Shows / Lists / About', () => {
    render(<HeaderView />)
    const nav = screen.getByRole('navigation', { name: /primary/i })
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    )
    expect(hrefs).toEqual(['/shows', '/themes', '/about'])
  })

  it('renders the search trigger button (cmd+K overlay)', () => {
    render(<HeaderView />)
    const trigger = screen.getByTestId('site-header-search-trigger')
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger).toHaveTextContent(/Search/i)
    expect(trigger.textContent).toMatch(/⌘K/)
    expect(screen.queryByTestId('site-header-search-link')).toBeNull()
  })

  it('renders the Sign in pill pointing to /sign-in when signed out', () => {
    render(<HeaderView />)
    const signIn = screen.getByTestId('site-header-signin-link')
    expect(signIn).toHaveAttribute('href', '/sign-in')
    expect(signIn).toHaveTextContent(/Sign in/i)
    expect(screen.queryByTestId('site-header-user-link')).toBeNull()
    expect(screen.queryByTestId('site-header-signout-link')).toBeNull()
    expect(screen.getByTestId('site-header')).toHaveAttribute(
      'data-signed-in',
      'false',
    )
  })

  it('renders the user handle + Sign out link when signed in', () => {
    render(
      <HeaderView
        user={{
          handle: 'asha',
          displayLabel: '@asha',
          profileHref: '/u/asha',
        }}
      />,
    )
    const handle = screen.getByTestId('site-header-user-link')
    expect(handle).toHaveAttribute('href', '/u/asha')
    expect(handle).toHaveTextContent('@asha')
    const signOut = screen.getByTestId('site-header-signout-link')
    expect(signOut).toHaveAttribute('href', '/auth/logout?returnTo=/')
    expect(signOut).toHaveTextContent(/Sign out/i)
    expect(screen.queryByTestId('site-header-signin-link')).toBeNull()
    expect(screen.getByTestId('site-header')).toHaveAttribute(
      'data-signed-in',
      'true',
    )
  })

  it('applies tinted class + data-tinted attribute when tinted={true}', () => {
    render(<HeaderView tinted />)
    const header = screen.getByTestId('site-header')
    expect(header.className).toContain('tinted')
    expect(header.getAttribute('data-tinted')).toBe('true')
  })

  it('does not apply tinted class by default', () => {
    render(<HeaderView />)
    const header = screen.getByTestId('site-header')
    expect(header.className).not.toContain('tinted')
    expect(header.getAttribute('data-tinted')).toBeNull()
  })
})
