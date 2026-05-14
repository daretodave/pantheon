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
import type {
  CanonFile,
  LegalDoc,
  Season,
  Show,
  Theme,
  ThemeCategory,
} from './schemas'

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

// 31a: filename-as-slug. Every season file matches `NN-<slug>.md`
// (e.g. `04-marquesas.md`, `20-heroes-villains.md`). The captured
// suffix becomes `season.slug`; an explicit frontmatter `slug:`
// override beats the derivation, but the override is rare —
// reserved for cases where renaming the file would be awkward
// (e.g. legacy URLs already in the wild).
const SEASON_FILENAME_RE = /^(\d+)-(.+)\.md$/

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
    const match = entry.name.match(SEASON_FILENAME_RE)
    if (!match) {
      throw new Error(
        `season filename "${entry.name}" must match NN-<slug>.md (file ${file})`,
      )
    }
    const derivedSlug = match[2] ?? ''
    const season = parseSeasonFile(readMd(file), file, derivedSlug)
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

export function getSeasonBySlug(
  showSlug: string,
  seasonSlug: string,
): Season | null {
  const seasons = getAllSeasons(showSlug)
  return seasons.find((s) => s.slug === seasonSlug) ?? null
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

export function getFeaturedThemes(limit = 3): Theme[] {
  return getAllThemes()
    .filter((t) => t.featured)
    .slice(0, limit)
}

const THEME_CATEGORIES: ThemeCategory[] = ['tone', 'craft', 'era', 'single']

export function getThemesByCategory(): Record<ThemeCategory, Theme[]> {
  const out: Record<ThemeCategory, Theme[]> = {
    tone: [],
    craft: [],
    era: [],
    single: [],
  }
  for (const theme of getAllThemes()) {
    out[theme.category].push(theme)
  }
  for (const cat of THEME_CATEGORIES) {
    out[cat].sort((a, b) => b.last_revised.localeCompare(a.last_revised))
  }
  return out
}

export function getShowsForTheme(theme: Theme): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of theme.entries) {
    if (seen.has(entry.show)) continue
    seen.add(entry.show)
    out.push(entry.show)
  }
  return out
}

export function getRelatedThemes(theme: Theme, limit = 2): Theme[] {
  const out: Theme[] = []
  for (const slug of theme.related) {
    const t = getTheme(slug)
    if (!t) continue
    if (t.slug === theme.slug) continue
    out.push(t)
    if (out.length >= limit) break
  }
  return out
}

export type ThemeStats = {
  total: number
  totalEntries: number
  showsCovered: number
  lastIndexRevision: string
}

export function getThemeStats(): ThemeStats {
  const themes = getAllThemes()
  const shows = new Set<string>()
  let totalEntries = 0
  let lastIndexRevision = ''
  for (const t of themes) {
    totalEntries += t.entries.length
    for (const e of t.entries) shows.add(e.show)
    if (t.last_revised > lastIndexRevision) lastIndexRevision = t.last_revised
  }
  return {
    total: themes.length,
    totalEntries,
    showsCovered: shows.size,
    lastIndexRevision,
  }
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
