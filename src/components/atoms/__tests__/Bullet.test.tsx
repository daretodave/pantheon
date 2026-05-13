import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Bullet } from '../Bullet'

describe('<Bullet>', () => {
  it('renders with the requested width and height', () => {
    render(<Bullet color="#D55E36" size={16} />)
    const node = screen.getByTestId('bullet') as HTMLSpanElement
    expect(node.style.width).toBe('16px')
    expect(node.style.height).toBe('16px')
  })

  it('renders with the requested background color', () => {
    render(<Bullet color="#D55E36" />)
    const node = screen.getByTestId('bullet') as HTMLSpanElement
    expect(node.style.background).toContain('213') // rgb(213, 94, 54)
  })

  it('defaults size to 12px', () => {
    render(<Bullet color="#000" />)
    const node = screen.getByTestId('bullet') as HTMLSpanElement
    expect(node.style.width).toBe('12px')
    expect(node.style.height).toBe('12px')
  })

  it('defaults aria-hidden to true', () => {
    render(<Bullet color="#000" />)
    const node = screen.getByTestId('bullet')
    expect(node.getAttribute('aria-hidden')).toBe('true')
  })

  it('respects an explicit aria-hidden=false', () => {
    render(<Bullet color="#000" aria-hidden={false} />)
    const node = screen.getByTestId('bullet')
    expect(node.getAttribute('aria-hidden')).toBe('false')
  })

  it('accepts a custom className appended after `bullet`', () => {
    render(<Bullet color="#000" className="custom-extra" />)
    const node = screen.getByTestId('bullet')
    expect(node.className).toBe('bullet custom-extra')
  })

  it('always emits the base `bullet` class', () => {
    render(<Bullet color="#000" />)
    const node = screen.getByTestId('bullet')
    expect(node.className).toBe('bullet')
  })
})
