# Phase 31 — Canon + Community unification, rank wiring, generation paths

> **The headline rule — canon rank is ALWAYS working.** Every
> content-generation path (ship-content Rule 1 + Rule 2, the
> content-curator agent, every future canon-iteration phase)
> ranks at the moment of seeding. A season never exists in
> the repo without a `canonical_position`. The first season
> ever seeded for a show creates that show's `canon.md` and
> lands at rank 1; every subsequent season is inserted into
> the canon at the position it deserves, and the surrounding
> entries' ranks are shifted to stay contiguous. There is no
> "canon pending" period — canon exists from the first season
> forward, and every season touched by a tick re-asserts the
> contract. This is the **constraint that drives every flow
> change below**.
>
> **Goal.** Resolve the cluster of weirdness around ranking
> across the show home, the canon page, the community page,
> and the season vote — and lock the generation paths so the
> always-working-canon rule above holds for every future tick.
> After this phase, clicking Editor's Canon takes you to the
> new unified canon page (per `design/tiered.tv · Survivor
> Canon.html`); the show home's filter chips actually re-sort
> the grid; the season-detail vote reads "community top 10"
> because votes feed community, not canon; every existing
> season carries a `canonical_position`; every show that has
> any seeded seasons carries a real `canon.md` (not a stub —
> a real ranking of however many seasons have been seeded so
> far); and every content-generation path emits the new fields
> by default.
>
> **Why now.** Three threads collide: the just-shipped phase 30
> hero "info card" wants a `community_rank` + a movement pill;
> the phase 26 drain is producing seasons faster than the canon
> page can absorb them, and **without ranking discipline each
> tick the canon falls further behind**; and the show home's
> Canon / Community / By-era chips are visually present but
> functionally inert. The page that's supposed to be the
> editorial spine of every show currently feels broken. This
> phase fixes that spine end-to-end so phase 26 keeps draining
> into a canon that grows entry-by-entry as content lands.

## Reference

- `design/tiered.tv · Survivor Canon.html` — **NEW** unified
  canon/community page. Binding reference. Body
  `data-view="canon"` vs `data-view="community"` flips between
  tabs; the title swaps; the section panes swap. Every section
  below maps to a labeled block in this file.
- `design/tiered.tv · Survivor.html` — show home. Updated this
  cycle: the SPLIT block's two buttons now link to
  `Survivor Canon.html#canon` and `Survivor Canon.html#community`
  respectively. **Both buttons go to the same page**, just open
  different default tabs.
- `design/tiered.tv · Heroes vs. Villains.html` — phase 30
  reference. Its info-card "Community rank" row + "↑ 3 this
  month" pill is the same shift-pill vocabulary this phase
  wires across canon entries.
- `design/CLAUDE.md` — visual law (color + type only).

## Pre-flight — what is already in place

- `getCanon(slug)` reads `content/shows/<slug>/canon.md` and
  parses entries `[{ rank, season, title, rationale }]`. Three
  canons exist today: `survivor`, `dragrace`, `top-chef`.
- `computeCommunityRank(show, seasons, canon)` already returns a
  ranked entry list with a `source` field (`canon | seasons |
  votes`). Phase 31 reuses this — it does not introduce a new
  ranking pipeline.
- `season.canonical_position` is in the schema (optional). It is
  **populated in zero of forty-seven** existing season files.
- `season.vote_question` is in the schema (optional). When
  absent, the season page renders the hard-coded default
  `"Does this belong in the canon top 10?"` — the bug this
  phase fixes.
- Voting backend (phase 11) writes rows to `votes` keyed by
  `(target_type='season', target_id='<show>:<n>')`. The
  community-rank pipeline does **not yet** read those rows
  (`source` returns `'canon'` whenever a canon exists, else
  `'seasons'`). Phase 31 does **not** wire live votes into the
  page — that is a future phase. It does ship the surfaces the
  vote backfill will plug into.

## What changes

### A. Show home page (`/shows/[show]`) — chip wiring + sort

1. **Drop the "By era" chip.** Per `design/tiered.tv ·
   Survivor.html` JS, the FilterBar shows **Canon** + **Community**
   only. Remove the `era` option from `DEFAULTS` in
   `src/components/composition/FilterBar.tsx`. Update the
   filter-bar tests + e2e fixtures to expect two chips.
