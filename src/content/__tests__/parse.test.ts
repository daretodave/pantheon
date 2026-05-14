import { describe, expect, it } from 'vitest'
import {
  parseCanonFile,
  parseLegalFile,
  parseSeasonFile,
  parseShowFile,
  parseThemeFile,
} from '../parse'

const survivorShow = `---
slug: survivor
name: Survivor
palette:
  primary: "#C9551A"
  ink: "#1A1410"
  paper: "#F5EFE6"
seasons: 47
status: airing
blurb: 47 seasons. One torch at a time.
tagline: The mother format.
tier: S
network: "CBS"
est_year: 2000
genre_tag: "Reality competition"
featured: true
---

Survivor flavor body.
`

const survivorShowExtra = `---
slug: survivor
name: Survivor
palette:
  primary: "#C9551A"
  ink: "#1A1410"
  paper: "#F5EFE6"
seasons: 47
status: airing
blurb: 47 seasons. One torch at a time.
tagline: The mother format.
tier: S
network: "CBS"
est_year: 2000
genre_tag: "Reality competition"
featured: true
hero_motifs: [palm-column]
---
`

const sixtyWords = Array.from({ length: 60 }, (_, i) => `w${i}`).join(' ')
const ninetyWords = Array.from({ length: 90 }, (_, i) => `w${i}`).join(' ')

const borneoSeason = `---
show: survivor
number: 1
title: Borneo
premiere_date: 2000-05-31
ep_count: 13
location: Pulau Tiga, Malaysia
host: Jeff Probst
format_changes: []
---

${sixtyWords}
`

const canonBody = `---
show: survivor
---

Some preamble that should be ignored.

## 28. Cagayan

${ninetyWords}

## 1. Borneo

${ninetyWords}

## 45. Mom I Won

${ninetyWords}

## 41. New Era I

${ninetyWords}
`

const themeSample = `---
slug: best-premieres
title: Best Premieres
description: Pilots that landed.
tagline: The first hour that taught us what a season would be.
category: tone
last_revised: 2026-05-01
entries:
  - show: survivor
    season: 1
    rank: 1
    title: Sixteen Americans, no rulebook.
    blurb: The mother format begins.
  - show: survivor
    season: 28
    rank: 2
    title: Tactical density from the jump.
    blurb: Tactical density from the jump.
---

Optional body for the theme.
`

const legalSample = `---
slug: about
title: About
updated: 2026-05-13
---

# About

Some about copy.
`

describe('parseShowFile', () => {
  it('returns parsed frontmatter + body', () => {
    const file = 'survivor.md'
    const show = parseShowFile(survivorShow, file)
    expect(show.slug).toBe('survivor')
    expect(show.name).toBe('Survivor')
    expect(show.status).toBe('airing')
    expect(show.seasons).toBe(47)
    expect(show.blurb).toBe('47 seasons. One torch at a time.')
    expect(show.tagline).toBe('The mother format.')
    expect(show.body_md).toContain('Survivor flavor body.')
  })

  it('rejects extra frontmatter fields like hero_motifs (strict schema)', () => {
    expect(() => parseShowFile(survivorShowExtra, 'survivor.md')).toThrow(/hero_motifs|Unrecognized/i)
  })

  it('throws ContentValidationError with file path on bad palette', () => {
    const bad = survivorShow.replace('#C9551A', 'orange')
    expect(() => parseShowFile(bad, 'survivor.md')).toThrow(/survivor\.md/)
  })
})

describe('parseSeasonFile', () => {
  it('returns frontmatter + blurb_md, slug derived from filename', () => {
    const season = parseSeasonFile(borneoSeason, '01-borneo.md', 'borneo')
    expect(season.show).toBe('survivor')
    expect(season.number).toBe(1)
    expect(season.title).toBe('Borneo')
    expect(season.slug).toBe('borneo')
    expect(season.premiere_date).toBe('2000-05-31')
    expect(season.location).toBe('Pulau Tiga, Malaysia')
    expect(season.blurb_md).toContain('w0')
  })

  it('rejects a too-short blurb', () => {
    const bad = borneoSeason.replace(sixtyWords, 'too short')
    expect(() => parseSeasonFile(bad, '01-borneo.md', 'borneo')).toThrow(/50.*80/)
  })

  it('frontmatter slug overrides filename derivation', () => {
    const withOverride = `---
show: survivor
number: 1
title: Borneo
slug: castaway-prime
---

${sixtyWords}
`
    const season = parseSeasonFile(withOverride, '01-borneo.md', 'borneo')
    expect(season.slug).toBe('castaway-prime')
  })

  it('throws when no derived slug and no frontmatter slug present', () => {
    expect(() => parseSeasonFile(borneoSeason, 'orphan.md')).toThrow()
  })
})

