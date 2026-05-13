import type { Show, Theme } from '@/content'

export function show(overrides: Partial<Show> = {}): Show {
  return {
    slug: 'survivor',
    name: 'Survivor',
    palette: {
      paper: '#0E2A2A',
      ink: '#EFE2BD',
      primary: '#D55E36',
    },
    seasons: 47,
    status: 'airing',
    blurb: '47 seasons. One torch at a time.',
    tagline: 'Survivor tagline.',
    ...overrides,
  }
}

export function theme(overrides: Partial<Theme> = {}): Theme {
  return {
    slug: 'firsts',
    title: 'Firsts that hold up',
    description: 'Season-zeros and resets that earned their reputation.',
    tagline: 'Firsts and resets.',
    category: 'tone',
    sentiment: 'hold',
    status: 'stable',
    curator: 'Pantheon Editors',
    last_revised: '2026-05-01',
    featured: false,
    related: [],
    entries: [
      {
        show: 'survivor',
        season: 1,
        rank: 1,
        title: 'The original.',
        blurb: 'Sixteen Americans on a beach.',
      },
      {
        show: 'survivor',
        season: 41,
        rank: 2,
        title: 'The reboot.',
        blurb: 'The post-pandemic reset.',
      },
    ],
    body_md: '',
    ...overrides,
  }
}