2. **Make chips do something.** Today they are no-ops with a
   `data-active-filter` attribute. Wire client behavior:
   - Convert FilterBar to a client component (`'use client'`)
     that swaps the active `data-active-filter` and the visible
     ordering of children.
   - The page renders **both** orderings inline, ordered by the
     active filter at SSR time (default `canon`); the chip click
     re-orders by toggling a class without a route change. SEO
     keeps the canonical canon-ordered DOM.
   - URL-state: persist the active filter in
     `?view=canon|community` (no scroll). Reading the URL on
     mount restores the chip state; clicking a chip updates
     `history.replaceState`. No localStorage — the design's
     pattern is URL-state, and that's also how the canon page's
     tab toggle persists.
3. **Sort math.**
   - Canon order — sort by `canonical_position` ascending; ties
     broken by season number. Seasons without a canon position
     fall to the end in chronological order.
   - Community order — call `computeCommunityRank(show, seasons,
     canon)` and use the returned `entries[].season.number`
     order. Today this mirrors canon when a canon exists; when
     votes wire in (future), it diverges.
4. **Each `<SeasonCard>` carries a shift pill when known.** The
   `shift` prop already exists on the component. Populate it
   when the active filter is `community` and the season's
   community rank differs from its canon rank — `delta =
   canonRank - communityRank` (positive = community ranks it
   higher, sentiment `up`; negative = community ranks lower,
   sentiment `down`; zero = `hold`). When the active filter is
   `canon`, the pill stays hidden.

### B. Season detail page — vote question wording

1. Change the hard-coded default in
   `src/app/shows/[show]/season/[n]/page.tsx`:

   ```diff
   - season.vote_question ?? 'Does this belong in the canon top 10?'
   + season.vote_question ?? 'Does this belong in the community top 10?'
   ```

2. Update every authored `vote_question` in
   `content/shows/**/seasons/*.md` that mentions "canon" to read
   "community" — votes drive community, not canon. (Grep run:
   `git grep -l "canon top 10" content/`.)
3. Update the schema-test fixture in
   `src/content/__tests__/schemas.test.ts` to use the community
   wording.

### C. Canon page (`/shows/[show]/canon`) — unification + new shell

Rebuild `/shows/[show]/canon` + `/shows/[show]/community` to
share a single page shell that flips between the canon view
and the community view based on the route + an in-page tab
control. Routes:

- `/shows/[show]/canon` → SSR with `data-view="canon"`.
- `/shows/[show]/community` → SSR with `data-view="community"`.
- Tab clicks: client-side flip via `data-view` mutation on
  `<body>` + `history.replaceState` to the sibling route. Both
  routes share the same React tree under
  `src/app/shows/[show]/(canon-pair)/` — a new route group
  hosting a single page component that reads which route it's
  on from a server prop and seeds the initial `data-view`.

**Page layout** (per `design/tiered.tv · Survivor Canon.html`):

1. **`.crumb`** — `Shows / {show.name} / The ranking`.
2. **`.head`** — split:
   - Left: eyebrow swaps between `01 · curated — {show.name},
     ranked top to bottom.` (canon) and `02 · live — {show.name},
     ranked top to bottom.` (community). Title swaps between
     `The Editor's Canon` and `The Community Rank`. Lede swaps
     between the canon's editor-byline and the community's vote
     stats.
   - Right: stats stack — `Entries / Last revised (or Last
     recompute) / Editor (or Voters this week)`. Values come
     from `canon.last_revised`, `canon.editor`, future
     `votes_count`. Live-dot pulses on community.
3. **`.tabs`** — `Editor's Canon · curated` / `Community ·
   live`. Tab click swaps route + view.
