# Phase 6 — Show home page (canonical sibling)

> **The canonical sibling for show families.** Every later
> show home page (Top Chef, RuPaul's Drag Race, Bachelor, etc.)
> mirrors this one's structure exactly. Time spent here amortizes
> across every show in the launch quota and beyond. **Spend
> the time.**

## Goal

`/shows/[show]` ships as a fully composed page that:
- Renders the show's full `facade.svg` as the hero (1200×800
  viewBox responsive to viewport width).
- Takes over the page chrome with the show's three-color palette
  (CSS custom properties scoped to a `[data-show=<slug>]`
  wrapper). Site chrome (Wordmark + global nav) stays in
  Pantheon's ceremonial gold; only the page body shifts hue.
  **This is the magical reveal moment** the project lives or
  dies on — when a user clicks into a show, the entire page
  body picks up that show's palette in a single 240ms transition.
- Surfaces the show's one-line tagline below the facade.
- Splits into two prominent CTAs: **Editor's Canon** /
  **Community Rank**, sized as primary buttons (~48px tall)
  with the show's primary color, hover state lifts via a
  single 1px shadow opacity bump (per the shadow contract).
- Shows the season grid below — every season as a card with
  rank + title + brief tag (year, location, format note) +
  the per-show ornament SVG.
- Carries the spoiler-shield pill ("no spoilers") in the
  hero corner.
- Ships with full e2e + unit test coverage for the palette
  swap math, the season grid layout, and the JSON-LD shape.

## URL pattern

`/shows/[show]` — for `show ∈ getAllShowSlugs()`.

## Outputs

```
src/app/shows/[show]/
├── page.tsx                              # the route — server component
├── ShowHomeShell.tsx                     # client wrapper for palette swap
├── ShowFacade.tsx                        # renders facade.svg responsively
├── RankSplit.tsx                         # the two-button CTA (Canon / Community)
├── SeasonGrid.tsx
├── SeasonCard.tsx
├── ShieldPill.tsx
└── __tests__/
    ├── ShowFacade.test.tsx
    ├── RankSplit.test.tsx
    ├── SeasonGrid.test.tsx
    ├── SeasonCard.test.tsx
    └── ShieldPill.test.tsx

src/lib/palette.ts                        # injectShowPalette(palette) → CSS-var record
src/lib/palette.test.ts                   # round-trip + edge cases (missing palette, partial palette)

apps/e2e/tests/show-home.spec.ts          # walks every seeded show, asserts palette swap visible
apps/e2e/src/fixtures/page-reads.ts       # extend the /shows/[show] entry — facade visible, season-grid visible, palette CSS var present
```

## Detailed steps

### 1. Server component shell

`src/app/shows/[show]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getShowBySlug } from '@/content/loaders'
import { ShowHomeShell } from './ShowHomeShell'
import { buildMetadata, buildJsonLd, canonicalUrl } from '@/lib/seo'

type Params = { show: string }

export async function generateStaticParams() {
  const { getAllShowSlugs } = await import('@/content/loaders')
  return getAllShowSlugs().map(show => ({ show }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { show: slug } = await params
  const show = getShowBySlug(slug)
  if (!show) return { title: 'Not found' }
  return buildMetadata({
    title: `${show.name} — ranked seasons (no spoilers)`,
    description: `Editor's Canon and Community Rank for every ${show.name} season. Spoiler-free.`,
    path: `/shows/${slug}`,
  })
}

