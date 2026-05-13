# Phase 19c — Show + season pages to spec

> **Context.** 19a removed the SVG art system; 19b shipped the
> chrome and the per-show tinting contract. This phase rebuilds
> the two flagship pages — `/shows/[show]` and
> `/shows/[show]/season/[n]` — against the canonical references:
> `design/Pantheon · Survivor.html` and
> `design/Pantheon · Heroes vs. Villains.html`. Both pages are
> **full-bleed** (no `<Wrap>`), tinted to the show palette,
> with chrome (header + footer) inheriting the tint via the
> segment layout from 19b.

## 1. Show home — `/shows/[show]`

Reference: `design/Pantheon · Survivor.html`.

### 1a. Sections, in order

1. **Hero** (`<ShowHero>`)
2. **Split — Canon / Community** (`<ShowSplit>`)
3. **Shifts this week** (`<ShiftsRow>`) — OPTIONAL section,
   rendered only if there are rank-shift events. Phase 19d's
   `<RankShiftPill>` powers each card. **Stub it for 19c**:
   render the section heading + an empty-state line "No
   shifts this week" + zero cards. (Wiring the actual shift
   computation is deferred — separate phase candidate.)
4. **All seasons, ranked** (`<SeasonGrid>`)

### 1b. `<ShowHero>` — `src/components/composition/ShowHero.tsx`

Replaces the old facade-hero. Two-column grid, 1.4fr / 1fr,
border-bottom in show-ink at 12% opacity.

**Left cover** (`.show-hero-cover`):
- 96px top / 64px x-padding / 80px bottom (mobile 64/24/40)
- Min-height 560px desktop
- Flex column, justify flex-end, gap 28px
- `<Wordmark>` (h1, Source Serif 4 weight 500, 144px desktop /
  96px @1024 / 64px @480, line-height 0.92, letter-spacing
  -0.04em, color `var(--show-ink)`, text-wrap balance, text:
  `{show.name}`)
- `<p class="show-hero-sub">` — serif italic, 24px (18px
  mobile), `var(--show-ink)` at 82% opacity. Content:
  `{show.blurb}`

**Right meta** (`.show-hero-meta`):
- 64px y-padding / 56px x-padding, flex column, justify
  center, gap 32px, bg
  `color-mix(in oklab, var(--show-ink) 4%, var(--show-paper))`
- Crumb: `<span class="show-hero-crumb">` — mono 11px, 0.14em
  letter-spacing, uppercase, color show-ink at 55%, with a
  `<Bullet size={10}>` in show-primary followed by "Pantheons /
  <show.name>"
- Stats strip — flex gap 32px, padding-bottom 8px,
  border-bottom in show-ink at 12%. Each stat is `<span
  class="stat-val">` (serif 500 28px) over `<span
  class="stat-key">` (mono 11px, 0.1em letter-spacing,
  uppercase, show-ink @55%). Two stats:
  - `{show.seasons}` / `seasons aired`
  - `{computeYears(show)}` / `on the air` — derived from the
    season records' year range, NOT from a `first_aired`
    frontmatter field (which was dropped in 19a). If we don't
    have season-level years yet, render `—` for the value.
- Tagline: `<p class="show-hero-line">` — serif 19px (16px
  mobile), show-ink @86%. Content: `{show.tagline}`
- `<ShieldBadge>` (already exists; verify the design class
  `shield` is applied) — text "No spoilers. Every page is
  reviewed before it goes live."

Props:
```ts
type ShowHeroProps = { show: Show };
```

Unit tests:
- renders wordmark with show name
- renders blurb on left, tagline on right (DOM order)
- renders `<Bullet>` in the crumb with show-primary
- renders `seasons` stat with the int value
- renders ShieldBadge

### 1c. `<ShowSplit>` — `src/components/composition/ShowSplit.tsx`

Two-button 50/50 split, full-width.

- Left: "01 · CURATED" / "Editor's Canon" (serif 36px / 26px
  mobile) / "One ranking, written by someone who has seen
  every season twice." / "Read the canon →" — links to
  `/shows/<slug>/canon`
- Right: "02 · LIVE" / "Community Rank" / "Voted weekly by
  readers. Updated as the votes come in." / "See the vote →"
  — links to `/shows/<slug>/community`
- 48px x-padding, 48px y-padding desktop; 32/24 mobile
- Border-right on the left split (show-ink @12%)
- Hover: bg `color-mix(in oklab, var(--show-ink) 6%, transparent)`

Unit test:
- Both links present with the right `href`
- Tag, title, blurb, go-arrow rendered

### 1d. `<SeasonGrid>` — `src/components/composition/SeasonGrid.tsx`

3-up grid (2 @1024, 1 @560), gap 1px, bg show-ink @12%,
border + border-radius 8px, overflow hidden.