4. **Canon view body:**
   - **Methodology row** — three cells (`01 · WHO`, `02 · HOW`,
     `03 · WHEN`). Copy is authored per show in canon
     frontmatter (`meth_who_h`, `meth_who_p`, etc).
   - **Toolbar with era chips** — `All N` (default on),
     `Pre-2005`, `2005 – 2010`, `2010 – 2020`, `Reboot era`.
     Era ranges authored on each show as `era_bands`
     (frontmatter, optional — falls back to a hard-coded
     default `[[1900,2005],[2005,2010],[2010,2020],[2020,2100]]`
     when absent).
   - **Tier S — entries 1–5.** `.hero-entries`. Each row:
     `.he-rank` + title + season-meta + `.he-tag` (one-line
     `tag`) + `.he-blurb` (the rationale, trimmed to ~400
     chars) + `.he-aside` with a Community mini-card (rank +
     shift pill) and a "Why this slot" mini-card (the
     `slot_argument` field, authored on canon entries).
   - **Tier A — entries 6–15.** `.mid-entries` (2-col grid).
   - **Tier B — entries 16–30.** `.compact-entries`
     (single column, dense rows).
   - **Tier C — entries 31+.** `.tail-table` (smallest cell
     density).
   - Tier banding is **derived from rank**, not authored —
     `[1,5] → S`, `[6,15] → A`, `[16,30] → B`, `31+ → C`. Each
     tier band carries a tier blurb (`canon.tier_s_blurb`,
     `tier_a_blurb`, `tier_b_blurb`, `tier_c_blurb`) +
     entry-count caption derived from coverage.