export default async function ShowHomePage({ params }: { params: Promise<Params> }) {
  const { show: slug } = await params
  const show = getShowBySlug(slug)
  if (!show) notFound()

  const jsonLd = buildJsonLd('CollectionPage', {
    name: show.name,
    url: canonicalUrl(`/shows/${slug}`),
    hasPart: show.seasons.map(s => ({
      '@type': 'CreativeWork',
      name: `${show.name} ${s.number}`,
      url: canonicalUrl(`/shows/${slug}/season/${s.number}`),
    })),
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ShowHomeShell show={show} />
    </>
  )
}
```

### 2. Client wrapper for palette swap

`ShowHomeShell.tsx` is a `'use client'` component that wraps
its children in `<div data-show={show.slug} style={paletteVars}>`.
The CSS-var injection happens server-side via `style={...}`
so the FIRST PAINT carries the palette — no flicker.

```tsx
'use client'
import { injectShowPalette } from '@/lib/palette'
import { ShowFacade } from './ShowFacade'
import { RankSplit } from './RankSplit'
import { SeasonGrid } from './SeasonGrid'
import { ShieldPill } from './ShieldPill'

export function ShowHomeShell({ show }: { show: Show }) {
  const paletteVars = injectShowPalette(show.palette)
  return (
    <main data-show={show.slug} style={paletteVars} className="show-home">
      <header className="show-hero">
        <ShieldPill />
        <ShowFacade show={show} />
        <h1>{show.name}</h1>
        <p className="show-tagline">{show.tagline}</p>
        <RankSplit show={show} />
      </header>
      <section className="season-grid-section">
        <h2>Every season</h2>
        <SeasonGrid show={show} />
      </section>
    </main>
  )
}
```

### 3. The palette helper

`src/lib/palette.ts`:

```ts
import type { CSSProperties } from 'react'

export type ShowPalette = {
  primary: string
  ink: string
  paper: string
}

/**
 * Returns CSS custom properties scoped to the page wrapper
 * that override Pantheon's defaults for the show's chrome.
 * Render with: <div style={injectShowPalette(show.palette)}>
 */
export function injectShowPalette(palette: ShowPalette): CSSProperties {
  return {
    ['--color-primary-base' as string]: palette.primary,
    ['--color-ink-1' as string]:        palette.ink,
    ['--color-paper-0' as string]:      palette.paper,
  }
}
```

Unit test covers: complete palette returns 3 vars, partial
palette returns only present keys, no palette returns empty
object.

### 4. ShowFacade renders the SVG responsively

`ShowFacade.tsx` reads `public/shows/<slug>/facade.svg` at
build time and inlines it (so the SVG can pick up CSS vars
via `currentColor` etc.). Sized via `aspect-ratio: 1200/800`,
max-width clamped to the layout column.

### 5. RankSplit — the canon/community CTA pair

Two large buttons, side-by-side desktop, stacked mobile.
Tailwind classes use the show's primary color via the CSS
var: `bg-primary text-paper`. Hover lifts via shadow opacity.

### 6. SeasonGrid + SeasonCard

Grid via Tailwind `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
Each card carries: `<rank>` (mono), `<title>`, `<year>`,
`<format-note>`, the show's ornament SVG as a watermark in
the corner.

### 7. ShieldPill

Small pill: shield icon + "no spoilers" text. Top-right of
the hero. The SAME component is reused on every spoiler-safe
page — exported from `src/components/chrome/ShieldPill.tsx`
and re-imported here. Single source of truth for the promise
reinforcement.

### 8. e2e coverage

`apps/e2e/tests/show-home.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

const showHomeUrls = canonicalUrls.filter(u => u.pattern === '/shows/[show]')

for (const url of showHomeUrls) {
  test(`show home renders + palette swap: ${url.path}`, async ({ page }) => {
    await page.goto(url.path)

    // Facade rendered
    await expect(page.getByTestId('facade')).toBeVisible()

    // Palette swap took effect — primary CSS var is set on the wrapper
    const primary = await page.locator('[data-show]').first().evaluate(el =>
      getComputedStyle(el).getPropertyValue('--color-primary-base').trim()
    )
    expect(primary).toMatch(/^#[0-9a-f]{6}$/i)

    // Two CTAs visible
    await expect(page.getByRole('link', { name: /Editor['']s Canon/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Community Rank/i })).toBeVisible()

    // Season grid populated
    const cards = page.getByTestId('season-card')
    await expect(cards).not.toHaveCount(0)

    // Spoiler shield present
    await expect(page.getByTestId('shield-pill')).toBeVisible()
  })
}
```

### 9. Update fixtures

Extend `apps/e2e/src/fixtures/page-reads.ts`:

```ts
'/shows/[show]': {
  expectVisible: ['[data-testid=facade]', '[data-testid=season-grid]', '[data-testid=shield-pill]'],
  expectJsonLdType: 'CollectionPage',
},
```

### 10. Verify + commit + push

`pnpm verify` → green. Commit with message:

```
phase 6: show home page (canonical sibling)

- /shows/[show] route ships full facade hero + season grid
- Per-show palette swap via injectShowPalette → CSS custom
  properties scoped to [data-show=<slug>]. The magical reveal.
- Canon/Community CTA split with the show's primary color.
- Shield pill in hero corner reinforcing the promise.
- generateStaticParams + ISR for all seeded shows.
- CollectionPage JSON-LD with hasPart enumerating seasons.
- e2e walks all seeded show URLs, asserts palette CSS var
  present on the wrapper.
- Unit tests for palette helper, ShowFacade, RankSplit,
  SeasonGrid, SeasonCard, ShieldPill.

Phase 6 of build plan ticked. Canonical sibling for show
families established — phases 7+ mirror this structure.
```

## Decisions made upfront — DO NOT ASK

- **Palette swap timing:** server-rendered via `style={...}`
  — no flicker on first paint, no client-side hydration
  flash.
- **Facade rendering:** inlined SVG (not `<img>`) so motifs
  can use `currentColor` and pick up the palette automatically.
- **Season card order:** by season number ascending (1, 2,
  3, …). Reverse-chronological is wrong for shows where
  early seasons are canonical.
- **Empty seasons array:** show home renders an empty grid
  with the standard empty-state copy template ("Seasons
  haven't been added yet — this page populates as the loop
  ships them.").
- **Shield pill placement:** top-right hero corner, sticky
  desktop, inline mobile.
- **Tagline source:** `show.tagline` field (string, frontmatter).
  If absent, fall back to `${show.network} • ${show.format}`.
- **Page font:** body text in Source Serif 4 here (editorial
  voice). Site chrome stays in Inter via the layout default.
- **Mobile breakpoint:** Tailwind `md:` (768px). Below, the
  CTA pair stacks vertically.
- **Ornament watermark on cards:** opacity-15, top-right
  corner, doesn't compete with rank.

## Failure modes — when to stop

1. Palette CSS var doesn't render → check `injectShowPalette`
   output shape; CSS Properties keys must be string literals.
2. Facade SVG fails to inline → check `next.config.mjs` SVG
   loader (likely `@svgr/webpack` needed). Phase 1 should
   have configured this; if not, file an audit row +
   workaround with `<img>` + `next/image`.
3. ISR cache poisoning between shows → ensure `params` is
   the only key dependency and `generateStaticParams` enumerates
   correctly.
4. Per-show palette bleeds into site chrome → `data-show`
   wrapper isn't scoping properly; verify the chrome (`<header>`,
   `<footer>`) renders OUTSIDE the `<main data-show>` element.
   This is layout-level; phase 1's `layout.tsx` controls it.
