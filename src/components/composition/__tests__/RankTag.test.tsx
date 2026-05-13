import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RankTag } from '../RankTag'

describe('<RankTag>', () => {
  it('renders label + value', () => {
    render(<RankTag label="Editor's Canon" value="#07" />)
    const tag = screen.getByTestId('rank-tag')
    expect(tag).toBeInTheDocument()
    expect(tag.textContent).toContain("Editor's Canon")
    expect(tag.textContent).toContain('#07')
  })

  it('renders trailing slot when given', () => {
    render(
      <RankTag
        label="Community"
        value="#04"
        trailing={<span data-testid="trail">↑ 3</span>}
      />,
    )
    expect(screen.getByTestId('trail')).toBeInTheDocument()
  })
})
