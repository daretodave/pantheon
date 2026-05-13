import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Footer } from '../Footer'

describe('<Footer>', () => {
  it('renders the BrandMark + Pantheon wordmark', () => {
    render(<Footer />)
    expect(screen.getAllByTestId('brand-mark').length).toBeGreaterThan(0)
    const brand = screen.getByTestId('site-footer-brand')
    expect(brand).toHaveTextContent('Pantheon')
  })

  it('renders the italic promise with "no spoilers"', () => {
    render(<Footer />)
    const promise = screen.getByTestId('site-footer-promise')
    expect(promise).toHaveTextContent('the seasons, ranked.')
    const em = promise.querySelector('em')
    expect(em).not.toBeNull()
    expect(em?.textContent).toBe('no spoilers.')
  })

  it('renders three columns: brand + Pantheons + Pantheon (about)', () => {
    render(<Footer />)
    expect(screen.getByTestId('site-footer-brand')).toBeInTheDocument()
    expect(screen.getByTestId('site-footer-pantheons-col')).toBeInTheDocument()
    expect(screen.getByTestId('site-footer-about-col')).toBeInTheDocument()
  })

  it('does NOT contain the phrase "an experiment"', () => {
    render(<Footer />)
    const footer = screen.getByTestId('site-footer')
    expect(footer.textContent).not.toMatch(/an experiment/i)
  })

  it('mounts the theme toggle in the meta strip', () => {
    render(<Footer />)
    expect(
      screen.getByRole('button', { name: /switch to (light|dark) mode/i }),
    ).toBeInTheDocument()
  })

  it('renders a bullet next to each show in the Pantheons column', () => {
    render(<Footer />)
    const col = screen.getByTestId('site-footer-pantheons-col')
    const bullets = col.querySelectorAll('[data-testid=bullet]')
    expect(bullets.length).toBeGreaterThan(0)
  })

  it('renders the rebellion copy in the meta strip', () => {
    render(<Footer />)
    const meta = screen.getByTestId('site-footer-meta')
    expect(meta).toHaveTextContent(
      /est\. as a quiet rebellion against ranked lists that ruin the show/i,
    )
  })

  it('renders the package version in the meta strip', () => {
    render(<Footer />)
    const v = screen.getByTestId('site-footer-meta-version')
    expect(v.textContent).toMatch(/^v\d/)
  })

  it('applies tinted class when tinted={true}', () => {
    render(<Footer tinted />)
    const footer = screen.getByTestId('site-footer')
    expect(footer.className).toContain('tinted')
    expect(footer.getAttribute('data-tinted')).toBe('true')
  })
})
