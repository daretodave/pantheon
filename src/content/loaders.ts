import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  canonFile as canonFilePath,
  legalFile,
  seasonsDir,
  showFile,
  showsDir,
  themeFile,
  themesDir,
} from './paths'
import {
  parseCanonFile,
  parseLegalFile,
  parseSeasonFile,
  parseShowFile,
  parseThemeFile,
} from './parse'
import type { CanonFile, LegalDoc, Season, Show, Theme } from './schemas'

type LegalSlug = 'about' | 'terms' | 'privacy'

type Cache = {
  shows: Map<string, Show>
  seasons: Map<string, Season[]>
  canons: Map<string, CanonFile | null>
  themes: Map<string, Theme>
  legal: Map<LegalSlug, LegalDoc | null>
  ready: boolean
}

let cache: Cache | null = null

function fresh(): Cache {
  return {
    shows: new Map(),
    seasons: new Map(),
    canons: new Map(),
    themes: new Map(),
    legal: new Map(),
    ready: false,
  }
}

function ensure(): Cache {
  if (cache?.ready) return cache
  const c = fresh()
  loadShows(c)
  loadThemes(c)
  loadLegal(c)
  c.ready = true
  cache = c
  return c
}

function readMd(file: string): string {
  return readFileSync(file, 'utf8')
}

function loadShows(c: Cache): void {
  const dir = showsDir()
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md')) continue
    const slug = entry.name.replace(/\.md$/, '')
    const file = showFile(slug)
    const show = parseShowFile(readMd(file), file)
    if (show.slug !== slug) {
      throw new Error(
        `show slug mismatch: file ${file} declares slug "${show.slug}"`,
      )
    }
    c.shows.set(slug, show)
    loadShowSeasons(c, slug)
    loadShowCanon(c, slug)
  }
}

function loadShowSeasons(c: Cache, slug: string): void {
  const dir = seasonsDir(slug)
  if (!existsSync(dir)) {
    c.seasons.set(slug, [])
    return
  }
  const seasons: Season[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md')) continue
    const file = path.join(dir, entry.name)
    const season = parseSeasonFile(readMd(file), file)
    if (season.show !== slug) {
      throw new Error(
        `season show mismatch: file ${file} declares show "${season.show}", expected "${slug}"`,
      )
    }
    seasons.push(season)
  }
  seasons.sort((a, b) => a.number - b.number)
  c.seasons.set(slug, seasons)
}

function loadShowCanon(c: Cache, slug: string): void {
  const file = canonFilePath(slug)
  if (!existsSync(file)) {
    c.canons.set(slug, null)
    return
  }
  const canon = parseCanonFile(readMd(file), file)
  if (canon.show !== slug) {
    throw new Error(
      `canon show mismatch: file ${file} declares show "${canon.show}", expected "${slug}"`,
    )
  }
  c.canons.set(slug, canon)
}

function loadThemes(c: Cache): void {
  const dir = themesDir()
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md')) continue
    const slug = entry.name.replace(/\.md$/, '')
    const file = themeFile(slug)
    const theme = parseThemeFile(readMd(file), file)
    if (theme.slug !== slug) {
      throw new Error(
        `theme slug mismatch: file ${file} declares slug "${theme.slug}"`,
      )
    }
    c.themes.set(slug, theme)
  }
}

function loadLegal(c: Cache): void {
  for (const slug of ['about', 'terms', 'privacy'] as const) {
    const file = legalFile(slug)
    if (!existsSync(file)) {
      c.legal.set(slug, null)
      continue
    }
    const doc = parseLegalFile(readMd(file), file)
    if (doc.slug !== slug) {
      throw new Error(
        `legal slug mismatch: file ${file} declares slug "${doc.slug}"`,
      )
    }
    c.legal.set(slug, doc)
  }
}

export function getAllShows(): Show[] {
  const c = ensure()
  return [...c.shows.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}

export function getShow(slug: string): Show | null {
  const c = ensure()
  return c.shows.get(slug) ?? null
}

export function getAllSeasons(showSlug: string): Season[] {
  const c = ensure()
  return c.seasons.get(showSlug) ?? []
}

export function getSeason(showSlug: string, n: number): Season | null {
  const seasons = getAllSeasons(showSlug)
  return seasons.find((s) => s.number === n) ?? null
}

export function getCanon(showSlug: string): CanonFile | null {
  const c = ensure()
  return c.canons.get(showSlug) ?? null
}

export function getAllThemes(): Theme[] {
  const c = ensure()
  return [...c.themes.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}

export function getTheme(slug: string): Theme | null {
  const c = ensure()
  return c.themes.get(slug) ?? null
}

export function getLegalDoc(slug: LegalSlug): LegalDoc | null {
  const c = ensure()
  return c.legal.get(slug) ?? null
}

export function loadAllContent(): {
  shows: number
  seasons: number
  themes: number
  legal: number
  canons: number
} {
  const c = ensure()
  let seasonCount = 0
  for (const s of c.seasons.values()) seasonCount += s.length
  let canonCount = 0
  for (const k of c.canons.values()) if (k) canonCount += 1
  let legalCount = 0
  for (const l of c.legal.values()) if (l) legalCount += 1
  return {
    shows: c.shows.size,
    seasons: seasonCount,
    themes: c.themes.size,
    legal: legalCount,
    canons: canonCount,
  }
}

export function __resetContentCache(): void {
  cache = null
}
