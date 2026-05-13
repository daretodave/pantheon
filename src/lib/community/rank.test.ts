import { describe, expect, it } from 'vitest'
import type { CanonFile, Season, Show } from '@/content'
import { computeCommunityRank, sourceBannerCopy } from './rank'

function fakeShow(slug: string): Show {
  return {
    slug,
    name: slug,
    palette: { primary: '#000000', ink: '#ffffff', paper: '#111111' },
    seasons: 0,
    status: 'airing',
    blurb: 'blurb',
    tagline: 'tagline',
  }
}

function fakeSeason(number: number, opts: Partial<Season> = {}): Season {
  return {
    show: 'survivor',
    number,
    title: `Season ${number}`,
    premiere_date: opts.premiere_date,
    format_changes: [],
    blurb_md: 'a'.repeat(60) + ' word '.repeat(55),
    ...opts,
  } as Season
}

describe('computeCommunityRank', () => {
  it('returns empty entries + seasons source when no seasons', () => {
    const result = computeCommunityRank(fakeShow('x'), [], null)
    expect(result.entries).toEqual([])
    expect(result.source).toBe('seasons')
  })

  it('mirrors canon order when canon exists, appending uncanoned seasons by number', () => {
    const seasons = [fakeSeason(1), fakeSeason(20), fakeSeason(28), fakeSeason(45)]
    const canon: CanonFile = {
      show: 'survivor',
      entries: [
        { rank: 1, season: 28, title: 'Cagayan', rationale: 'r'.repeat(500) },
        { rank: 2, season: 1, title: 'Borneo', rationale: 'r'.repeat(500) },
      ],
    }
    const result = computeCommunityRank(fakeShow('survivor'), seasons, canon)
    expect(result.source).toBe('canon')
    expect(result.entries.map((e) => e.season.number)).toEqual([28, 1, 20, 45])
    expect(result.entries.map((e) => e.rank)).toEqual([1, 2, 3, 4])
  })

  it('falls back to season-number order when canon is null', () => {
    const seasons = [fakeSeason(7), fakeSeason(1), fakeSeason(3)]
    const result = computeCommunityRank(fakeShow('x'), seasons, null)
    expect(result.source).toBe('seasons')
    expect(result.entries.map((e) => e.season.number)).toEqual([1, 3, 7])
    expect(result.entries.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('falls back to season-number order when canon entries are empty', () => {
    const seasons = [fakeSeason(2), fakeSeason(1)]
    const result = computeCommunityRank(fakeShow('x'), seasons, {
      show: 'x',
      entries: [],
    } as CanonFile)
    expect(result.source).toBe('seasons')
    expect(result.entries.map((e) => e.season.number)).toEqual([1, 2])
  })

  it("skips canon entries whose season isn't in the seasons list (the hole case)", () => {
    const seasons = [fakeSeason(1), fakeSeason(2)]
    const canon: CanonFile = {
      show: 's',
      entries: [
        { rank: 1, season: 99, title: 'Ghost', rationale: 'r'.repeat(500) },
        { rank: 2, season: 1, title: 'One', rationale: 'r'.repeat(500) },
      ],
    }
    const result = computeCommunityRank(fakeShow('s'), seasons, canon)
    expect(result.entries.map((e) => e.season.number)).toEqual([1, 2])
    expect(result.source).toBe('canon')
  })

  it('uses premiere_date year as the tag when available', () => {
    const result = computeCommunityRank(
      fakeShow('x'),
      [fakeSeason(1, { premiere_date: '2009-02-02' })],
      null,
    )
    expect(result.entries[0]?.tag).toBe('2009')
  })

  it('falls back to a season-and-show label when premiere_date is missing', () => {
    const result = computeCommunityRank(fakeShow('x'), [fakeSeason(1)], null)
    expect(result.entries[0]?.tag).toBe('Season 1 · x')
  })
})

describe('sourceBannerCopy', () => {
  it('returns canon-mirror copy for the canon source', () => {
    expect(sourceBannerCopy('canon')).toMatch(/mirrors the editor's canon/i)
  })
  it('returns air-order copy for the seasons source', () => {
    expect(sourceBannerCopy('seasons')).toMatch(/air order/i)
  })
  it('returns votes-flowing copy for the votes source', () => {
    expect(sourceBannerCopy('votes')).toMatch(/as the votes come in/i)
  })
})
