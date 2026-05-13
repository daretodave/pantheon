import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Wrap } from '../Wrap'

describe('<Wrap>', () => {
  it('renders children inside a .wrap container', () => {
    render(
      <Wrap>
        <p>inner</p>
      </Wrap>,
    )
    const wrap = screen.getByTestId('wrap')
    expect(wrap.className).toContain('wrap')
    expect(wrap).toContainHTML('<p>inner</p>')
  })

  it('appends className', () => {
    render(
      <Wrap className="extra">
        <span />
      </Wrap>,
    )
    expect(screen.getByTestId('wrap').className).toContain('extra')
    expect(screen.getByTestId('wrap').className).toContain('wrap')
  })
})
