import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  __resetContentCache,
  getAllSeasons,
  getAllShows,
  getAllThemes,
  getCanon,
  getFeaturedThemes,
  getLegalDoc,
  getRelatedThemes,
  getSeason,
  getSeasonBySlug,
  getShow,
  getShowsForTheme,
  getTheme,
  getThemeStats,
  getThemesByCategory,
  loadAllContent,
} from '../loaders'
import { setContentRoot } from '../paths'

const sixtyWords = Array.from({ length: 60 }, (_, i) => `w${i}`).join(' ')
const ninetyWords = Array.from({ length: 90 }, (_, i) => `w${i}`).join(' ')

function makeShow(root: string, slug: string, name: string): void {
  const showFile = path.join(root, 'shows', `${slug}.md`)
  mkdirSync(path.dirname(showFile), { recursive: true })
  writeFileSync(
    showFile,
    `---
slug: ${slug}
name: ${name}
palette:
  primary: "#000000"
  ink: "#FFFFFF"
  paper: "#777777"
seasons: 1
status: airing
blurb: A short blurb.
tagline: A short tagline.
tier: B
network: "Test"
est_year: 2000
genre_tag: "Reality"
featured: false
---
`,
  )
}

function makeSeason(root: string, slug: string, n: number, title: string): void {
  const seasonFile = path.join(root, 'shows', slug, 'seasons', `${String(n).padStart(2, '0')}-${title.toLowerCase()}.md`)
  mkdirSync(path.dirname(seasonFile), { recursive: true })
  writeFileSync(
    seasonFile,
    `---
show: ${slug}
number: ${n}
title: ${title}
---

${sixtyWords}
`,
  )
}

function makeCanon(root: string, slug: string, seasons: number[]): void {
  const canonPath = path.join(root, 'shows', slug, 'canon.md')
  mkdirSync(path.dirname(canonPath), { recursive: true })
  const headings = seasons
    .map((s) => `## ${s}. S${s} title\n\n${ninetyWords}\n`)
    .join('\n')
  writeFileSync(
    canonPath,
    `---
show: ${slug}
---

${headings}
`,
  )
}

type ThemeOpts = {
  category?: 'tone' | 'craft' | 'era' | 'single'
  featured?: boolean
  last_revised?: string
  related?: string[]
  era_range?: [number, number]
}

function makeTheme(
  root: string,
  slug: string,
  entries: Array<{ show: string; season: number; rank: number }>,
  opts: ThemeOpts = {},
): void {
  const themePath = path.join(root, 'themes', `${slug}.md`)
  mkdirSync(path.dirname(themePath), { recursive: true })
  const entryYaml = entries
    .map(
      (e) =>
        `  - show: ${e.show}\n    season: ${e.season}\n    rank: ${e.rank}\n    title: An entry title.\n    blurb: A line.`,
    )
    .join('\n')
  const category = opts.category ?? 'tone'
  const featured = opts.featured ?? false
  const lastRevised = opts.last_revised ?? '2026-01-01'
  const related = opts.related ?? []
  const relatedYaml =
    related.length === 0 ? '[]' : `\n  - ${related.join('\n  - ')}`
  const eraYaml = opts.era_range
    ? `\nera_range:\n  - ${opts.era_range[0]}\n  - ${opts.era_range[1]}`
    : ''
  writeFileSync(
    themePath,
    `---
slug: ${slug}
title: ${slug}
description: Themed list.
tagline: Themed list pull.
category: ${category}
last_revised: ${lastRevised}
featured: ${featured}
related: ${relatedYaml}${eraYaml}
entries:
${entryYaml}
---
`,
  )
}

function makeLegal(root: string, slug: string): void {
  const legalPath = path.join(root, 'legal', `${slug}.md`)
  mkdirSync(path.dirname(legalPath), { recursive: true })
  writeFileSync(
    legalPath,
    `---
slug: ${slug}
title: ${slug}
---

Body of ${slug}.
`,
  )
}

