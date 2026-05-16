import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  SeasonHero,
  parseDisplayTitle,
  decodeTitleEntities,
} from '../SeasonHero'

describe('parseDisplayTitle', () => {
  it('returns a single text node when no markup is present', () => {
    const out = parseDisplayTitle('Borneo')
    expect(out).toEqual([{ kind: 'text', value: 'Borneo' }])
  })

  it('splits on <em>...</em> + <br/> markers', () => {
    const out = parseDisplayTitle('Heroes <em>vs.</em><br/>Villains')
    expect(out).toEqual([
      { kind: 'text', value: 'Heroes ' },
      { kind: 'accent', value: 'vs.' },
      { kind: 'break' },
      { kind: 'text', value: 'Villains' },
    ])
  })

  it('accepts self-closed <br /> too', () => {
    const out = parseDisplayTitle('A<br />B')
    expect(out.find((n) => n.kind === 'break')).toBeDefined()
  })

  // 33b bolt-on 1 regression: Cagayan's display_title carries
  // `&amp;` (HTML-escaped in the constrained subset). Text + accent
  // segments must decode to a literal `&`, not print "&amp;".
  it('decodes HTML entities in text + accent segments', () => {
    const out = parseDisplayTitle(
      'Cagayan: <em>Brains</em><br/>Brawn &amp; Beauty',
    )
    expect(out).toEqual([
      { kind: 'text', value: 'Cagayan: ' },
      { kind: 'accent', value: 'Brains' },
      { kind: 'break' },
      { kind: 'text', value: 'Brawn & Beauty' },
    ])
  })
})

describe('decodeTitleEntities', () => {
  it('decodes named entities', () => {
    expect(decodeTitleEntities('Brawn &amp; Beauty')).toBe('Brawn & Beauty')
    expect(decodeTitleEntities('it&rsquo;s &mdash; now')).toBe('it’s — now')
  })

  it('decodes decimal + hex numeric entities', () => {
    expect(decodeTitleEntities('a&#38;b')).toBe('a&b')
    expect(decodeTitleEntities('a&#x26;b')).toBe('a&b')
  })

  it('leaves unknown entities untouched', () => {
    expect(decodeTitleEntities('a&bogus;b')).toBe('a&bogus;b')
  })
})

describe('<SeasonHero>', () => {
  function baseProps(overrides: Partial<Parameters<typeof SeasonHero>[0]> = {}) {
    return {
      crumb: <span data-testid="crumb">Tiers / Survivor / S20</span>,
      title: 'Heroes vs. Villains',
      lede: 'A returnees season.',
      infoCard: <div data-testid="ic">card</div>,
      ...overrides,
    }
  }

  it('renders crumb, h1, lede, info card', () => {
    render(<SeasonHero {...baseProps()} />)
    expect(screen.getByTestId('season-hero')).toBeInTheDocument()
    expect(screen.getByTestId('crumb')).toBeInTheDocument()
    expect(screen.getByTestId('season-h1')).toHaveTextContent('Heroes vs. Villains')
    expect(screen.getByTestId('hero-lede')).toHaveTextContent('A returnees season')
    expect(screen.getByTestId('ic')).toBeInTheDocument()
  })

  it('renders display_title with <span class="amp"> accent + literal <br>', () => {
    render(
      <SeasonHero
        {...baseProps({ displayTitle: 'Heroes <em>vs.</em><br/>Villains' })}
      />,
    )
    const h1 = screen.getByTestId('season-h1')
    expect(h1).toHaveTextContent('Heroes')
    expect(h1).toHaveTextContent('Villains')
    const accent = screen.getByTestId('display-title-accent')
    expect(accent).toHaveTextContent('vs.')
    expect(accent.className).toBe('amp')
    expect(h1.querySelector('br')).toBeTruthy()
  })

  it('falls back to plain title when display_title is absent', () => {
    render(<SeasonHero {...baseProps()} />)
    expect(screen.queryByTestId('display-title-accent')).toBeNull()
  })

  it('hides eyebrow and byline when not provided', () => {
    render(<SeasonHero {...baseProps()} />)
    expect(screen.queryByTestId('season-eyebrow')).toBeNull()
    expect(screen.queryByTestId('hero-byline')).toBeNull()
  })

  it('renders eyebrow and byline when provided', () => {
    render(
      <SeasonHero
        {...baseProps({
          eyebrow: 'Aired spring 2010',
          byline: <span data-testid="byline-inner">7 min read</span>,
        })}
      />,
    )
    expect(screen.getByTestId('season-eyebrow')).toHaveTextContent('Aired spring 2010')
    expect(screen.getByTestId('hero-byline')).toBeInTheDocument()
    expect(screen.getByTestId('byline-inner')).toBeInTheDocument()
  })
})