`<SeasonCard>` (`src/components/composition/SeasonCard.tsx`):
- 60px / 1fr columns, gap 16px, align start, padding 20px
  24px, bg `var(--show-paper)`
- Rank: mono 500 22px, color `var(--show-primary)`, content
  `#{rank}` with the rank zero-padded to 2 digits
- Title: serif 500 18px, show-ink, letter-spacing -0.01em
- Tag (one-line season descriptor from season frontmatter):
  serif 14px italic, show-ink @70%
- Bottom row (`<div class="season-bottom">`): season-number
  mono 11px uppercase + (optional) `<RankShiftPill>`. For 19c,
  RankShiftPill is stubbed/empty if shift data isn't
  available; do not crash the grid if the field is null.

Props:
```ts
type SeasonGridProps = { seasons: SeasonRow[]; primary: string; };
type SeasonRow = { n: string; title: string; tag: string; rank: number; shift?: { delta: number; sentiment: Sentiment } | null };
```

Unit tests:
- 9 cards rendered for Survivor (or however many seasons are
  in fixtures)
- Rank zero-padding
- Tag from `season.tag` field

### 1e. Filter bar (above the grid)

3 chips: "Canon" (default on), "Community", "By era". For 19c,
the filter is presentational — clicking only updates a local
state that no-ops on the data. Wiring real filtering is a
deferred phase candidate.

Class names per design: `.filter-bar`, `.filter-set`, `.chip`,
`.chip.on`.

## 2. Season page — `/shows/[show]/season/[n]`

Reference: `design/Pantheon · Heroes vs. Villains.html`.

### 2a. Two-column shell

`<SeasonShell>` — grid `1fr 420px` desktop, `1fr` @1024,
min-height `calc(100vh - 64px)`.

### 2b. Article (left, scrolling) — `<SeasonMain>`

Padding 80px / 80px / 96px (desktop) collapsing to 40px / 20px
/ 56px (mobile). Max-width 780px, margin-left auto.

Order:
1. **Crumb** — mono 11px uppercase, with `<Bullet size={9}>`
   show-primary then `Pantheons / <show> / <Season N>`. Each
   crumb component except the leaf is a link.
2. **Eyebrow** — `<div class="season-eyebrow">` mono 11px,
   0.16em letter-spacing, uppercase, color show-primary.
   Content: e.g. "Season 20 · Returnees Showcase" (sourced
   from season frontmatter — new optional `eyebrow` field, see
   §4 below).
3. **H1** — serif 500 80px desktop / 64px @1024 / 44px @560,
   `var(--show-ink)`, text-wrap balance. Content: season
   title.
4. **Rank row** — two `<RankTag>` pills:
   - "Editor's Canon" + `#NN`
   - "Community" + `#NN` + optional `<RankShiftPill>` (delta +
     sentiment). For 19c the community rank may be unavailable
     for an unvoted season — render `—` for the rank, omit the
     pill.
   Plus inline `<ShieldBadge>`.
5. **Body** — `.season-body`:
   - `<p class="season-lede">` — serif 24px (19px mobile),
     show-ink. The opening sentence.
   - one or more `<p>` — serif 18px, show-ink @86%. Body
     paragraphs.
   - optional `<blockquote class="season-pull">` — serif
     italic 24px, left border 3px solid show-primary, padding
     `8px 0 8px 24px`. Reserved for a single pulled line per
     season; renders only if the season frontmatter carries a
     `pull` field.
6. **Details strip** — 4-column grid, key/value pairs from
   season frontmatter. Keys (mono uppercase) / values (serif
   500 18px). Suggested: "Aired" (year range), "Episodes"
   (int), "Cast" (e.g. "20 returnees"), "Location" (one-word
   place name). For 19c, render only keys present in the
   frontmatter; if none, hide the strip.
7. **Vote block** — `<SeasonVoteBlock>`:
   - Title: serif 500 24px (20px mobile) "Does this belong in
     the canon top 10?" (per-season default; allow override
     via `vote_question` frontmatter)
   - Meta: mono 12px "{week_votes} readers voted this week ·
     {lifetime_votes} lifetime" — counts come from the Vote
     API (already wired in phase 11). On no-data, render
     "Be the first to vote · {lifetime_votes} lifetime"
   - `<VotePair>` — design-port from phase 19d
8. **Adjacent seasons** — 2-up grid:
   - Left: `← #{n} Canon` + previous season title
   - Right: `#{n} Canon →` + next season title (text-align
     right)
   - Caption (serif italic 14px) from sibling's `tag` field
   - Hover bg show-ink @5%
9. **Also appears in** — section title (mono 11px uppercase,
   "Also appears in") + a vertical list of `<AppearsInRow>`:
   - `<Bullet size={9}>` + `<span class="name">` + meta (mono
     11px uppercase, e.g. "Editor's Canon · #4")
   - Source: themed-list and canon membership. Read from the
     content loader: for each themed list whose entries
     include this `<show, season>` tuple, render a row linking
     to the themed list; for the show's own canon, render
     "Editor's Canon · #{rank}".
   - Hover bg show-ink @4%