describe('loaders', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'tiered-content-'))
    setContentRoot(tmp)
    __resetContentCache()
  })

  afterEach(() => {
    setContentRoot(null)
    __resetContentCache()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('returns shows sorted by slug', () => {
    makeShow(tmp, 'zulu', 'Zulu')
    makeShow(tmp, 'alpha', 'Alpha')
    const slugs = getAllShows().map((s) => s.slug)
    expect(slugs).toEqual(['alpha', 'zulu'])
  })

  it('returns null on unknown show slug', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    expect(getShow('nope')).toBeNull()
  })

  it('returns seasons sorted by number', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 3, 'Three')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeSeason(tmp, 'alpha', 2, 'Two')
    const numbers = getAllSeasons('alpha').map((s) => s.number)
    expect(numbers).toEqual([1, 2, 3])
  })

  it('returns null for missing season', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    expect(getSeason('alpha', 99)).toBeNull()
    expect(getSeason('alpha', 1)?.title).toBe('One')
  })

  it('returns null when canon file missing', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    expect(getCanon('alpha')).toBeNull()
  })

  it('parses canon when present', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeSeason(tmp, 'alpha', 2, 'Two')
    makeCanon(tmp, 'alpha', [2, 1])
    const canon = getCanon('alpha')
    expect(canon?.entries).toHaveLength(2)
    expect(canon?.entries[0]?.rank).toBe(1)
    expect(canon?.entries[0]?.season).toBe(2)
    expect(canon?.entries[1]?.season).toBe(1)
  })

  it('returns themes sorted by slug', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeTheme(tmp, 'zulu', [{ show: 'alpha', season: 1, rank: 1 }])
    makeTheme(tmp, 'alpha', [{ show: 'alpha', season: 1, rank: 1 }])
    const slugs = getAllThemes().map((t) => t.slug)
    expect(slugs).toEqual(['alpha', 'zulu'])
    expect(getTheme('alpha')?.entries[0]?.show).toBe('alpha')
    expect(getTheme('missing')).toBeNull()
  })

  it('resolves all three legal docs when present, null otherwise', () => {
    makeLegal(tmp, 'about')
    makeLegal(tmp, 'terms')
    expect(getLegalDoc('about')?.slug).toBe('about')
    expect(getLegalDoc('terms')?.slug).toBe('terms')
    expect(getLegalDoc('privacy')).toBeNull()
  })

  it('loadAllContent reports counts', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeSeason(tmp, 'alpha', 2, 'Two')
    makeCanon(tmp, 'alpha', [1, 2])
    makeTheme(tmp, 'alpha', [{ show: 'alpha', season: 1, rank: 1 }])
    makeLegal(tmp, 'about')
    makeLegal(tmp, 'terms')
    makeLegal(tmp, 'privacy')
    const counts = loadAllContent()
    expect(counts).toEqual({
      shows: 1,
      seasons: 2,
      themes: 1,
      legal: 3,
      canons: 1,
    })
  })

  it('cache is reset between tests by __resetContentCache', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    expect(getAllShows()).toHaveLength(1)
    __resetContentCache()
    rmSync(path.join(tmp, 'shows', 'alpha.md'))
    expect(getAllShows()).toHaveLength(0)
  })

  it('getFeaturedThemes returns only featured, capped by limit', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeTheme(tmp, 'a', [{ show: 'alpha', season: 1, rank: 1 }], {
      featured: true,
    })
    makeTheme(tmp, 'b', [{ show: 'alpha', season: 1, rank: 1 }], {
      featured: false,
    })
    makeTheme(tmp, 'c', [{ show: 'alpha', season: 1, rank: 1 }], {
      featured: true,
    })
    makeTheme(tmp, 'd', [{ show: 'alpha', season: 1, rank: 1 }], {
      featured: true,
    })
    expect(getFeaturedThemes(2).map((t) => t.slug)).toEqual(['a', 'c'])
    expect(getFeaturedThemes(10).map((t) => t.slug)).toEqual(['a', 'c', 'd'])
  })

  it('getThemesByCategory groups themes and exposes every category key', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeTheme(tmp, 't1', [{ show: 'alpha', season: 1, rank: 1 }], {
      category: 'tone',
      last_revised: '2026-04-01',
    })
    makeTheme(tmp, 't2', [{ show: 'alpha', season: 1, rank: 1 }], {
      category: 'tone',
      last_revised: '2026-05-01',
    })
    makeTheme(tmp, 'c1', [{ show: 'alpha', season: 1, rank: 1 }], {
      category: 'craft',
    })
    const grouped = getThemesByCategory()
    expect(Object.keys(grouped).sort()).toEqual([
      'craft',
      'era',
      'single',
      'tone',
    ])
    expect(grouped.tone.map((t) => t.slug)).toEqual(['t2', 't1'])
    expect(grouped.craft.map((t) => t.slug)).toEqual(['c1'])
    expect(grouped.era).toEqual([])
    expect(grouped.single).toEqual([])
  })

  it('getShowsForTheme returns shows in first-appearance order without duplicates', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeShow(tmp, 'beta', 'Beta')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeSeason(tmp, 'alpha', 2, 'Two')
    makeSeason(tmp, 'beta', 1, 'One')
    makeTheme(tmp, 'mix', [
      { show: 'beta', season: 1, rank: 1 },
      { show: 'alpha', season: 1, rank: 2 },
      { show: 'beta', season: 1, rank: 3 },
      { show: 'alpha', season: 2, rank: 4 },
    ])
    const theme = getTheme('mix')
    if (!theme) throw new Error('expected theme to exist')
    expect(getShowsForTheme(theme)).toEqual(['beta', 'alpha'])
  })

  it('getRelatedThemes drops unknown slugs and self-references silently', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeTheme(tmp, 'a', [{ show: 'alpha', season: 1, rank: 1 }], {
      related: ['b', 'ghost', 'a'],
    })
    makeTheme(tmp, 'b', [{ show: 'alpha', season: 1, rank: 1 }])
    const a = getTheme('a')
    if (!a) throw new Error('expected theme a to exist')
    const related = getRelatedThemes(a, 5)
    expect(related.map((t) => t.slug)).toEqual(['b'])
  })

  it('getRelatedThemes honors the default limit of 2', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeTheme(tmp, 'a', [{ show: 'alpha', season: 1, rank: 1 }], {
      related: ['b', 'c', 'd'],
    })
    for (const slug of ['b', 'c', 'd']) {
      makeTheme(tmp, slug, [{ show: 'alpha', season: 1, rank: 1 }])
    }
    const a = getTheme('a')
    if (!a) throw new Error('expected theme a to exist')
    expect(getRelatedThemes(a).map((t) => t.slug)).toEqual(['b', 'c'])
  })

  it('getThemeStats aggregates totals across the theme set', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeShow(tmp, 'beta', 'Beta')
    makeSeason(tmp, 'alpha', 1, 'One')
    makeSeason(tmp, 'alpha', 2, 'Two')
    makeSeason(tmp, 'beta', 1, 'One')
    makeTheme(
      tmp,
      'a',
      [
        { show: 'alpha', season: 1, rank: 1 },
        { show: 'beta', season: 1, rank: 2 },
      ],
      { last_revised: '2026-04-15' },
    )
    makeTheme(
      tmp,
      'b',
      [
        { show: 'alpha', season: 2, rank: 1 },
      ],
      { last_revised: '2026-05-20' },
    )
    expect(getThemeStats()).toEqual({
      total: 2,
      totalEntries: 3,
      showsCovered: 2,
      lastIndexRevision: '2026-05-20',
    })
  })

  it('derives season slug from filename and exposes getSeasonBySlug', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    makeSeason(tmp, 'alpha', 4, 'Marquesas')
    const season = getSeason('alpha', 4)
    expect(season?.slug).toBe('marquesas')
    expect(getSeasonBySlug('alpha', 'marquesas')?.number).toBe(4)
    expect(getSeasonBySlug('alpha', 'unknown')).toBeNull()
  })

  it('frontmatter slug overrides the filename derivation', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    const seasonFile = path.join(
      tmp,
      'shows',
      'alpha',
      'seasons',
      '04-marquesas.md',
    )
    mkdirSync(path.dirname(seasonFile), { recursive: true })
    writeFileSync(
      seasonFile,
      `---
show: alpha
number: 4
title: Marquesas
slug: castaway-prime
---

${sixtyWords}
`,
    )
    expect(getSeason('alpha', 4)?.slug).toBe('castaway-prime')
    expect(getSeasonBySlug('alpha', 'castaway-prime')?.number).toBe(4)
  })

  it('throws on a season filename that does not match NN-<slug>.md', () => {
    makeShow(tmp, 'alpha', 'Alpha')
    const bad = path.join(
      tmp,
      'shows',
      'alpha',
      'seasons',
      'oops.md',
    )
    mkdirSync(path.dirname(bad), { recursive: true })
    writeFileSync(
      bad,
      `---
show: alpha
number: 1
title: One
---

${sixtyWords}
`,
    )
    expect(() => getAllSeasons('alpha')).toThrow(/NN-<slug>\.md/)
  })

  it('throws when show slug in frontmatter mismatches filename', () => {
    const showPath = path.join(tmp, 'shows', 'beta.md')
    mkdirSync(path.dirname(showPath), { recursive: true })
    writeFileSync(
      showPath,
      `---
slug: alpha
name: Alpha
palette:
  primary: "#000000"
  ink: "#FFFFFF"
  paper: "#777777"
seasons: 1
status: airing
blurb: A blurb.
tagline: A tagline.
tier: B
network: "Test"
est_year: 2000
genre_tag: "Reality"
featured: false
---
`,
    )
    expect(() => getAllShows()).toThrow(/slug mismatch/)
  })
})
