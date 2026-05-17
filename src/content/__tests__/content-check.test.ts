import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { __resetContentCache } from '../loaders'
import { setContentRoot } from '../paths'
// scripts/content-check.ts exports its assertion logic so the same
// rules can be exercised in vitest without spawning a child process.
import { collectFailures } from '../../../scripts/content-check'

const sixtyWords = Array.from({ length: 60 }, (_, i) => `w${i}`).join(' ')
const ninetyWords = Array.from({ length: 90 }, (_, i) => `w${i}`).join(' ')
const fortyWords = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ')

function makeShow(root: string, slug: string): void {
  const file = path.join(root, 'shows', `${slug}.md`)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(
    file,
    `---
slug: ${slug}
name: ${slug}
palette:
  primary: "#000000"
  ink: "#FFFFFF"
  paper: "#777777"
seasons: 2
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
}

function makeSeason(
  root: string,
  show: string,
  n: number,
  slug: string,
  opts: { canonical_position?: number; premiere_date?: string } = {},
): void {
  const file = path.join(
    root,
    'shows',
    show,
    'seasons',
    `${String(n).padStart(2, '0')}-${slug}.md`,
  )
  mkdirSync(path.dirname(file), { recursive: true })
  const cp =
    opts.canonical_position != null
      ? `\ncanonical_position: ${opts.canonical_position}`
      : ''
  const pd =
    opts.premiere_date != null ? `\npremiere_date: ${opts.premiere_date}` : ''
  writeFileSync(
    file,
    `---
show: ${show}
number: ${n}
title: ${slug}${cp}${pd}
---

${sixtyWords}
`,
  )
}

// Canon with an explicit era_bands block — used to exercise the
// phase-34 coverage invariant. `ranks` are auto-numbered 1..N over
// seasons 1..N so the canon validates without per-season tuning.
function makeEraCanon(
  root: string,
  show: string,
  seasonCount: number,
  bands: Array<{ key: string; label: string; range: [number, number] }>,
): void {
  const file = path.join(root, 'shows', show, 'canon.md')
  mkdirSync(path.dirname(file), { recursive: true })
  const bandsYaml = bands
    .map(
      (b) =>
        `  - key: ${b.key}\n    label: ${b.label}\n    range: [${b.range[0]}, ${b.range[1]}]`,
    )
    .join('\n')
  const headings = Array.from(
    { length: seasonCount },
    (_, i) => `## ${i + 1}. Title ${i + 1}\n\n${ninetyWords}\n`,
  ).join('\n')
  writeFileSync(
    file,
    `---
show: ${show}
era_bands:
${bandsYaml}
---

${headings}
`,
  )
}

function makeCanon(
  root: string,
  show: string,
  ranks: Array<{ rank: number; season: number; title: string }>,
): void {
  const file = path.join(root, 'shows', show, 'canon.md')
  mkdirSync(path.dirname(file), { recursive: true })
  const ordered = ranks.slice().sort((a, b) => a.rank - b.rank)
  const headings = ordered
    .map((r) => `## ${r.season}. ${r.title}\n\n${ninetyWords}\n`)
    .join('\n')
  writeFileSync(
    file,
    `---
show: ${show}
---

${headings}
`,
  )
}

function makeMethodologyCanon(root: string, show: string, season: number): void {
  const file = path.join(root, 'shows', show, 'canon.md')
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(
    file,
    `---
show: ${show}
editor: Test Editor
last_revised: 2026-05-14
meth_who_h: Who ranks
meth_who_p: ${fortyWords}
weekly_question: Question of the week?
era_bands:
  - key: era-one
    label: Era One
    range:
      - 2000
      - 2010
---

## ${season}. Title

${ninetyWords}
`,
  )
}

describe('content-check (lax mode)', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'tiered-content-check-'))
    setContentRoot(tmp)
    __resetContentCache()
  })

  afterEach(() => {
    setContentRoot(null)
    __resetContentCache()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('passes when a show has seasons but no canon (lax tolerance)', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one')
    makeSeason(tmp, 'alpha', 2, 'two')
    expect(collectFailures(false)).toEqual([])
  })

  it('passes when canon and seasons agree on ranks', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one', { canonical_position: 2 })
    makeSeason(tmp, 'alpha', 2, 'two', { canonical_position: 1 })
    makeCanon(tmp, 'alpha', [
      { rank: 1, season: 2, title: 'Two' },
      { rank: 2, season: 1, title: 'One' },
    ])
    expect(collectFailures(false)).toEqual([])
  })

  it('fails when canonical_position disagrees with canon rank', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one', { canonical_position: 5 })
    makeCanon(tmp, 'alpha', [{ rank: 1, season: 1, title: 'One' }])
    const failures = collectFailures(false)
    expect(failures.length).toBeGreaterThan(0)
    expect(failures[0]?.message).toMatch(/canonical_position 5/)
    expect(failures[0]?.message).toMatch(/#1/)
  })

  it('fails when canon entry references a missing season', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one')
    makeCanon(tmp, 'alpha', [
      { rank: 1, season: 1, title: 'One' },
      { rank: 2, season: 99, title: 'Ghost' },
    ])
    const failures = collectFailures(false)
    expect(failures.some((f) => f.message.includes('season 99'))).toBe(true)
  })

  it('passes when a season has canonical_position but the show has no canon', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one', { canonical_position: 1 })
    expect(collectFailures(false)).toEqual([])
  })

  it('accepts the new optional canon frontmatter (editor / methodology / era_bands)', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 5, 'five')
    makeMethodologyCanon(tmp, 'alpha', 5)
    expect(collectFailures(false)).toEqual([])
  })
})

