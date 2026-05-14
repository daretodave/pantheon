import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('getSearchIndex', () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'tiered-search-index-'))
    mkdirSync(join(tmpRoot, 'shows', 'survivor', 'seasons'), { recursive: true })
    mkdirSync(join(tmpRoot, 'shows', 'top-chef', 'seasons'), { recursive: true })
    mkdirSync(join(tmpRoot, 'themes'), { recursive: true })

    writeFileSync(
      join(tmpRoot, 'shows', 'survivor.md'),
      `---
slug: survivor
name: Survivor
palette:
  primary: '#D55E36'
  ink: '#EFE2BD'
  paper: '#0E2A2A'
seasons: 47
status: airing
blurb: One torch at a time.
tagline: 47 seasons of strangers on a beach.
tier: S
network: "CBS"
est_year: 2000
genre_tag: "Reality competition"
featured: true
---
`,
    )
    writeFileSync(
      join(tmpRoot, 'shows', 'top-chef.md'),
      `---
slug: top-chef
name: Top Chef
palette:
  primary: '#B86A2E'
  ink: '#EAE2D4'
  paper: '#1E160F'
seasons: 21
status: ended
blurb: A finished dish, every time.
tagline: Twenty-one seasons in the pass.
tier: A
network: "Bravo"
est_year: 2006
genre_tag: "Culinary competition"
featured: false
---
`,
    )
    writeFileSync(
      join(tmpRoot, 'shows', 'survivor', 'seasons', '20-heroes-vs-villains.md'),
      `---
show: survivor
number: 20
title: Heroes vs. Villains
location: Samoa
host: Jeff Probst
format_changes: []
---

A returning-player season that delivered every promise of the format and most of the promises of the show itself. Twenty contestants, ten heroes, ten villains, every one of them played to win, and most of them played to be remembered for it. The editing is brutal and fair and somehow loving toward people who do terrible things on television. The cast was top-shelf and the game responded by sharpening every twist the producers had been hoarding for ten years.
`,
    )
    writeFileSync(
      join(tmpRoot, 'themes', 'best-premieres.md'),
      `---
slug: best-premieres
title: Best premieres ever
description: The cold opens that promised a season worth staying for.
tagline: The episodes that promised a season.
category: tone
sentiment: warm-up
last_revised: 2026-05-01
entries:
  - show: survivor
    season: 1
    rank: 1
    title: The literal first.
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

  it('emits show + season + list + tier rows', async () => {
    const { getSearchIndex } = await import('./searchIndex')
    const items = getSearchIndex()
    const types = new Set(items.map((i) => i.type))
    expect(types.has('show')).toBe(true)
    expect(types.has('season')).toBe(true)
    expect(types.has('list')).toBe(true)
    expect(types.has('tier')).toBe(true)
  })

  it('routes shows to /shows/[slug]', async () => {
    const { getSearchIndex } = await import('./searchIndex')
    const shows = getSearchIndex().filter((i) => i.type === 'show')
    expect(shows.find((s) => s.name === 'Survivor')?.href).toBe('/shows/survivor')
  })

  it('formats season meta with show name + zero-padded number', async () => {
    const { getSearchIndex } = await import('./searchIndex')
    const seasons = getSearchIndex().filter((i) => i.type === 'season')
    const heroes = seasons.find((s) => s.name === 'Heroes vs. Villains')
    expect(heroes?.meta).toBe('Survivor · season 20')
    expect(heroes?.href).toBe('/shows/survivor/season/20')
    expect(heroes?.tier).toBe('S')
  })

  it('produces one tier row per tier with at least one show', async () => {
    const { getSearchIndex } = await import('./searchIndex')
    const tiers = getSearchIndex().filter((i) => i.type === 'tier')
    expect(tiers.map((t) => t.name).sort()).toEqual(['A tier', 'S tier'])
    expect(tiers[0]?.href.startsWith('/shows#tier-')).toBe(true)
  })

  it('routes lists to /themes/[slug] with show + entry meta', async () => {
    const { getSearchIndex } = await import('./searchIndex')
    const lists = getSearchIndex().filter((i) => i.type === 'list')
    const best = lists.find((l) => l.name === 'Best premieres ever')
    expect(best?.href).toBe('/themes/best-premieres')
    expect(best?.meta).toMatch(/1 show/)
  })
})