### 2c. Aside (right, sticky on desktop) — `<SeasonAside>`

Padding 80px / 36px / 96px desktop, 32 / 16 / 48 mobile. Bg
`color-mix(in oklab, var(--show-paper) 90%, #000)`. Border-left
show-ink @12% (border-top on mobile, no border-left).

Order:
1. **Aside head** — `<h3>The thread</h3>` (serif 22px) + meta
   "{N} comments" (mono 11px uppercase)
2. **`<CommentInput>`** — design-port from 19d
3. **Comment list** — `<ul class="comment-list">`. Reads
   comments from `/api/comment` (already wired in phase 12).
   Each `<Comment>`:
   - `<span class="comment-author">{handle}</span>` mono 12px
   - `<span class="comment-when">{when}</span>` mono 12px,
     show-ink @50%
   - optional `<span class="comment-hot">★ much-liked</span>`
     when a comment crosses the engagement threshold (mark
     via `comment.hot` boolean; threshold computed
     server-side — for 19c stub with `false` for all)
   - body: serif 15px, show-ink @85%, text-wrap pretty
   - actions: "Reply" / "↑" / "↓" — mono 12px buttons
4. **`<aside-more>`** button — "Show {remaining} more →" — for
   19c renders only if `comments.length > 10` (pagination
   wiring is deferred)

### 2d. Sticky behavior

`<SeasonAside>` is `position: sticky; top: 64px;` on desktop
viewports (>= 1024px) so it tracks scroll while the article
flows. On mobile, sticky disabled (aside lives below the
article).

## 3. Per-show tint delivery

The `[data-show=<slug>]` wrapper from phase 19b's
`src/app/shows/[show]/layout.tsx` already supplies the three
CSS vars. Both `/shows/[show]` and
`/shows/[show]/season/[n]` are children of this layout, so no
additional plumbing needed.

If the segment layout was not centralized in 19b, this phase
centralizes it now and updates `/shows/[show]/canon` and
`/shows/[show]/community` to inherit the same tinted chrome.

## 4. Content schema additions

### 4a. Season frontmatter — `src/content/schemas.ts`

Add optional fields to the season schema:

```ts
export const seasonFrontmatterSchema = z.object({
  show:    z.string(),                        // slug
  n:       z.string(),                        // "01" .. "47"
  title:   z.string(),
  tag:     z.string(),                        // existing — short serif italic descriptor
  rank:    z.number().int().positive().optional(), // canon rank
  // NEW for 19c:
  eyebrow:       z.string().optional(),       // "Returnees Showcase"
  lede:          z.string().min(1).optional(),// opening sentence
  body:          z.string().optional(),       // body markdown
  pull:          z.string().optional(),       // pulled quote
  vote_question: z.string().optional(),       // overrides default
  aired_year:    z.number().int().optional(),
  episodes:      z.number().int().optional(),
  cast_note:     z.string().optional(),       // "20 returnees"
  location:      z.string().optional(),
});
```

Unit test the new optional fields parse cleanly + the schema
rejects an invalid `aired_year` (string).

### 4b. Migrate Survivor seasons that need a richer page

For 19c's verify gate, only Survivor's first 9 seasons (the
ones already in fixtures) need the new fields. **Minimum
required for any season page to look complete**: `title`,
`tag`, `lede`. Body and pull are optional but encouraged.

Use `content-curator` to write the `lede` + 2-3 body
paragraphs per season, spoiler-disciplined. Spawn in parallel
where possible.

The user's design notes call out one specific copy expectation:
> "47 seasons of strangers on a beach. The genre that invented
> itself in episode one, and has spent twenty-five years
> rediscovering what it is. We've ranked every single one"

That line is already housed in the show-level `tagline` (per
19a). It does not need to duplicate into a season `lede`.

## 5. Components — new + updated