describe('content-check (strict mode preview)', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'tiered-content-check-strict-'))
    setContentRoot(tmp)
    __resetContentCache()
  })

  afterEach(() => {
    setContentRoot(null)
    __resetContentCache()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('fails strict when a show with seasons has no canon', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one')
    const failures = collectFailures(true)
    expect(failures.some((f) => f.message.includes('canon.md required'))).toBe(true)
  })

  it('fails strict when a season has no canonical_position', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one')
    makeCanon(tmp, 'alpha', [{ rank: 1, season: 1, title: 'One' }])
    const failures = collectFailures(true)
    expect(failures.some((f) => f.message.includes('missing canonical_position'))).toBe(true)
  })

  it('passes strict when every season has canon + canonical_position', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 'one', { canonical_position: 2 })
    makeSeason(tmp, 'alpha', 2, 'two', { canonical_position: 1 })
    makeCanon(tmp, 'alpha', [
      { rank: 1, season: 2, title: 'Two' },
      { rank: 2, season: 1, title: 'One' },
    ])
    expect(collectFailures(true)).toEqual([])
  })
})

describe('content-check — era-band coverage (phase 34)', () => {
  let tmp: string
  const eraMsg = (fs: ReturnType<typeof collectFailures>) =>
    fs.filter((f) => /era[ _]band/i.test(f.message))

  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'tiered-content-check-era-'))
    setContentRoot(tmp)
    __resetContentCache()
  })

  afterEach(() => {
    setContentRoot(null)
    __resetContentCache()
    rmSync(tmp, { recursive: true, force: true })
  })

  function eightSeasons(show: string): void {
    for (let i = 1; i <= 8; i++) {
      makeSeason(tmp, show, i, `s${i}`, {
        premiere_date: `${2000 + i}-01-01`,
      })
    }
  }

  it('lax tolerates a canon with no era_bands on a large show', () => {
    makeShow(tmp, 'alpha')
    eightSeasons('alpha')
    makeCanon(
      tmp,
      'alpha',
      Array.from({ length: 8 }, (_, i) => ({
        rank: i + 1,
        season: i + 1,
        title: `S${i + 1}`,
      })),
    )
    expect(eraMsg(collectFailures(false))).toEqual([])
  })

  it('strict requires era_bands on a canon’d show with >= 8 seasons', () => {
    makeShow(tmp, 'alpha')
    eightSeasons('alpha')
    makeCanon(
      tmp,
      'alpha',
      Array.from({ length: 8 }, (_, i) => ({
        rank: i + 1,
        season: i + 1,
        title: `S${i + 1}`,
      })),
    )
    const problems = eraMsg(collectFailures(true))
    expect(problems.some((f) => /era_bands required/.test(f.message))).toBe(true)
  })

  it('strict does not require era_bands on a small canon’d show', () => {
    makeShow(tmp, 'alpha')
    makeSeason(tmp, 'alpha', 1, 's1', {
      canonical_position: 1,
      premiere_date: '2020-01-01',
    })
    makeCanon(tmp, 'alpha', [{ rank: 1, season: 1, title: 'S1' }])
    expect(eraMsg(collectFailures(true))).toEqual([])
  })

  it('fails (even in lax) when present era_bands leave a gap', () => {
    makeShow(tmp, 'alpha')
    eightSeasons('alpha')
    makeEraCanon(tmp, 'alpha', 8, [
      { key: 'early', label: 'Early', range: [2001, 2003] },
      { key: 'late', label: 'Late', range: [2006, 2010] },
    ])
    const problems = eraMsg(collectFailures(false))
    expect(problems.some((f) => /gap between/.test(f.message))).toBe(true)
  })

  it('fails when present era_bands stop before the latest aired season', () => {
    makeShow(tmp, 'alpha')
    eightSeasons('alpha') // years 2001..2008
    makeEraCanon(tmp, 'alpha', 8, [
      { key: 'all', label: 'All', range: [2001, 2007] },
    ])
    const problems = eraMsg(collectFailures(false))
    expect(problems.some((f) => /latest aired season is 2008/.test(f.message))).toBe(
      true,
    )
  })

  it('passes when present era_bands are contiguous and cover the span', () => {
    makeShow(tmp, 'alpha')
    eightSeasons('alpha') // years 2001..2008
    makeEraCanon(tmp, 'alpha', 8, [
      { key: 'early', label: 'Early', range: [2001, 2004] },
      { key: 'late', label: 'Late', range: [2005, 2008] },
    ])
    expect(eraMsg(collectFailures(false))).toEqual([])
    expect(eraMsg(collectFailures(true))).toEqual([])
  })
})
