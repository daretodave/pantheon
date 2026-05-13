import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Spin up a tiny content/ root with one show, two seasons, and
// two themed lists — one referencing the show, one not — to
// exercise themesContainingShow() without depending on the live
// content tree.

describe('themesContainingShow', () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'pantheon-bs-'))
    mkdirSync(join(tmpRoot, 'shows', 'survivor', 'seasons'), { recursive: true })
    mkdirSync(join(tmpRoot, 'shows', 'top-chef'), { recursive: true })
    mkdirSync(join(tmpRoot, 'themes'), { recursive: true })

    writeFileSync(
      join(tmpRoot, 'shows', 'survivor.md'),
      `---
slug: survivor
name: Survivor
palette:
  primary: '#aa3300'
  ink: '#111111'
  paper: '#fafafa'
seasons: 47
status: airing
blurb: One torch at a time.
tagline: 47 seasons of strangers on a beach.
---
`,
    )
    writeFileSync(
      join(tmpRoot, 'shows', 'top-chef.md'),
      `---
slug: top-chef
name: Top Chef
palette:
  primary: '#003366'
  ink: '#111111'
  paper: '#fafafa'
seasons: 22
status: airing
blurb: Knives drawn, herbs fresh.
tagline: 22 seasons of professional cooks.
---
`,
    )
    writeFileSync(
      join(tmpRoot, 'shows', 'survivor', 'seasons', '01-borneo.md'),
      `---
show: survivor
number: 1
title: Borneo
---

Sixteen Americans on a Malaysian island and a host with a torch — that was the pitch, and the format invented itself on camera. The cast plays like people who half-believe they're on a game show and half-believe they're on a documentary. CBS aired it across the summer of two thousand as appointment television, and the rough edges show in the best way.
`,
    )
    writeFileSync(
      join(tmpRoot, 'themes', 'survivor-only.md'),
      `---
slug: survivor-only
title: Survivor only
description: Themed list referencing only survivor seasons.
entries:
  - show: survivor
    season: 1
    rank: 1
    blurb: The founding text.
---
`,
    )
    writeFileSync(
      join(tmpRoot, 'themes', 'empty-theme.md'),
      `---
slug: empty-theme
title: Empty theme
description: Themed list referencing a show with no surviving entries.
entries:
  - show: survivor
    season: 1
    rank: 1
    blurb: irrelevant
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

  it('returns themes that contain the given show', async () => {
    const { themesContainingShow } = await import('./byShow')
    const themes = themesContainingShow('survivor')
    expect(themes.map((t) => t.slug).sort()).toEqual(['empty-theme', 'survivor-only'])
  })

  it('returns empty array when no themes reference the show', async () => {
    const { themesContainingShow } = await import('./byShow')
    expect(themesContainingShow('top-chef')).toEqual([])
  })

  it('returns empty array for unknown show', async () => {
    const { themesContainingShow } = await import('./byShow')
    expect(themesContainingShow('does-not-exist')).toEqual([])
  })
})
