# Phase 7 — Editor's Canon page

> **The canonical canon page.** Every later show's
> `/shows/[show]/canon` mirrors this one. The page renders the
> ranked editorial list with rich spoiler-safe rationales (80–120
> words each, schema-enforced), under the per-show palette swap
> established in phase 6.
>
> **Layout source of truth:** phase 4a's composition primitives
> (`<ShowHero>` for the page head, `<ShieldBadge>` for the
> spoiler-promise pill). New primitives `<CanonList>` and
> `<CanonEntry>` ship in `src/components/composition/` with
> matching screens.css selectors `.canon-page`, `.canon-list`,
> `.canon-entry`, `.canon-rank`, `.canon-rationale`.

## Goal

`/shows/[show]/canon` ships as a fully composed page that:
- Wraps the show palette via `<PaletteScope show={slug}>` so the
  canon page carries the same magical color treatment as the
  show home.
- Heads with a `<ShowHero>` showing the crumb (Pantheons / Show /
  Editor's Canon), the H1 "Editor's Canon", a one-line lede, and
  a `<ShieldBadge>`. The hero art slot carries the show's
  `<Sigil>` (cropped facade pediment + center column) instead of
  the full facade, so the canon page reads as a more focused
  sub-surface.
- Renders the ranked list via `<CanonList>` of `<CanonEntry>`s.
  Each entry: mono rank label (`#01`, `#02`, …), serif title,
  mono season-number subtag, a full 80–120-word rationale below.
  The entry is a link that points at `/shows/[show]/season/[n]`
  so the user can dive into the season page from any canon row.
- Emits a CollectionPage-style ItemList JSON-LD enumerating
  every canon row (rank, name, url, description = rationale
  first 200 chars), plus a BreadcrumbList JSON-LD.
- Falls back to the empty-state copy template when the show's
  `canon.md` hasn't been written yet (covers top-chef + dragrace
  until phases 20–22 ship their canons).

## URL pattern

`/shows/[show]/canon`

## Outputs

```
src/app/shows/[show]/canon/
├── page.tsx                              # rewrite: PaletteScope + primitives + JSON-LD
└── __tests__/                            # (no colocated test today; primitive tests cover the components)

src/components/composition/
├── CanonList.tsx                         # <ol class=canon-list>
├── CanonEntry.tsx                        # <li class=canon-entry> with rank + title + season # + rationale
├── __tests__/
│   ├── CanonList.test.tsx
│   └── CanonEntry.test.tsx
└── index.ts                              # extend exports

src/styles/screens.css                    # add .canon-page / .canon-head / .canon-list / .canon-entry / .canon-rank / .canon-rationale rules

apps/e2e/tests/canon-page.spec.ts         # walks every seeded show's /canon page; asserts palette swap, ItemList JSON-LD count matches canon entries
```

## Decisions made upfront — DO NOT ASK

- **Palette swap continues into canon.** Bearings is explicit:
  show home + canon + community + season pages all take on the
  per-show palette. So `<PaletteScope show={slug}>` wraps the
  full canon page body.
- **Hero art is the sigil, not the full facade.** The show home
  is the place to showcase the full facade. Inside the show
  surface, sub-pages get the cropped sigil — same vocabulary,
  smaller footprint, more screen real estate for the editorial
  copy.
- **`<CanonList>` is an ordered list** (`<ol>`), `<CanonEntry>`
  is an `<li>`. Semantics matter for the ranked content.
- **Each `<CanonEntry>` is its own link** to the season page —
  the rank, title, and season subtag are inside the anchor; the
  rationale paragraph stays as a sibling block of the anchor (not
  inside it) so users can select-and-copy the rationale text
  without navigating away. The hover state lifts the whole row
  (anchor + rationale visually grouped via list-item background).
- **Empty state:** when `getCanon(slug)` returns null OR the
  canon has zero entries, render the empty-state copy template
  via a `<p data-testid="canon-list" data-empty="true">` and
  emit an ItemList JSON-LD with a single placeholder item (the
  show home) so the smoke walker's `expectJsonLdType: 'ItemList'`
  check still passes. Same pattern phase 6 uses for empty
  season grids.
- **Rationale word-count is schema-enforced** (80–120 words via
  Zod refine in `seasonsSchema.ts`). No truncation needed in
  the UI — render the full rationale.
- **Description for JSON-LD ItemList items:** rationale truncated
  at 200 chars. Keeps JSON-LD compact for crawlers without
  losing the editorial voice.
- **`<CanonEntry>` accepts a `season` prop** (the season number),
  not the raw season object — keeps the primitive decoupled from
  the season schema and lets canon-only data drive it.
- **No `canonical_position` cross-reference on canon entries.**
  The canon.md file IS the canonical position list; surfacing it
  on the canon page would be tautological.

## Out of scope

- Community Rank page (phase 8).
- Per-season page composition (phase 9).
- Editorial content writing — `canon.md` rationales for
  top-chef + dragrace land in phases 20–22 via `/ship-content`.
  The canon page renders the empty state for them until then.
- Re-rank animations or rank-shift pills on the canon page.
  Canon is editorial and stable; rank shifts are a community-vote
  feature surfaced on `/community`.

## Failure modes — when to stop

1. CanonEntry's anchor + rationale layout creates a focus / a11y
   bug → switch to "everything inside the anchor" pattern and
   accept the select-and-copy regression.
2. `<ol>`/`<li>` semantics conflict with screens.css selectors
   that assumed `<div>` — extend the selectors to cover both.
3. Empty ItemList JSON-LD trips the smoke walker — keep the
   placeholder-item shim per the decision above.
