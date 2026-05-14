import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomeListsStack } from '../HomeListsStack'

describe('<HomeListsStack>', () => {
  it('renders section head + bordered stack wrapping its children', () => {
    render(
      <HomeListsStack>
        <span data-testid="kid">x</span>
        <span data-testid="kid">y</span>
      </HomeListsStack>,
    )
    expect(screen.getByTestId('home-list-section')).toBeTruthy()
    const stack = screen.getByTestId('home-lists-stack')
    expect(stack).toBeTruthy()
    expect(stack.querySelectorAll('[data-testid="kid"]').length).toBe(2)
  })

  it('renders the all-lists link', () => {
    render(<HomeListsStack>row</HomeListsStack>)
    const link = screen.getByRole('link', { name: /all lists/i })
    expect(link.getAttribute('href')).toBe('/themes')
  })
})
