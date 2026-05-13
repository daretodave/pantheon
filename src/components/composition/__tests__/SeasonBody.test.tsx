import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonBody } from '../SeasonBody'

describe('<SeasonBody>', () => {
  it('renders the lede on its own when no body or pull', () => {
    render(<SeasonBody lede="The opening sentence." />)
    expect(screen.getByTestId('season-lede')).toHaveTextContent('The opening sentence.')
    expect(screen.queryByTestId('season-pull')).not.toBeInTheDocument()
  })

  it('splits multi-paragraph body on blank lines', () => {
    render(
      <SeasonBody
        lede="L"
        body={'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'}
      />,
    )
    const body = screen.getByTestId('season-body')
    const paragraphs = body.querySelectorAll('p:not(.season-lede)')
    expect(paragraphs).toHaveLength(3)
    const first = paragraphs[0]!
    const third = paragraphs[2]!
    expect(first.textContent).toContain('First paragraph')
    expect(third.textContent).toContain('Third paragraph')
  })

  it('renders the pull-quote when provided', () => {
    render(<SeasonBody lede="L" pull="A defended line." />)
    expect(screen.getByTestId('season-pull')).toHaveTextContent('A defended line.')
  })
})