New files under `src/components/composition/`:
- `ShowHero.tsx` (replaces phase-4a's facade-hero)
- `ShowSplit.tsx`
- `SeasonGrid.tsx` + `SeasonCard.tsx`
- `SeasonShell.tsx` (the 2-col grid)
- `SeasonMain.tsx`
- `SeasonAside.tsx`
- `SeasonVoteBlock.tsx`
- `RankTag.tsx`
- `AppearsInRow.tsx`
- `AdjacentSeasons.tsx`
- `Comment.tsx` (the design's comment row format)
- `FilterBar.tsx` (the 3-chip filter)

Each in its own folder with a colocated `__tests__/` (per
agents.md §5a). One small file per component — the design has
a lot of pieces and each is a chance to test cleanly.

## 6. OG images — per-show + per-season (clean text, clear color)

Per the user (2026-05-13): every show and every season needs
its own OG image. **Never AI illustration. Clean text +
clear color blocks only.**

### 6a. Per-show OG

Add `src/app/shows/[show]/opengraph-image.tsx` using
Next.js's `ImageResponse`. Composition:

```
┌─────────────────────────────────────────────┐
│ [brand-mark 22]  Pantheon                   │   ← ink color
│                                             │
│                                             │
│   Survivor                                  │   ← serif 72px, ink
│                                             │
│   47 seasons. One torch at a time.          │   ← serif italic 26px, ink @80%
│                                             │
│                                             │
│              ● Pantheons / Survivor         │   ← bullet primary + mono 14px
└─────────────────────────────────────────────┘
   bg = show.palette.paper      size = 1200×630
```

- Resolves `show.palette.paper / ink / primary` server-side
  via the content loader at request time (or static via
  Next's ImageResponse-on-build path).
- Uses ONLY the shared brand mark + text + one bullet. No
  facade. No per-show glyph.
- Falls back gracefully if fonts can't load — uses system
  serif. (Inter Cyrillic + Source Serif Cyrillic chunks are
  embedded via the satori font option.)

The `<ImageResponse>` route file can be hand-authored OR
generated via `brander` with:

```json
{
  "kind": "og",
  "target": "src/app/shows/[show]/opengraph-image.tsx",
  "source": null,
  "title": "{{show.name}}",
  "subtitle": "{{show.blurb}}",
  "tokens": "design/tokens.json",
  "show_palette": "<resolved at render time, not hardcoded>",
  "fonts": ["Source Serif 4", "Inter", "JetBrains Mono"]
}
```

(The `{{show.name}}` placeholders signal that the route reads
from `params` at render time — the brander writes a template
that does this look-up, not a static card.)

### 6b. Per-season OG

Add `src/app/shows/[show]/season/[n]/opengraph-image.tsx`.
Composition:

```
┌─────────────────────────────────────────────┐
│ [brand-mark 22]  Pantheon                   │
│                                             │
│ ● Pantheons / Survivor / Season 20          │   ← mono 14px crumb, primary bullet
│                                             │
│                                             │
│   Heroes vs. Villains                       │   ← serif 64px, show-ink
│                                             │
│   Editor's Canon · #07                      │   ← mono 16px, show-primary
│                                             │
└─────────────────────────────────────────────┘
   bg = show.palette.paper      size = 1200×630
```

Resolves `{ show, season }` via the loader. Brand mark
top-left, season title big serif, rank pill bottom. No
illustration of any kind.

### 6c. e2e for OG images

Add `apps/e2e/tests/og-images.spec.ts`:
- For each show: GET `/shows/{slug}/opengraph-image` and
  assert: status 200, content-type `image/png` (or whatever
  Next chooses), content-length > 1KB and < 1MB, the response
  has cache headers.
- For each season fixture: same.
- Also walk the rendered HTML and assert the meta tag
  `<meta property="og:image">` points at the route's
  opengraph-image endpoint.

### 6d. Hard rule for the loop

Any future `/iterate` finding that proposes adding
illustration to an OG card is **rejected by precedent**.
Audit row should be marked `[x] superseded by 19c OG rules`.
Add this note to `plan/bearings.md` "AI usage map" under the
OG row.

## 7. e2e

Update `apps/e2e/tests/show-home.spec.ts`:
- Page is full-bleed (no `.wrap` parent on `<main>`)
- Hero renders the wordmark + blurb left, tagline + stats
  right
- Bullet present in the crumb
- Split has both Canon / Community links with the correct
  `href`
- Season grid contains 9 cards for Survivor

Update `apps/e2e/tests/season-page.spec.ts`:
- Full-bleed
- Crumb with bullet
- Eyebrow, h1, rank-row pills, shield badge
- Body lede + paragraphs render
- Vote block with VotePair (test id from 19d)
- Adjacent seasons with prev/next links
- "Also appears in" row group if the season has memberships
- Aside thread with CommentInput + comment list
- Aside is sticky on desktop (assert `position: sticky` via
  computed style) — skip on mobile

Update `apps/e2e/src/fixtures/page-reads.ts` accordingly.

## 8. Verify + commit + push

```
pnpm verify
git add -A
git commit -m "feat: phase 19c — show + season pages to spec"
git push origin main
pnpm deploy:check
```

Tick `[x]` for 19c.

## 9. Decisions log

Document in commit body:
- Stub strategies for shifts row, filter chips, community rank
  pre-vote — keeping the visual surface complete while data
  layer catches up
- The `aired_year` / `episodes` / `cast_note` / `location`
  fields are optional; details strip hides when none are
  present
- "Also appears in" reads from the existing themed-list +
  canon content loaders; no new tables
