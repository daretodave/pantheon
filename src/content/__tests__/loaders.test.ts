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
  getLegalDoc,
  getSeason,
  getShow,
  getTheme,
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
network: TestNet
format: test-format
palette:
  primary: "#000000"
  ink: "#FFFFFF"
  paper: "#777777"
status: airing
tagline: A short tagline.
---

Body.
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

function makeTheme(root: string, slug: string, entries: Array<{ show: string; season: number; rank: number }>): void {
  const themePath = path.join(root, 'themes', `${slug}.md`)
  mkdirSync(path.dirname(themePath), { recursive: true })
  const entryYaml = entries
    .map(
      (e) =>
        `  - show: ${e.show}\n    season: ${e.season}\n    rank: ${e.rank}\n    blurb: A line.`,
    )
    .join('\n')
  writeFileSync(
    themePath,
    `---
slug: ${slug}
title: ${slug}
description: Themed list.
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
    tmp = mkdtempSync(path.join(tmpdir(), 'pantheon-content-'))
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

  it('throws when show slug in frontmatter mismatches filename', () => {
    const showPath = path.join(tmp, 'shows', 'beta.md')
    mkdirSync(path.dirname(showPath), { recursive: true })
    writeFileSync(
      showPath,
      `---
slug: alpha
name: Alpha
network: TestNet
format: test-format
palette:
  primary: "#000000"
  ink: "#FFFFFF"
  paper: "#777777"
status: airing
---

body
`,
    )
    expect(() => getAllShows()).toThrow(/slug mismatch/)
  })
})
