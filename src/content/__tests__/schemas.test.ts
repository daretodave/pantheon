import { describe, expect, it } from 'vitest'
import {
  canonEntrySchema,
  legalDocSchema,
  paletteSchema,
  seasonSchema,
  showFrontmatterSchema,
  themeFrontmatterSchema,
  themeSchema,
} from '../schemas'

const VALID_PALETTE = {
  primary: '#C9551A',
  ink: '#1A1410',
  paper: '#F5EFE6',
} as const

const VALID_SHOW = {
  slug: 'survivor',
  name: 'Survivor',
  palette: VALID_PALETTE,
  seasons: 47,
  status: 'airing' as const,
  blurb: '47 seasons. One torch at a time.',
  tagline: '47 seasons of strangers on a beach.',
}

const validSeasonBlurb = (wordCount: number): string =>
  Array.from({ length: wordCount }, (_, i) => `word${i}`).join(' ')

const validRationale = (wordCount: number): string =>
  Array.from({ length: wordCount }, (_, i) => `rationale${i}`).join(' ')

describe('paletteSchema', () => {
  it('accepts a valid 3-color palette', () => {
    expect(paletteSchema.parse(VALID_PALETTE)).toEqual(VALID_PALETTE)
  })

  it('rejects non-hex primary', () => {
    expect(() =>
      paletteSchema.parse({ ...VALID_PALETTE, primary: 'orange' }),
    ).toThrow()
  })

  it('rejects 8-char hex', () => {
    expect(() =>
      paletteSchema.parse({ ...VALID_PALETTE, primary: '#C9551AFF' }),
    ).toThrow()
  })
})

describe('showFrontmatterSchema', () => {
  it('accepts the Survivor sample', () => {
    expect(() => showFrontmatterSchema.parse(VALID_SHOW)).not.toThrow()
  })

  it('rejects missing slug', () => {
    const { slug: _slug, ...rest } = VALID_SHOW
    expect(() => showFrontmatterSchema.parse(rest)).toThrow()
  })

  it('rejects malformed palette', () => {
    expect(() =>
      showFrontmatterSchema.parse({
        ...VALID_SHOW,
        palette: { ...VALID_PALETTE, primary: 'red' },
      }),
    ).toThrow()
  })

  it('rejects unknown status enum value', () => {
    expect(() =>
      showFrontmatterSchema.parse({ ...VALID_SHOW, status: 'maybe' }),
    ).toThrow()
  })

  it('rejects non-kebab slug', () => {
    expect(() =>
      showFrontmatterSchema.parse({ ...VALID_SHOW, slug: 'Survivor!' }),
    ).toThrow()
  })

  it('rejects missing seasons int', () => {
    const { seasons: _s, ...rest } = VALID_SHOW
    expect(() => showFrontmatterSchema.parse(rest)).toThrow()
  })

  it('rejects negative seasons int', () => {
    expect(() =>
      showFrontmatterSchema.parse({ ...VALID_SHOW, seasons: -1 }),
    ).toThrow()
  })

  it('rejects missing blurb', () => {
    const { blurb: _b, ...rest } = VALID_SHOW
    expect(() => showFrontmatterSchema.parse(rest)).toThrow()
  })

  it('rejects missing tagline', () => {
    const { tagline: _t, ...rest } = VALID_SHOW
    expect(() => showFrontmatterSchema.parse(rest)).toThrow()
  })

  it('rejects extra legacy fields like hero_motifs (strict)', () => {
    expect(() =>
      showFrontmatterSchema.parse({ ...VALID_SHOW, hero_motifs: ['palm'] }),
    ).toThrow()
  })

  it('rejects extra legacy fields like network (strict)', () => {
    expect(() =>
      showFrontmatterSchema.parse({ ...VALID_SHOW, network: 'CBS' }),
    ).toThrow()
  })
})

