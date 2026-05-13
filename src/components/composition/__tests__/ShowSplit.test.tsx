import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShowSplit } from '../ShowSplit'

const CANON = {
  href: '/shows/survivor/canon',
  tag: '01 · CURATED',
  title: "Editor's Canon",
  blurb: 'One ranking, written by someone who has seen every season twice.',
  go: 'Read the canon →',
}

const COMMUNITY = {
  href: '/shows/survivor/community',
  tag: '02 · LIVE',
  title: 'Community Rank',
  blurb: 'Voted weekly by 41,000 readers.',
  go: 'See the vote →',
}

describe('<ShowSplit>', () => {
  it('renders two split-btn panels pointing at canon and community', () => {
    render(<ShowSplit canon={CANON} community={COMMUNITY} />)
    expect(screen.getByTestId('show-split')).toBeInTheDocument()
    const canon = screen.getByTestId('split-btn-canon')
    const community = screen.getByTestId('split-btn-community')
    expect(canon).toHaveAttribute('href', CANON.href)
    expect(community).toHaveAttribute('href', COMMUNITY.href)
    expect(canon.textContent).toMatch(/editor's canon/i)
    expect(community.textContent).toMatch(/community rank/i)
  })

  it('emits each panel tag + blurb + go affordance', () => {
    render(<ShowSplit canon={CANON} community={COMMUNITY} />)
    expect(screen.getByText(CANON.tag)).toBeInTheDocument()
    expect(screen.getByText(CANON.blurb)).toBeInTheDocument()
    expect(screen.getByText(CANON.go)).toBeInTheDocument()
  })
})
