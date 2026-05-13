import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonShell } from '../SeasonShell'

describe('<SeasonShell>', () => {
  it('renders the two-column shell with main + aside slots', () => {
    render(
      <SeasonShell
        main={<p data-testid="main-content">main</p>}
        aside={<p data-testid="aside-content">aside</p>}
      />,
    )
    expect(screen.getByTestId('season-shell')).toBeInTheDocument()
    const main = screen.getByTestId('season-main')
    const aside = screen.getByTestId('season-aside')
    expect(main.tagName.toLowerCase()).toBe('article')
    expect(aside.tagName.toLowerCase()).toBe('aside')
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    expect(screen.getByTestId('aside-content')).toBeInTheDocument()
  })
})
