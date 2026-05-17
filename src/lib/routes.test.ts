import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setContentRoot, __resetContentCache } from '@/content'
import { getAllRoutes, getFeedPaths, getSitemapRoutes } from './routes'

const FIXTURE_ROOT = path.resolve(__dirname, '../../content')

beforeAll(() => {
  setContentRoot(FIXTURE_ROOT)
  __resetContentCache()
})

afterAll(() => {
  setContentRoot(null)
  __resetContentCache()
})

describe('getAllRoutes', () => {
  it('always includes the locked static URL contract', () => {
    const routes = getAllRoutes()
    const patterns = new Set(routes.map((r) => r.pattern))
    for (const expected of [
      '/',
      '/shows',
      '/themes',
      '/about',
      '/terms',
      '/privacy',
      '/sign-in',
      '/mod',
    ]) {
      expect(patterns.has(expected)).toBe(true)
    }
  })

  it('expands show families from loaders', () => {
    const routes = getAllRoutes()
    const survivor = routes.filter((r) => r.show === 'survivor')
    const patterns = survivor.map((r) => r.pattern).sort()
    expect(patterns).toContain('/shows/[show]')
    expect(patterns).toContain('/shows/[show]/season/[slug]')
  })

  it('does not emit the consolidated canon/community routes (phase 33)', () => {
    const patterns = new Set(getAllRoutes().map((r) => r.pattern))
    expect(patterns.has('/shows/[show]/canon')).toBe(false)
    expect(patterns.has('/shows/[show]/community')).toBe(false)
  })

  it('includes a slug-form season path for each seeded season', () => {
    const routes = getAllRoutes()
    const seasonPaths = routes
      .filter((r) => r.pattern === '/shows/[show]/season/[slug]')
      .map((r) => r.path)
    expect(seasonPaths).toContain('/shows/survivor/season/borneo')
    expect(seasonPaths).toContain('/shows/survivor/season/heroes-villains')
  })

  it('does not emit numeric-form season paths', () => {
    const routes = getAllRoutes()
    const numericMatch = routes.some((r) =>
      /\/shows\/[a-z-]+\/season\/\d+$/.test(r.path),
    )
    expect(numericMatch).toBe(false)
  })
})

// Exhaustive router ↔ content parity. This is the load-bearing
// "every URL is wired, nothing 404s" guarantee — moved OFF the e2e
// browser hot path (which now samples archetypes, not the catalog)
// and onto a pure filesystem comparison that runs in milliseconds
// and stays flat as the catalog grows to hundreds of shows. It is
// strictly stronger than the old crawl: a crawl only visited URLs
// the fixture generated, whereas this catches any divergence
// between the router's expansion and what content/ actually holds.
describe('route ↔ content parity (exhaustive, content-volume-independent)', () => {
  function mdSlugs(dir: string): string[] {
    if (!existsSync(dir)) return []
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name.replace(/\.md$/, ''))
  }

  it('getAllRoutes() expands exactly the show/season/theme set on disk', () => {
    const showsDir = path.resolve(FIXTURE_ROOT, 'shows')
    const themesDir = path.resolve(FIXTURE_ROOT, 'themes')

    const expected = new Set<string>()
    for (const show of mdSlugs(showsDir)) {
      expected.add(`/shows/${show}`)
      const seasonsDir = path.resolve(showsDir, show, 'seasons')
      for (const file of mdSlugs(seasonsDir)) {
        const m = file.match(/^\d+-(.+)$/)
        if (m) expected.add(`/shows/${show}/season/${m[1]}`)
      }
    }
    for (const theme of mdSlugs(themesDir)) expected.add(`/themes/${theme}`)

    const actual = new Set(
      getAllRoutes()
        .filter((r) =>
          r.pattern === '/shows/[show]' ||
          r.pattern === '/shows/[show]/season/[slug]' ||
          r.pattern === '/themes/[theme]',
        )
        .map((r) => r.path),
    )

    // Symmetric: a URL the router emits but content lacks (or vice
    // versa) is a broken page or a missing sitemap entry. Report the
    // diff explicitly so a failure names the offending slug.
    const missingFromRouter = [...expected].filter((p) => !actual.has(p))
    const extraInRouter = [...actual].filter((p) => !expected.has(p))
    expect({ missingFromRouter, extraInRouter }).toEqual({
      missingFromRouter: [],
      extraInRouter: [],
    })
  })
})

describe('getSitemapRoutes', () => {
  it('excludes /sign-in, /mod, and /u/[handle]', () => {
    const patterns = new Set(getSitemapRoutes().map((r) => r.pattern))
    expect(patterns.has('/sign-in')).toBe(false)
    expect(patterns.has('/mod')).toBe(false)
    expect(patterns.has('/u/[handle]')).toBe(false)
  })

  it('still includes public surface (/, /shows, /about, ...)', () => {
    const patterns = new Set(getSitemapRoutes().map((r) => r.pattern))
    expect(patterns.has('/')).toBe(true)
    expect(patterns.has('/shows')).toBe(true)
    expect(patterns.has('/about')).toBe(true)
  })
})

describe('getFeedPaths', () => {
  it('leads with the global feed then one .xml per show', () => {
    const paths = getFeedPaths()
    expect(paths[0]).toBe('/feed.xml')
    const showPaths = paths.slice(1)
    expect(showPaths.length).toBe(getAllRoutes().filter((r) => r.pattern === '/shows/[show]').length)
    for (const p of showPaths) {
      expect(p).toMatch(/^\/feed\/[a-z0-9-]+\.xml$/)
    }
    expect(paths).toContain('/feed/survivor.xml')
  })
})
