import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ListRow } from '../ListRow'
import { show, theme } from './fixtures'

const today = new Date('2026-05-13T00:00:00Z')

describe('<ListRow>', () => {
  it('links to /themes/<slug> with data-slug', () => {
    render(
      <ListRow theme={theme()} shows={[show()]} today={today} />,
    )
    const row = screen.getByTestId('lists-row')
    expect(row.getAttribute('href')).toBe('/themes/firsts')
    expect(row.getAttribute('data-slug')).toBe('firsts')
  })

  it('renders the entry-count + status meta', () => {
    render(
      <ListRow
        theme={theme({ status: 'growing' })}
        shows={[show()]}
        today={today}
      />,
    )
    const row = screen.getByTestId('lists-row')
    expect(row.textContent).toContain('2 entries')
    expect(row.textContent).toContain('growing')
  })

  it('renders one bullet per unique show', () => {
    render(
      <ListRow
        theme={theme()}
        shows={[show(), show({ slug: 'top-chef', name: 'Top Chef' })]}
        today={today}
      />,
    )
    const bullets = screen
      .getByTestId('lists-row')
      .querySelectorAll('.bullet')
    expect(bullets).toHaveLength(2)
  })
})
