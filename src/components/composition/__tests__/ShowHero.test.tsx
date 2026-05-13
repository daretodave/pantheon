import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShowHero } from '../ShowHero'

describe('<ShowHero>', () => {
  it('renders crumb + title + lede + art slots', () => {
    render(
      <ShowHero
        crumb={<span data-testid="crumb-content">Pantheons / Survivor</span>}
        title="Survivor"
        lede="47 seasons of strangers on a beach."
        art={<svg data-testid="art-content" />}
      />,
    )
    expect(screen.getByTestId('show-hero')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Survivor')
    expect(screen.getByTestId('crumb-content')).toBeInTheDocument()
    expect(screen.getByTestId('art-content')).toBeInTheDocument()
    expect(screen.getByTestId('show-hero').textContent).toMatch(/47 seasons/)
  })

  it('renders the optional shield slot when given', () => {
    render(
      <ShowHero
        crumb="x"
        title="t"
        lede="l"
        art={<svg />}
        shield={<div data-testid="shield-content">shield</div>}
      />,
    )
    expect(screen.getByTestId('shield-content')).toBeInTheDocument()
  })

  it('omits the shield slot when not provided', () => {
    render(<ShowHero crumb="x" title="t" lede="l" art={<svg />} />)
    expect(screen.queryByTestId('shield-content')).not.toBeInTheDocument()
  })
})
