import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonDetails } from '../SeasonDetails'

describe('<SeasonDetails>', () => {
  it('returns null when no details', () => {
    const { container } = render(<SeasonDetails details={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one detail cell per entry', () => {
    render(
      <SeasonDetails
        details={[
          { key: 'Filmed', value: 'Samoa' },
          { key: 'Episodes', value: '14' },
        ]}
      />,
    )
    const cells = screen.getAllByTestId('season-detail')
    expect(cells).toHaveLength(2)
    const filmed = cells[0]!
    const episodes = cells[1]!
    expect(filmed.textContent).toContain('Filmed')
    expect(filmed.textContent).toContain('Samoa')
    expect(episodes.textContent).toContain('Episodes')
    expect(episodes.textContent).toContain('14')
  })
})