describe('parseCanonFile', () => {
  it('parses ATX heading sequence into 4 entries with rank from position, season from heading prefix', () => {
    const canon = parseCanonFile(canonBody, 'canon.md')
    expect(canon.show).toBe('survivor')
    expect(canon.entries).toHaveLength(4)

    expect(canon.entries[0]?.rank).toBe(1)
    expect(canon.entries[0]?.season).toBe(28)
    expect(canon.entries[0]?.title).toBe('Cagayan')

    expect(canon.entries[1]?.rank).toBe(2)
    expect(canon.entries[1]?.season).toBe(1)
    expect(canon.entries[1]?.title).toBe('Borneo')

    expect(canon.entries[2]?.rank).toBe(3)
    expect(canon.entries[2]?.season).toBe(45)

    expect(canon.entries[3]?.rank).toBe(4)
    expect(canon.entries[3]?.season).toBe(41)
  })

  it('ignores preamble text before the first heading', () => {
    const canon = parseCanonFile(canonBody, 'canon.md')
    expect(canon.entries[0]?.rationale).not.toContain('Some preamble')
  })

  it('rejects when a rationale is out of band', () => {
    const bad = `---
show: survivor
---

## 1. Borneo

too short
`
    expect(() => parseCanonFile(bad, 'canon.md')).toThrow(/80.*120/)
  })

  it('reads leading tag / slot_argument / community_rank_hint lines into the entry', () => {
    const withMeta = `---
show: survivor
---

## 28. Cagayan

tag: The modern Survivor template.
slot_argument: Every season since 2014 borrows Cagayan's casting math and tribal openness.
community_rank_hint: rank=1 delta=0 sentiment=hold

${ninetyWords}

## 1. Borneo

tag: Foundational document.

${ninetyWords}
`
    const canon = parseCanonFile(withMeta, 'canon.md')
    expect(canon.entries[0]?.tag).toBe('The modern Survivor template.')
    expect(canon.entries[0]?.slot_argument).toContain('casting math')
    expect(canon.entries[0]?.community_rank_hint).toEqual({
      rank: 1,
      delta: 0,
      sentiment: 'hold',
    })
    expect(canon.entries[0]?.rationale.startsWith('w0')).toBe(true)
    expect(canon.entries[1]?.tag).toBe('Foundational document.')
    expect(canon.entries[1]?.slot_argument).toBeUndefined()
    expect(canon.entries[1]?.community_rank_hint).toBeUndefined()
  })

  it('treats non-metadata leading lines as rationale start (no false-positive on prose)', () => {
    const withProse = `---
show: survivor
---

## 1. Borneo

${ninetyWords}
`
    const canon = parseCanonFile(withProse, 'canon.md')
    expect(canon.entries[0]?.tag).toBeUndefined()
    expect(canon.entries[0]?.rationale.startsWith('w0')).toBe(true)
  })
})

describe('parseThemeFile', () => {
  it('parses theme frontmatter + entries + optional body', () => {
    const theme = parseThemeFile(themeSample, 'best-premieres.md')
    expect(theme.slug).toBe('best-premieres')
    expect(theme.entries).toHaveLength(2)
    expect(theme.entries[0]?.show).toBe('survivor')
    expect(theme.entries[0]?.season).toBe(1)
    expect(theme.body_md).toContain('Optional body')
  })
})

describe('parseLegalFile', () => {
  it('parses frontmatter + body', () => {
    const doc = parseLegalFile(legalSample, 'about.md')
    expect(doc.slug).toBe('about')
    expect(doc.title).toBe('About')
    expect(doc.updated).toBe('2026-05-13')
    expect(doc.body_md).toContain('# About')
  })
})
