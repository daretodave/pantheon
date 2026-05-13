# Phase 19e — Homepage to spec

> **Context.** With chrome (19b), pages (19c), and primitives
> (19d) all aligned to the new design, the homepage rebuilds
> last. Spec: the `HomeScreen` component in
> `design/compositions/screens.jsx` lines 49–143 plus the
> matching CSS in `screens.css`. The home is one of the
> bounded routes (max-width 1240px via `<Wrap>`), but its hero
> uses the full bounded width (the show cover bleeds to the
> Wrap edge).

## 1. Page structure

`src/app/page.tsx` returns:

```
<Wrap>
  <HomeHero />
  <HomeShowsSection />
  <HomeListsSection />
</Wrap>
```

(Header + Footer come from the route-group layout in 19b.)

## 2. `<HomeHero>` — `src/components/home/HomeHero.tsx`

Two-column grid, 1fr / 1fr, min-height 520px. Single column on
mobile. Border-bottom in `var(--line-soft)`.

### Left cover (`.home-hero-cover`)

Featured show — for v1 this is **Survivor** (the cover reads
the show's palette + name + blurb). Selection logic: a
hardcoded `FEATURED_SHOW_SLUG = 'survivor'` constant lives in
`src/content/featured.ts` so a future phase can rotate it.

Styling:
- `style={{ background: show.palette.paper, color: show.palette.ink }}`
- Padding 64px 48px desktop, 40px 16px mobile
- Flex column, justify space-between, gap 32px
- Border-right `var(--line-soft)` (border-bottom on mobile)

Content (in order):
1. **Tag** — `.cover-tag` mono 11px uppercase, opacity 0.65 —
   "Currently featured"
2. **Wordmark** — `.cover-name` serif 500 96px (56px mobile),
   line-height 0.92, letter-spacing -0.035em — `{show.name}`
3. **Sub** — `.cover-sub` serif italic 22px (17px mobile),
   opacity 0.85, text-wrap pretty — `{show.blurb}` (the blurb
   may have a `\n` — render as `<br/>`)
4. **Go pill** — `.cover-go` — mono 12px uppercase pill, 1px
   border in currentColor, padding `12px 18px`, opacity 0.9
   hover 1. Content: `<Bullet size={10} color={show.palette.primary} />` + `go to {show.name}` + `→`. `href="/shows/{slug}"`

### Right copy (`.home-hero-copy`)

Padding 64px 48px desktop, 32px 16px mobile. Bg `var(--paper-0)`.

Content (in order):
1. **Eyebrow** — `.home-hero-eyebrow` mono 11px uppercase,
   letter-spacing 0.16em, ink-3 — "Pantheon · est. 2026".
   `::before` pseudo gives a 24px x 1px rule before the text.
2. **Title** — `.home-hero-title` serif 500 56px (36px
   mobile), line-height 1.04, letter-spacing -0.02em,
   text-wrap balance. Content:
   `The seasons,<br/>ranked. <em>no spoilers.</em>` (the em is
   primary-gold)
3. **Blurb** — `.home-hero-blurb` serif 18px (15px mobile),
   line-height 1.55, ink-2, max-width 440px:
   > "Two rankings for every show. One written by an editor
   > with the whole series in their head, one voted by the
   > people who lived through it."
4. **Actions** — `.home-hero-actions` flex gap 12px:
   - **Primary** `<Link href="/shows">Browse all shows</Link>`
     — filled pill, ink-0 bg, paper-0 text
   - **Ghost** `<Link href="/about">How it works</Link>` —
     transparent, 1px border in line, ink-1 text

## 3. `<HomeShowsSection>` — `src/components/home/HomeShowsSection.tsx`

The "Pantheons" grid.

### Section head

`.section-head` — flex row, baseline, justify space-between,
margin `64px 32px 24px` (40 16 16 mobile):
- Left: `<h2>Pantheons</h2>` serif 500 26px (20px mobile), ink-0
- Right: `<Link href="/shows" class="section-link">All shows →</Link>` — mono 500 12px uppercase, ink-3

### Grid

`.home-show-grid` — 3-column grid (1 column on mobile), gap
1px, bg `var(--line-soft)`, border 1px line-soft, radius 8px,
overflow hidden, margin `0 32px` (0 16px mobile).

### `<ShowTile>` — rewrite `src/components/home/ShowTile.tsx`

Cards are linked containers; each tints to its show palette.

- `<a href="/shows/{slug}" style={{ background: paper, color: ink }}>`
- Padding `28px 28px 24px`, min-height 200px, flex column,
  justify space-between, gap 14px
- Hover: `transform: translateY(-2px)`
- **Head** (`.show-tile-head`): `<Bullet size={14} color={primary} />` + show name (serif 500 26px, letter-spacing -0.015em)
- **Blurb** (`.show-tile-blurb`): serif italic 15px, opacity
  0.78, text-wrap pretty — `{show.blurb}`
- **Meta row** (`.show-tile-meta`): flex justify space-between,
  margin-top 8px, mono 11px uppercase, opacity 0.6 —
  `{seasons} seasons · ranked` on the left, `→` (color
  `{primary}`) on the right

### Data

For v1, show the first three shows from `content/shows/*.md`,
sorted alphabetically. (Future: introduce a `featured_rank`
or a curated trio — file as candidate.)

## 4. `<HomeListsSection>` — `src/components/home/HomeListsSection.tsx`

The "Themed lists" rail.

### Section head

Same shape as Pantheons:
- `<h2>Themed lists</h2>` + `<Link href="/themes">All lists →</Link>`

### Rail

`.home-list-grid` — single column, border 1px line, radius 8px,
overflow hidden, margin `0 32px 64px`.

### `<ListTile>` — `src/components/home/ListTile.tsx`

Each row:
- `<a href="/themes/{slug}">`
- Padding `22px 24px`, bg `var(--paper-1)`, border-bottom 1px
  line-soft, last child no border
- Hover: bg `var(--paper-2)`
- Grid: `20px 1fr auto`, gap 20px, align center
- Dot: 8px circle, color = `var(--s-{sentiment})` (from
  tokens), `.list-tile-dot`
- Title: serif 500 18px, ink-0
- Meta: mono 12px ink-3, letter-spacing 0.04em
- Arrow: `→` ink-3 18px

### Data

For v1, render the first three themed lists from
`content/themes/*.md`, alphabetical. Each list's frontmatter
needs a `sentiment` field — add it to the theme schema:

```ts
sentiment: z.enum(['warm-up', 'warm-down', 'neutral', 'hold', 'verdict', 'consensus']).default('neutral'),
```

Existing themes get `sentiment: neutral` by default. If a
theme is "best comeback seasons" → `warm-up` feels right;
"most reviled finales" → `warm-down`. Curator's judgment via
`content-curator` agent. For 19e the migration just defaults
all existing themes to `neutral`; a follow-up content tick
can tune them.

If we have fewer than 3 themed lists in `content/themes/`,
render whatever we have. No fillers. Empty state below 1
list: render the section head + a one-line "Themed lists
coming soon."

## 5. Drop everything AI-art-related

Strip from the home page:
- Any `art` prop on `<HomeHero>` (the new `<HomeHero>` doesn't
  take one — feature is by tinted block + serif type only)
- Any `artSrc` on `<ShowTile>` (deleted in 19a)
- Any `<Image>` / `<img>` element that references
  `/shows/<slug>/*.svg`

Confirm via grep before commit.

## 6. e2e

Update `apps/e2e/tests/home.spec.ts`:
- Page is bounded (assert `.wrap` parent on the home content)
- Hero left cover renders with `{featured_show.name}` wordmark
- Hero right copy renders the title with "no spoilers" in
  primary
- Browse all shows / How it works links present with correct
  hrefs
- Pantheons grid has 3 tiles (or however many shows we have,
  ≥ 1)
- Each tile has a bullet + serif name
- Themed lists rail has 0–3 list tiles (depending on content),
  each with a sentiment dot

Update `apps/e2e/src/fixtures/page-reads.ts` accordingly.

## 7. Verify + commit + push

```
pnpm verify
git add -A
git commit -m "feat: phase 19e — homepage to spec"
git push origin main
pnpm deploy:check
```

Tick `[x]` for 19e.

## 8. Decisions log

- Featured show is hardcoded to `survivor` via
  `src/content/featured.ts` for v1. Rotation is a future
  candidate.
- Themed-list `sentiment` field defaults to `neutral`; a
  curator tick after this phase can tune the three
  highlighted lists.
- The home page is "the cold-search promise" — the eyebrow
  + title + blurb + actions deliver the message in three
  seconds. Don't add anything else to the hero (no carousels,
  no "what's hot," no metrics).
