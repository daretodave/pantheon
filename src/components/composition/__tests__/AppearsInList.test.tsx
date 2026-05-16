import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppearsInList } from '../AppearsInList'

describe('<AppearsInList>', () => {
  it('returns null when no rows', () => {
    const { container } = render(<AppearsInList rows={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one row per entry with name + meta and bullet', () => {
    render(
      <AppearsInList
        rows={[
          { href: '/themes/best-premieres', name: 'Best premieres ever', meta: 'list · 24 entries' },
          { href: '/shows/survivor', name: "Editor's Canon", meta: "Editor's Canon · #07" },
        ]}
      />,
    )
    const rows = screen.getAllByTestId('appears-row')
    expect(rows).toHaveLength(2)
    const first = rows[0]!
    const second = rows[1]!
    expect(first).toHaveAttribute('href', '/themes/best-premieres')
    expect(first.textContent).toContain('Best premieres ever')
    expect(first.textContent).toContain('list · 24 entries')
    expect(second.textContent).toContain("Editor's Canon · #07")
  })
})
