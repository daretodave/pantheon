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
  opts: { canonical_position?: number } = {},
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
  writeFileSync(
    file,
    `---
show: ${show}
number: ${n}
title: ${slug}${cp}
---

${sixtyWords}
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