5. **Community view body:**
   - **`.live-strip`** — `live · last recompute · next
     recompute · voters this week`. Values are placeholders
     until vote-wire-in; copy reads "votes pending — community
     rank mirrors the canon" when `computeCommunityRank.source`
     is `'canon'`.
   - **Movers grid** (`.movers`) — top 4 movements this cycle.
     Stub data until vote history exists; component accepts an
     empty-state ("Movement appears once weekly recomputes
     begin.") and renders that when no movers are present.
   - **Weekly-question card** (`.cq-card`) — `canon.weekly_question`
     authored field. Renders the question + a "Cast my vote"
     button that scrolls to the relevant season page (or shows
     a "Question pending" empty-state when unauthored).
   - **Full ranking** (`.cl-cols` + `.cl-rows`) — every season
     in community-rank order with: rank · title + tag-sub ·
     approval bar (from votes when present, else hidden) ·
     approval % (hidden when no votes) · 7d trend (hidden when
     no history) · vote count (hidden when no votes). When
     no votes exist, the ranking renders cleanly as a list with
     just rank + title + tag.
6. **Empty / pending states.** Every block above must render
   the **show's canon is pending** copy when `canon` is null
   AND must render the **votes pending** copy when no votes
   exist. The page never shows a broken section; missing data
   collapses with a small explanatory line.

### D. Schema additions

`src/content/schemas.ts`:

1. **`canonFileSchema`** gains a frontmatter block. Currently
   it only carries `show` + `entries`. Add:
   - `editor` — string, the canon editor's name. Optional;
     defaults to `"tiered.tv Editors"`.
   - `last_revised` — ISO date.
   - `meth_who_h` / `meth_who_p` — heading + paragraph for the
     methodology cell 1 (60–140 chars / 40–60 words).
   - `meth_how_h` / `meth_how_p` — methodology cell 2.
   - `meth_when_h` / `meth_when_p` — methodology cell 3.
   - `tier_s_blurb`, `tier_a_blurb`, `tier_b_blurb`,
     `tier_c_blurb` — optional one-paragraph tier blurbs
     (10–40 words each). Renderer collapses the tier head when
     absent.
   - `weekly_question` — string ≤ 140 chars; the community-view
     CQ card text. Optional.
   - `era_bands` — array of `{ key, label, range:[year,year] }`,
     0–6 entries. Optional. Defaults to the four-band hard-coded
     fallback when absent.
   - **Existing** `entries[]` extension:
     - `tag` — string ≤ 120 chars. The italic single-line
       editorial tag rendered above the rationale on hero +
       mid + compact + tail rows.
     - `slot_argument` — string ≤ 240 chars. The "Why this
       slot" mini-card text on hero entries.
     - `community_rank_hint` — `{ rank: int, delta: int,
       sentiment: 'up'|'down'|'hold' }`. **Optional** authored
       hint for the canon-view community mini-pill, used until
       live vote data wires in. Renderer prefers live data
       when available; falls back to this hint; collapses the
       mini-pill when both are absent.

2. **`seasonFrontmatterSchema`** — no NEW fields, but the
   following are now **strongly recommended** and emitted by
   every generation path:
   - `canonical_position` — when the show has a canon,
     populated from the canon entry's `rank`. When the show
     does not yet have a canon, populated by season number
     (so the show home sorts deterministically before canon
     is authored).
   - `tag` — the italic editorial subtitle on each card.
     Already in the schema; called out here because the new
     canon page reads it on every tier band.

### E. Backfill — every seeded season ranks; every show with seeded seasons gets a real canon

Per the headline rule: **no season is committed without a
`canonical_position`, and no show with one or more seeded
seasons goes without a real `canon.md`.** This phase makes that
true across the existing 47 season files + 10 shows-without-canon
in one drain, then the generation paths (section G) keep it
true forever after.

1. **Every season file** — populate `canonical_position`.
   - For the 3 shows with a canon (`survivor`, `dragrace`,
     `top-chef`): pull `rank` from the canon entry that
     matches `season.number`. Seasons not yet ranked in the
     canon get inserted into the canon (see step 2 + 3).
   - For the 10 shows without a canon yet: **author a
     canonical_position for every seeded season AND author
     a `canon.md` that ranks them.** The position is the
     curator's editorial judgment, not an automatic
     chronological fallback. The rankings are scoped to the
     seeded seasons only — a show with 3 seeded seasons gets
     a 3-entry canon ranking those 3 seasons; the
     `canonical_position` for each is 1 / 2 / 3 by editorial
     order, not season number. As more seasons are seeded by
     phase 26, the canon grows.
2. **Three existing canon files** (`survivor/canon.md`,
   `dragrace/canon.md`, `top-chef/canon.md`) — backfill the
   new frontmatter block: `editor`, `last_revised`, the three
   methodology paragraphs, the four tier blurbs, `weekly_question`,
   `era_bands` (optional — survivor inherits the four-band
   default; dragrace + top-chef can author tighter ranges).
   Also: for any seeded season that is NOT yet in the canon
   entries (e.g. a Survivor season that 26a backfilled stats
   for but the canon hasn't ranked yet), the curator now ranks
   it — slot it into the canon, write its rationale, shift
   surrounding entries' ranks.
3. **Three existing canon files** entries — add `tag`,
   `slot_argument`, and `community_rank_hint` to **at least
   the top-5 entries** so the hero band renders the design
   1:1 for Survivor. Remaining entries get `tag` at minimum
   (the italic line above the blurb is the editorial signal
   that makes the band feel alive); `slot_argument` +
   `community_rank_hint` are best-effort.
4. **Survivor S20 (Heroes vs. Villains)** — change
   `vote_question` from any "canon" wording to "Does this
   belong in the community top 10?".
5. **Ten shows without a canon — author one each.**
   `amazing-race`, `bachelor`, `bachelorette`, `bake-off`,
   `big-brother`, `love-island-uk`, `love-island-us`,
   `project-runway`, `the-challenge`, `traitors`. Each one
   gets a `content/shows/<slug>/canon.md` with the full new
   frontmatter (editor, last_revised, methodology, tier
   blurbs, weekly_question, era_bands when meaningful) +
   one entry per seeded season already in
   `content/shows/<slug>/seasons/`. The rankings ARE the
   editorial work — the curator picks an order, writes a
   80–120-word rationale for each, and assigns the tag +
   slot_argument for the top entries. **This is the
   visible-improvement signal:** visiting
   `/shows/amazing-race/canon` now shows a real ranking of
   the three seeded seasons (`01-season-1`, `07-season-7`,
   `11-all-stars`) in defended order, not an empty page.
6. **Sync — for every show, after the canon is authored,
   re-walk each season file and write `canonical_position`
   to match.** This is the cross-file invariant the
   always-working rule guarantees; phase 31's commit makes
   it true for all 47 existing season files.

### F. Season URL slugs — `/season/4` → `/season/marquesas`

Numeric season URLs (`/shows/survivor/season/4`) are weak for
SEO and unfriendly to share. Switch the canonical form to a
**slug** derived from the season's title — `/shows/survivor/season/marquesas`,
`/shows/survivor/season/heroes-villains`, etc. The convention
is already half-shipped: every season file is named
`NN-<slug>.md` on disk (`04-marquesas.md`,
`20-heroes-villains.md`, `41-new-era-i.md`), so the slug is
authored — just not exposed.

1. **Loader change** — `src/content/loaders.ts` parses
   `^(\d+)-(.+)\.md$` on each season filename and stores the
   captured suffix as `season.slug`. No frontmatter authoring
   required for existing files; the regex pulls
   `marquesas`, `heroes-villains`, etc. directly. Files that
   don't match the pattern (none currently) fail the
   content-check.
2. **Schema** — `seasonFrontmatterSchema` gains a `slug?`
   override (optional, kebab-case, ≤ 64 chars). When set, the
   override beats the filename-derived slug. Curator only
   reaches for the override when a filename rename would be
   awkward (e.g. a season the file system already keys on by
   number).
3. **Route rename** —
   `src/app/shows/[show]/season/[n]/` →
   `src/app/shows/[show]/season/[slug]/`. The route param
   resolves through a new `getSeasonBySlug(show, slug)` helper
   that prefers the slug match and falls back to numeric
   parse for backward compatibility (so a stale link to
   `/season/4` still works while we redirect).
4. **Canonical-form redirects** — `src/middleware.ts` adds a
   308 from `/shows/<show>/season/<digits>` to
   `/shows/<show>/season/<slug>` whenever the digit form
   resolves to a known season. External links (search-engine
   indexes, shared URLs, old QR codes) keep working but land
   on the canonical form. `/sitemap.ts` emits the slug form
   only.
5. **Internal links** — sweep every link emitter (the
   `<SeasonCard>`s on `/shows/<show>`, the canon page's
   `.hero-entry` / `.mid-entry` / `.compact-entry` /
   `.tail-row` link hrefs, the community-list rows, the
   `<AdjacentSeasons>` prev/next, the `<AppearsInList>` rows,
   the season-detail JSON-LD self-link, the breadcrumb
   trails) and replace `season.number` with `season.slug` in
   the href. The cross-reference *keys* (e.g.
   `theme.entries[].season` is still numeric — it's the
   cross-show join key authored by the curator) stay
   numeric; only the rendered href flips to slug.
6. **`apps/e2e/src/fixtures/canonical-urls.ts` +
   `page-reads.ts`** — regenerate from the slug form. Smoke
   walker still hits every season; the URLs just read
   differently. Also keep one digit-form URL per show in a
   separate `redirect-fixtures.ts` so the 308 path has a
   regression test.
7. **Generation paths** — extend the content-curator agent +
   ship-content Rule 2 with the slug convention written out
   explicitly: every new season file is named
   `NN-<slug>.md`, slug is kebab-case ASCII (transliterate
   accents — `kaoh-rong`, not `kaôh-rōng`), no leading
   numerics (so `Survivor 41` becomes `new-era-i` from the
   editor's notes — match the existing pattern). The
   pre-flight checklist gains a slug-uniqueness check per
   show; `scripts/content-check.ts` asserts every season's
   resolved slug is unique within its show.
8. **JSON-LD + canonical URLs** — `buildMetadata` /
   `canonicalUrl` already centralizes URL composition. Point
   them at the slug form once `getSeasonBySlug` is in. No
   structured-data shape change.

**Out of scope here:** *show* slugs are already correct
(`survivor`, `amazing-race`, etc — phase 5 baked them in).
Theme entry slugs unchanged. No DB migration — slugs are
content-side only; the `votes.target_id` key still uses
`<show>:<season-number>` for stability across slug renames.

### G. Generation paths — lock the always-working-canon rule + slug convention

This is the **super-important** part. Every content-generation
surface must enforce the headline rule: no season ships without
a `canonical_position`, no show ships its first season without
a `canon.md`, every batch tick re-ranks. The contract is the
constraint, not a hint.

1. **`.claude/agents/content-curator.md`** — rewrite the
   season template + the canon template:
   - Season template gains a **required** line:
     `canonical_position: <int>`. Sourced from the canon entry
     for the season's rank when the show's canon exists; when
     authoring a brand-new show alongside its first seasons,
     the curator co-authors the canon in the same tick and
     pulls ranks from there. **There is no "leave blank and
     fill later" mode** — leaving it blank is a contract
     violation that the post-check catches.
   - Season template defaults
     `vote_question: "Does this belong in the community top 10?"`.
     The agent only swaps the wording when a show-specific
     question carries more editorial weight (e.g. a cast-rank
     show); even then, the phrasing reads "community", never
     "canon".
   - Canon template carries the full new frontmatter block
     (editor, last_revised, three methodology paragraphs, four
     tier blurbs, weekly_question, optional era_bands) — every
     field documented with length caps + a worked example
     keyed to Survivor.
   - Canon entry template carries `tag` + `slot_argument` +
     optional `community_rank_hint` with worked examples.
   - **Insertion semantics:** when adding a season to an
     existing canon, the curator slots it at the position it
     deserves and shifts every entry below by +1; when
     promoting a season up, the curator shifts the entries in
     between by ±1. The agent doc spells out this rebase
     pattern with a worked example.
2. **`skills/ship-content.md`:**
   - Rule 1 (new show): the curator brief lists a **real
     `canon.md`** as part of the ship payload — full
     frontmatter + **one ranked entry per seeded season**.
     A new show ships with at least one season AND a canon
     that ranks that season at #1; the rationale is authored
     in the same tick. Shipping a show without a populated
     canon is a contract violation.
   - Rule 2 (season backfill): every season the curator
     produces in a batch ships with `canonical_position`
     filled. Before committing the batch, the curator opens
     the show's `canon.md`, inserts each new season at the
     editorially-correct position with an 80–120-word
     rationale, shifts surrounding ranks, and re-writes any
     `canonical_position` values on previously-seeded seasons
     whose rank moved. The pre-flight checklist gains:
     `[ ] canon.md updated; every seeded season's
     canonical_position matches its canon rank`.
   - Rule 2 (canon completion / graduation): graduation now
     means **complete coverage** — every aired season ranked,
     plus the new frontmatter block (methodology + tier
     blurbs + weekly_question + era_bands) + the new entry
     fields (tag + slot_argument + community_rank_hint for
     the top 5).
   - New invariant section ("Canon discipline") at the top of
     ship-content's rules block stating the always-working
     rule in one paragraph + the rebase semantics + the
     pre-flight check command (`scripts/content-check.ts`
     extended to assert the invariant — see I below).
3. **`scripts/content-check.ts`** gains two new assertions
   (it currently validates frontmatter + word counts only):
   - For each show with at least one season:
     `content/shows/<slug>/canon.md` must exist.
   - For each season with a show that has a canon: the
     season's `canonical_position` must equal the canon
     entry's `rank` for that season. Mismatch = fail. Missing
     `canonical_position` = fail. Canon entries pointing at
     a non-existent season = fail.
   These assertions are the **runtime guardrail** that
   enforces the headline rule. `pnpm content:check` runs in
   `pnpm verify`, so any drift between season frontmatter and
   canon ranks blocks the commit. The script's failure output
   tells the curator exactly which file is off and how.
4. **`plan/phases/phase_25_canon_iteration.md`** — add a
   short note that future canon-iteration ticks must keep
   methodology, tier blurbs, weekly_question, tag,
   slot_argument, and community_rank_hint in sync, AND must
   re-walk every season file to sync `canonical_position`
   after a rank shuffle. (Phase 25 is shipped; the note is
   for any future canon-iteration phase that reads from this
   one.)
5. **`plan/phases/phase_26_season_backfill.md`** — already
   the active phase. Inline a callout that every season
   produced from this point forward MUST carry
   `canonical_position` AND must be inserted into the canon
   in the same tick. The phase 26 acceptance criterion gains:
   `pnpm content:check` passes with the new invariant
   assertions.
6. **`.claude/agents/data-steward.md`** — no changes. The
   schema lives in TypeScript; no SQL touch in phase 31.

## Components

**New (under `src/components/canon/`):**

- `CanonPageShell.tsx` — owns the head + tabs + `data-view`
  toggle behavior. Server component with a small client
  child for the tab clicks.
- `CanonTabSwitch.tsx` — client tab control. Owns the
  `history.replaceState` + `<body data-view>` mutation.
- `CanonHead.tsx` — eyebrow / h1 / lede dual-render.
- `CanonStats.tsx` — three-row stat stack (Entries /
  Last revised / Editor in canon view; Last recompute /
  Voters in community view).
- `CanonMethodology.tsx` — three methodology cells.
- `CanonEraToolbar.tsx` — era-chip toolbar. Client component;
  filters tier bands in place via CSS class on the page root.
- `CanonTierBand.tsx` — generic tier-band shell (header +
  count caption + child slot for the entry layout).
- `CanonHeroEntries.tsx` — tier S top-5 entries.
- `CanonMidEntries.tsx` — tier A 6-15 entries.
- `CanonCompactEntries.tsx` — tier B 16-30.
- `CanonTailEntries.tsx` — tier C 31+.
- `CommunityLiveStrip.tsx`
- `CommunityMovers.tsx`
- `CommunityWeeklyQuestionCard.tsx`
- `CommunityRankList.tsx` — header columns + rows; the
  approval bar / % / 7d / votes cells render with hidden
  modifiers when no vote data is present.

**Reused:**

- `<Bullet>`, `<ShieldBadge>`, `<RankShiftPill>` (already
  carries the up/down/hold sentiment vocabulary).

**Deprecated by this phase (delete in the same commit):**

- The current `src/components/composition/CanonList.tsx` +
  `CanonEntry.tsx` shell. The community page's current
  `<SeasonGrid>` layout (it gets replaced by `CommunityRankList`).

## CSS

Port the binding rules verbatim from
`design/tiered.tv · Survivor Canon.html` into a new
`src/styles/canon.css`, imported from `src/app/globals.css`
**before** `search.css` (the current last-import) so the
`@layer base` block in globals.css remains the last thing
parsed. (Reminder: never write `*/` inside a CSS comment body —
the phase-29 postmortem covers the bug.)

Drop the old `.canon-list / .canon-entry` selectors. Keep the
`.canon-page` page wrapper class.

## Wiring

1. `src/components/composition/FilterBar.tsx` — drop `era`,
   add a client-side toggle that flips
   `data-active-filter` + updates `?view=`.
2. `src/app/shows/[show]/page.tsx` — render both sorted
   orderings (canon + community) inline; the FilterBar's
   `data-active-filter` controls which is visible via CSS
   `display: none`. Update the SeasonCard `shift` prop wiring
   on the community ordering.
3. `src/app/shows/[show]/canon/page.tsx` +
   `src/app/shows/[show]/community/page.tsx` — both now
   render `<CanonPageShell initialView={"canon"|"community"} …/>`
   passing the show + canon + computed community rank +
   computed shifts.
4. `src/app/shows/[show]/season/[n]/page.tsx` — change the
   vote-question default wording.
5. `src/components/show/ShowSplit.tsx` — the show home's
   canon/community split block — point both buttons at the
   new shared page (canon-btn → `/shows/[show]/canon`,
   community-btn → `/shows/[show]/community`); buttons
   themselves stay structurally the same.

## Tests

**Unit (vitest):**

- `FilterBar.test.tsx` — renders two chips (no era);
  clicking community flips `data-active-filter`; URL state
  syncs.
- `CanonPageShell.test.tsx` — initial view = canon when
  route is `/canon`; initial view = community when route is
  `/community`; tab switch mutates `data-view` + URL.
- `CanonHeroEntries.test.tsx` — five rows; missing fields
  collapse (tag absent → italic line hidden; slot_argument
  absent → mini-card hidden; community_rank_hint absent →
  pill hidden).
- `CommunityRankList.test.tsx` — header + rows; approval
  bar/%/trend/votes cells hide when no vote data.
- `vote-question wording` — content/__tests__ covers that
  the default wording is "community top 10".
- `canonical_position back-fill` — content/__tests__ asserts
  that every season under a show that has a canon carries a
  `canonical_position` matching its canon-entry rank.

**Playwright (`apps/e2e/tests/canon-page.spec.ts` +
`apps/e2e/tests/community-page.spec.ts` + updates to
`show-home.spec.ts`):**

- `/shows/survivor` chip switch — Canon chip on by default;
  clicking Community re-orders the season grid (top card
  changes); URL updates to `?view=community`.
- `/shows/survivor/canon` renders methodology cells, four
  tier bands, top-5 hero entries with community pills.
- Tab click on `/shows/survivor/canon` lands on
  `/shows/survivor/community` (same shell, different view).
- `/shows/amazing-race/canon` renders the **stub canon**:
  methodology + tier band heads + "canon pending — drain in
  progress" cells under each band. No errors; no horizontal
  scroll at 375px.
- `/shows/survivor/season/20` shows the vote question
  "Does this belong in the community top 10?" (overrides
  hard-coded default by way of the authored field changing).
- Mobile (375px): tab control still reachable, era chips
  still tappable, community-list reflows.

**Smoke walker.** No new canonical URLs (canon + community
routes already in fixtures). Confirm the smoke spec passes
across all 13 shows + the 47 season pages.

## Acceptance

- **Always-working invariant holds.** `pnpm content:check`
  asserts (a) every show with one or more seasons has a
  `canon.md`, (b) every season has a `canonical_position`
  that matches its canon entry's `rank`, (c) every canon
  entry points at a real season file. The invariant gates
  `pnpm verify`.
- `/shows/survivor` chip switch is functional; "By era" is
  gone; Canon is default; Community re-orders the grid with
  visible shift pills where canon and community ranks differ.
- `/shows/survivor/canon` renders the design 1:1 against
  `design/tiered.tv · Survivor Canon.html#canon` for desktop
  + mobile (top-5 hero band, mid 6–15, compact 16–30,
  tail 31–47 if entries exist; methodology cells; era toolbar).
- `/shows/survivor/community` renders the same shell with
  the community view active; community-list shows every
  ranked season; vote-pending state renders cleanly until
  the future vote wire-in.
- `/shows/amazing-race/canon` is no longer empty — the
  newly-authored canon ranks its three seeded seasons in
  defended order, each with rationale, plus the methodology
  cells and tier blurbs. Same for the other nine
  previously-empty shows.
- `/shows/survivor/season/20` shows the community-wording
  vote question.
- Every season file in `content/shows/**/seasons/*.md` whose
  show carries a canon has `canonical_position` populated.
- Every season is reachable at its slug URL — e.g.
  `/shows/survivor/season/marquesas` resolves; the old
  `/shows/survivor/season/4` 308s to it. Slug uniqueness is
  asserted by `content:check`. Sitemap emits slug-form URLs
  only; smoke walker traverses slug form + a redirect spot
  check.
- Three canon files carry the new frontmatter block; top-5
  hero entries on Survivor carry tag + slot_argument +
  community_rank_hint.
- `.claude/agents/content-curator.md` + `skills/ship-content.md`
  (Rule 1 stub-canon, Rule 2 canonical_position + vote_question
  wording, Rule 2 graduation new frontmatter) updated; the
  worked Survivor example is the gold-standard reference both
  files point to.
- `pnpm verify` green.
- Build-plan check-mark: `[x] Phase 31` with commit hash.
- Plain commit message, no Co-Authored-By, no emoji. Push as
  one atomic act per the standing rules.

## Out of scope

- **Live vote wiring.** The community page renders movers +
  approval bars + % + trend + vote counts only when data is
  present; until votes flow, the page reads "community rank
  mirrors the canon — votes pending". A future phase (call it
  31a or fold into phase 12) connects `votes` rows to the
  community-rank computation, populates the `mover` calculation
  from week-over-week diffs, and replaces the `community_rank_hint`
  authored values with live derivations.
- **Backfilling canon stubs for the other 9 shows** beyond
  Amazing Race. If time allows in the same phase, ship them;
  otherwise phase 26 picks them up.
- **Schema for ranked-vote weekly question.** The
  `weekly_question` field is one string per canon today. A
  future phase may expand it to a series with closed-by dates;
  not in 31.
- **A11y polish + axe coverage** for the new components —
  the existing phase-18 axe gate covers desktop + mobile
  WCAG 2.1 AA critical paths and continues to gate; targeted
  polish (focus rings on tab switch, etc.) is a follow-up
  iteration finding if axe surfaces one.
