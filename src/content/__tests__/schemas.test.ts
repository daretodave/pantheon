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
  tier: 'S' as const,
  network: 'CBS',
  est_year: 2000,
  genre_tag: 'Reality competition',
  featured: true,
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

  it('rejects extra legacy fields like format (strict)', () => {
    expect(() =>
      showFrontmatterSchema.parse({ ...VALID_SHOW, format: 'serial' }),
    ).toThrow()
  })
})

describe('seasonSchema', () => {
  const base = {
    show: 'survivor',
    number: 1,
    slug: 'borneo',
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
    title: 'Sixteen Americans, no rulebook.',
    blurb: 'A line about the entry',
  }

  const base = {
    slug: 'best-premieres',
    title: 'Best Premieres',
    description: 'Pilots that landed.',
    tagline: 'The first hour that taught us what a season would be.',
    category: 'tone' as const,
    last_revised: '2026-05-01',
  }

  it('accepts a 3-entry theme', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        entries: [entry, entry, entry],
      }),
    ).not.toThrow()
  })

  it('accepts the new 30-entry cap', () => {
    const entries = Array.from({ length: 30 }, () => entry)
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        entries,
      }),
    ).not.toThrow()
  })

  it('rejects a 31-entry theme', () => {
    const entries = Array.from({ length: 31 }, () => entry)
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        slug: 'too-many',
        title: 'Too many',
        entries,
      }),
    ).toThrow()
  })

  it('rejects an empty theme', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        slug: 'empty',
        title: 'Empty',
        entries: [],
      }),
    ).toThrow()
  })

  it('rejects missing per-entry title', () => {
    const { title: _t, ...entryNoTitle } = entry
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        entries: [entryNoTitle],
      }),
    ).toThrow()
  })

  it('rejects missing tagline', () => {
    const { tagline: _t, ...rest } = base
    expect(() =>
      themeFrontmatterSchema.parse({
        ...rest,
        entries: [entry],
      }),
    ).toThrow()
  })

  it('rejects missing category', () => {
    const { category: _c, ...rest } = base
    expect(() =>
      themeFrontmatterSchema.parse({
        ...rest,
        entries: [entry],
      }),
    ).toThrow()
  })

  it('rejects unknown category', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        category: 'vibes',
        entries: [entry],
      }),
    ).toThrow()
  })

  it('rejects missing last_revised', () => {
    const { last_revised: _l, ...rest } = base
    expect(() =>
      themeFrontmatterSchema.parse({
        ...rest,
        entries: [entry],
      }),
    ).toThrow()
  })

  it('rejects category=era without era_range', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        category: 'era',
        entries: [entry],
      }),
    ).toThrow()
  })

  it('accepts category=era with era_range', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        category: 'era',
        era_range: [2003, 2010],
        entries: [entry],
      }),
    ).not.toThrow()
  })

  it('themeSchema defaults body_md to empty string', () => {
    const parsed = themeSchema.parse({
      ...base,
      slug: 'simple',
      title: 'Simple',
      entries: [entry],
    })
    expect(parsed.body_md).toBe('')
  })

  it('defaults sentiment, status, curator, featured, related when omitted', () => {
    const parsed = themeFrontmatterSchema.parse({
      ...base,
      slug: 'defaults',
      title: 'Defaults',
      entries: [entry],
    })
    expect(parsed.sentiment).toBe('hold')
    expect(parsed.status).toBe('stable')
    expect(parsed.curator).toBe('tiered.tv Editors')
    expect(parsed.featured).toBe(false)
    expect(parsed.related).toEqual([])
  })

  it('themeFrontmatter accepts every valid sentiment value', () => {
    for (const sentiment of [
      'warm-up',
      'warm-down',
      'neutral',
      'hold',
      'verdict',
      'consensus',
    ] as const) {
      const parsed = themeFrontmatterSchema.parse({
        ...base,
        slug: `s-${sentiment}`,
        title: sentiment,
        sentiment,
        entries: [entry],
      })
      expect(parsed.sentiment).toBe(sentiment)
    }
  })

  it('themeFrontmatter rejects unknown sentiment values', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        slug: 'bad',
        title: 'Bad',
        sentiment: 'spicy',
        entries: [entry],
      }),
    ).toThrow()
  })

  it('rejects per-entry blurb over 280 chars', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        entries: [{ ...entry, blurb: 'x'.repeat(281) }],
      }),
    ).toThrow()
  })

  it('rejects season_label over 60 chars', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        entries: [{ ...entry, season_label: 'x'.repeat(61) }],
      }),
    ).toThrow()
  })

  it('rejects related list over 4 entries', () => {
    expect(() =>
      themeFrontmatterSchema.parse({
        ...base,
        related: ['a', 'b', 'c', 'd', 'e'],
        entries: [entry],
      }),
    ).toThrow()
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
        title: 'About tiered.tv',
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
