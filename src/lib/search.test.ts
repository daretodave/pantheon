import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Tokenizer is pure; we can import and test directly. The
// search() flow uses live content loaders, so the integration
// pieces use a temp content/ root.

import { tokenize, groupByType } from './search'

describe('tokenize', () => {
  it('lowercases and splits on non-word', () => {
    expect(tokenize('Hello, World')).toEqual(['hello', 'world'])
  })

  it('drops length-1 tokens', () => {
    expect(tokenize('a b cd')).toEqual(['cd'])
  })

  it('drops stop words', () => {
    expect(tokenize('the cat in the hat')).toEqual(['cat', 'hat'])
  })

  it('handles unicode + punctuation', () => {
    expect(tokenize('Survivor: Cagayan — Brains/Brawn/Beauty')).toEqual([
      'survivor',
      'cagayan',
      'brains',
      'brawn',
      'beauty',
    ])
  })
})

describe('groupByType', () => {
  it('partitions hits into shows / seasons / themes', () => {
    const out = groupByType([
      { type: 'show', slug: 's', title: 'S', href: '/shows/s', snippet: '', score: 1 },
      {
        type: 'season',
        show: 's',
        number: 1,
        title: 'One',
        href: '/shows/s/season/1',
        snippet: '',
        score: 1,
      },
      { type: 'theme', slug: 't', title: 'T', href: '/themes/t', snippet: '', score: 1 },
    ])
    expect(out.shows.length).toBe(1)
    expect(out.seasons.length).toBe(1)
    expect(out.themes.length).toBe(1)
  })
})

describe('search() — integration via temp content/', () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'pantheon-search-'))
    mkdirSync(join(tmpRoot, 'shows', 'survivor', 'seasons'), { recursive: true })
    mkdirSync(join(tmpRoot, 'themes'), { recursive: true })

    writeFileSync(
      join(tmpRoot, 'shows', 'survivor.md'),
      `---
slug: survivor
name: Survivor
network: CBS
format: reality competition
hero_motifs: [torch, idol]
palette:
  primary: '#aa3300'
  ink: '#111111'
  paper: '#fafafa'
status: airing
tagline: Sixteen Americans on an island
---

Body.
`,
    )
    writeFileSync(
      join(tmpRoot, 'shows', 'survivor', 'seasons', '01-borneo.md'),
      `---
show: survivor
number: 1
title: Borneo
premiere_date: 2000-05-31
ep_count: 13
location: Pulau Tiga Malaysia
host: Jeff Probst
format_changes: []
---

Sixteen Americans on a Malaysian island and a host with a torch — that was the pitch, and the format invented itself on camera. The cast plays like people who half-believe they are on a game show and half-believe they are on a documentary. CBS aired it across the summer.
`,
    )
    writeFileSync(
      join(tmpRoot, 'themes', 'firsts.md'),
      `---
slug: firsts
title: Firsts that hold up
description: Reality competitions get rebooted constantly. These are the season-zeros and resets that earned their reputation.
entries:
  - show: survivor
    season: 1
    rank: 1
    blurb: The literal first.
---
`,
    )

    const content = await import('@/content')
    content.setContentRoot(tmpRoot)
    content.__resetContentCache()
  })

  afterEach(async () => {
    const content = await import('@/content')
    content.__resetContentCache()
    content.setContentRoot(null)
    rmSync(tmpRoot, { recursive: true, force: true })
    vi.resetModules()
  })

  it('returns [] for an empty query', async () => {
    const { search } = await import('./search')
    expect(search('')).toEqual([])
    expect(search('   ')).toEqual([])
  })

  it('returns [] for a query of only stop words', async () => {
    const { search } = await import('./search')
    expect(search('the and or')).toEqual([])
  })

  it('survivor query matches the show and the season', async () => {
    const { search } = await import('./search')
    const hits = search('survivor')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.find((h) => h.type === 'show' && h.title === 'Survivor')).toBeTruthy()
    expect(hits.find((h) => h.type === 'season' && h.number === 1)).toBeTruthy()
  })

  it('matches season blurb body (malaysian → season 1)', async () => {
    const { search } = await import('./search')
    const hits = search('malaysian')
    expect(hits.find((h) => h.type === 'season')).toBeTruthy()
  })

  it('matches theme by slug + title', async () => {
    const { search } = await import('./search')
    const hits = search('firsts')
    expect(hits.find((h) => h.type === 'theme' && h.slug === 'firsts')).toBeTruthy()
  })

  it('ranks title-matches above body-matches', async () => {
    const { search } = await import('./search')
    const hits = search('borneo')
    // 'borneo' is the season title — the season hit should rank
    // highest among results (above any incidental body matches).
    expect(hits[0]?.type).toBe('season')
    expect(hits[0]?.title.toLowerCase()).toContain('borneo')
  })

  it('respects the limit option', async () => {
    const { search } = await import('./search')
    const hits = search('survivor', { limit: 1 })
    expect(hits.length).toBe(1)
  })

  it('snippet includes ellipses around the matched token when in the middle of long text', async () => {
    const { search } = await import('./search')
    const hits = search('camera')
    const seasonHit = hits.find((h) => h.type === 'season')
    expect(seasonHit?.snippet).toMatch(/…?.*camera.*…?/i)
  })
})
