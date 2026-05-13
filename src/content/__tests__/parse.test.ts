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
network: CBS
format: outwit-outplay-outlast
hero_motifs: [palm-column, torch-pediment]
palette:
  primary: "#C9551A"
  ink: "#1A1410"
  paper: "#F5EFE6"
status: airing
first_aired: 2000-05-31
tagline: The mother format.
---

Survivor flavor body.
`

const survivorShowNoTagline = `---
slug: survivor
name: Survivor
network: CBS
format: outwit-outplay-outlast
palette:
  primary: "#C9551A"
  ink: "#1A1410"
  paper: "#F5EFE6"
status: airing
---

The mother format. Forty-plus seasons of strangers and beaches.
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
entries:
  - show: survivor
    season: 1
    rank: 1
    blurb: The mother format begins.
  - show: survivor
    season: 28
    rank: 2
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
    expect(show.first_aired).toBe('2000-05-31')
    expect(show.tagline).toBe('The mother format.')
    expect(show.body_md).toContain('Survivor flavor body.')
  })

  it('uses body as tagline fallback when frontmatter lacks tagline', () => {
    const show = parseShowFile(survivorShowNoTagline, 'survivor.md')
    expect(show.tagline).toContain('mother format')
  })

  it('throws ContentValidationError with file path on bad palette', () => {
    const bad = survivorShow.replace('#C9551A', 'orange')
    expect(() => parseShowFile(bad, 'survivor.md')).toThrow(/survivor\.md/)
  })
})

describe('parseSeasonFile', () => {
  it('returns frontmatter + blurb_md', () => {
    const season = parseSeasonFile(borneoSeason, 'borneo.md')
    expect(season.show).toBe('survivor')
    expect(season.number).toBe(1)
    expect(season.title).toBe('Borneo')
    expect(season.premiere_date).toBe('2000-05-31')
    expect(season.location).toBe('Pulau Tiga, Malaysia')
    expect(season.blurb_md).toContain('w0')
  })

  it('rejects a too-short blurb', () => {
    const bad = borneoSeason.replace(sixtyWords, 'too short')
    expect(() => parseSeasonFile(bad, 'borneo.md')).toThrow(/50.*80/)
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