describe('seasonSchema', () => {
  const base = {
    show: 'survivor',
    number: 1,
    title: 'Borneo',
    format_changes: [],
  }

  it('accepts a 60-word blurb', () => {
    expect(() =>
      seasonSchema.parse({ ...base, blurb_md: validSeasonBlurb(60) }),
    ).not.toThrow()
  })

  it('accepts a 50-word blurb (lower bound)', () => {
    expect(() =>
      seasonSchema.parse({ ...base, blurb_md: validSeasonBlurb(50) }),
    ).not.toThrow()
  })

  it('accepts an 80-word blurb (upper bound)', () => {
    expect(() =>
      seasonSchema.parse({ ...base, blurb_md: validSeasonBlurb(80) }),
    ).not.toThrow()
  })

  it('rejects a 30-word blurb', () => {
    expect(() =>
      seasonSchema.parse({ ...base, blurb_md: validSeasonBlurb(30) }),
    ).toThrow(/50.*80/)
  })

  it('rejects a 95-word blurb', () => {
    expect(() =>
      seasonSchema.parse({ ...base, blurb_md: validSeasonBlurb(95) }),
    ).toThrow(/50.*80/)
  })

  it('rejects missing number', () => {
    const { number: _n, ...rest } = base
    expect(() =>
      seasonSchema.parse({ ...rest, blurb_md: validSeasonBlurb(60) }),
    ).toThrow()
  })

  it('rejects zero or negative number', () => {
    expect(() =>
      seasonSchema.parse({ ...base, number: 0, blurb_md: validSeasonBlurb(60) }),
    ).toThrow()
  })

  it('accepts the new 19c optional editorial fields', () => {
    expect(() =>
      seasonSchema.parse({
        ...base,
        blurb_md: validSeasonBlurb(60),
        eyebrow: 'Returnees Showcase',
        lede: 'A returnees season that finally let the format show what it could do.',
        body: 'Paragraph one.\n\nParagraph two.',
        pull: 'We would defend it without footnotes.',
        vote_question: 'Does this belong in the canon top 10?',
        aired_year: 2010,
        episodes: 14,
        cast_note: '20 returnees',
        tag: 'the format at its loudest',
      }),
    ).not.toThrow()
  })

  it('rejects a non-numeric aired_year', () => {
    expect(() =>
      seasonSchema.parse({
        ...base,
        blurb_md: validSeasonBlurb(60),
        aired_year: '2010',
      }),
    ).toThrow()
  })
})

describe('themeSchema', () => {
  const entry = {
    show: 'survivor',
    season: 1,
    rank: 1,
    blurb: 'A line about the entry',
  }

  it('accepts a 3-entry theme', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        slug: 'best-premieres',
        title: 'Best Premieres',
        description: 'Pilots that landed.',
        entries: [entry, entry, entry],
      }),
    ).not.toThrow()
  })

  it('rejects a 16-entry theme', () => {
    const entries = Array.from({ length: 16 }, () => entry)
    expect(() =>
      themeFrontmatterSchema.parse({
        slug: 'too-many',
        title: 'Too many',
        description: 'over the cap',
        entries,
      }),
    ).toThrow()
  })

  it('rejects an empty theme', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        slug: 'empty',
        title: 'Empty',
        description: 'nothing',
        entries: [],
      }),
    ).toThrow()
  })

  it('themeSchema defaults body_md to empty string', () => {
    const parsed = themeSchema.parse({
      slug: 'simple',
      title: 'Simple',
      description: 'Body optional',
      entries: [entry],
    })
    expect(parsed.body_md).toBe('')
  })
})

describe('canonEntrySchema', () => {
  it('accepts a 95-word rationale', () => {
    expect(() =>
      canonEntrySchema.parse({
        rank: 1,
        season: 28,
        title: 'Cagayan',
        rationale: validRationale(95),
      }),
    ).not.toThrow()
  })

  it('accepts an 80-word rationale (lower bound)', () => {
    expect(() =>
      canonEntrySchema.parse({
        rank: 1,
        season: 28,
        title: 'Cagayan',
        rationale: validRationale(80),
      }),
    ).not.toThrow()
  })

  it('accepts a 120-word rationale (upper bound)', () => {
    expect(() =>
      canonEntrySchema.parse({
        rank: 1,
        season: 28,
        title: 'Cagayan',
        rationale: validRationale(120),
      }),
    ).not.toThrow()
  })

  it('rejects a 30-word rationale', () => {
    expect(() =>
      canonEntrySchema.parse({
        rank: 1,
        season: 28,
        title: 'Cagayan',
        rationale: validRationale(30),
      }),
    ).toThrow(/80.*120/)
  })

  it('rejects a 130-word rationale', () => {
    expect(() =>
      canonEntrySchema.parse({
        rank: 1,
        season: 28,
        title: 'Cagayan',
        rationale: validRationale(130),
      }),
    ).toThrow(/80.*120/)
  })
})

describe('legalDocSchema', () => {
  it('accepts a valid about doc', () => {
    expect(() =>
      legalDocSchema.parse({
        slug: 'about',
        title: 'About Pantheon',
        body_md: '# About\n\nA paragraph.',
      }),
    ).not.toThrow()
  })

  it('rejects unknown slug', () => {
    expect(() =>
      legalDocSchema.parse({
        slug: 'cookies',
        title: 'Cookie policy',
        body_md: 'body',
      }),
    ).toThrow()
  })

  it('rejects empty body', () => {
    expect(() =>
      legalDocSchema.parse({
        slug: 'about',
        title: 'About',
        body_md: '',
      }),
    ).toThrow()
  })
})
