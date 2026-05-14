import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setContentRoot, __resetContentCache } from '@/content'
import { getAllRoutes, getSitemapRoutes } from './routes'

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
    expect(patterns).toContain('/shows/[show]/canon')
    expect(patterns).toContain('/shows/[show]/community')
    expect(patterns).toContain('/shows/[show]/season/[slug]')
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
