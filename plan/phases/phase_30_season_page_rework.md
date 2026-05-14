# Phase 30 — Season detail page rework to spec

> **Goal.** Rebuild `/shows/[show]/season/[n]` end-to-end against
> `design/tiered.tv · Heroes vs. Villains.html`. The current page
> (phase 19c shape) is a 2-column `season-shell` that does not
> carry the design's hero info-card, stats strip, episode-heat
> bar, TOC, watch-list, or sticky thread. The data layer for
> these surfaces has already shipped (phase 26a); only the UI is
> missing.
>
> **Why now.** Survivor S20 was authored to the new schema as the
> gold-standard reference in phase 26a, and its frontmatter
> currently has nowhere to render. Phase 26 will drain the deep
> editorial fields (`watch_list`, `episode_heat`, `pull`,
> `lede`, `eyebrow`) across the other 16 seasons + every new
> season the cloud loop ships; that drain wants pages to render
> against as it goes. The renderer must collapse gracefully where
> fields are absent so it can ship before the data is uniform.

## Reference

- `design/tiered.tv · Heroes vs. Villains.html` — binding
  reference. Every section in the "What changes" list below maps
  to a labeled block in that file.
- `design/CLAUDE.md` — visual law (color + type only).
- `plan/phases/phase_26a_season_data_shape.md` — the schema the
  page reads.
- `content/shows/survivor/seasons/20-heroes-villains.md` — the
  one fully-populated season today; the design renders this
  file's frontmatter 1:1.

## Pre-flight — what is already in place

Confirmed before drafting this phase; **no extra data, schema,
or skill work is required to start**:

1. **Schema (`src/content/schemas.ts`).** All design-consumed
   fields landed in phase 26a: `display_title` (with `<em>` +
   `<br/>`), `eyebrow`, `lede`, `pull`, `filming_caption`,
   `premiere_caption`, `episodes_caption`, `format_summary`,
   `format_caption`, `cast_size`, `cast_size_caption`,
   `host_caption`, `episode_heat`, `episode_heat_caption`,
   `watch_list`. All optional — the page must collapse missing
   surfaces, not error.
2. **Gold-standard content.** Survivor S20 has every field
   populated to match the design 1:1. Phase 30 e2e and the
   visual diff against the design html both pin to this file.
3. **Generative skills.** `.claude/agents/content-curator.md`
   and `skills/ship-content.md` (Rule 2) already enumerate the
   new fields with length caps + a worked example, so the
   cloud phase-26 drain produces season files this page
   understands. **No skill update is needed in phase 30.**

The 16 non-showcase season files carry public-record stats
(location / host / premiere_date / ep_count / format_summary /
cast_size / captions) but **lack** the deep editorial block
(`watch_list`, `episode_heat`, `pull`, `lede`, `eyebrow`,
extended `body`). Phase 26 drains those separately — phase 30
is page-side only and must render those seasons gracefully (TOC
collapses missing sections, ep-strip + watch-list + pull-quote
do not render when absent).

## What changes (deltas from current `/shows/[show]/season/[n]`)

The current page (phase 19c) renders:

- `<SeasonShell>` (2-col main + sticky thread aside)
- `<SeasonHead>` (crumb + h1 + rank row)
- `<SeasonBody>` (lede + body + pull)
- `<SeasonDetails>` (4-tile flat strip — capped at 4 entries)
- inline `season-vote-block` (question + meta + `<VotePair>`)
- `<AdjacentSeasons>` (prev / next)
- `<AppearsInList>` (themes + canon backlink)
- `<CommentThread>` in aside

The new design replaces the shell + reflows everything:

1. **Hero with sticky info-card** (`.hero` block).
   Two-column grid: editorial left (crumb / eyebrow / h1 /
   lede / byline) + sticky `.info-card` right rail. Rail
   stacks four rows:
   - **Canon scale row** — `#NN of T` + a thin progress track
     filled to `(T - rank + 1) / T`, marks `#01 / ↑ here / #NT`.
   - **Community row** — `#NN` + a shift pill ("↑ 3 this
     month"); a 14-char serif caption underneath
     ("readers rank it higher than the editors do.").
   - **Vote row** — `vote_question` + `<VotePair>` (existing
     phase 19d component reused, no contract change) + a
     "one vote per reader · canon recomputes weekly" help line.
   - **Shield stack** — two single-line promises (no-spoilers
     review + watch-order hint).
   Mobile (≤980px): card unsticks and sits below the lede.
2. **`<em>` accent inside `season-h1`.** Render `display_title`
   when present, turning `<em>…</em>` into
   `<span class="amp">…</span>` and `<br/>` into a literal break.
   `<span.amp>` displays the colored italic accent per the
   Survivor `Heroes vs. Villains` cover. Falls back to plain
   `title` when `display_title` is absent.
3. **Stats strip** (`.stats > .stats-inner`). Six tiles in a
   6-col grid (3-col @ ≤1180px, 2-col @ ≤560px): `Filmed /
   Premiered / Episodes / Format / Cast size / Host`.
   Each tile is `stat-key` + `stat-val` + optional `stat-cap`.
   Replaces the current flat `<SeasonDetails>` strip. Pulls
   values from `location` + `filming_caption`, `premiere_date`
   + `premiere_caption`, `ep_count`/`episodes` +
   `episodes_caption`, `format_summary` + `format_caption`,
   `cast_size` + `cast_size_caption`, `host` + `host_caption`.
   Renderer collapses an individual tile when both value and
   caption are missing; if **fewer than three** populated
   tiles remain, the entire strip hides.
4. **Episode rhythm strip** (`.ep-strip`). A horizontal bar
   row of `ep_count` cells colored by `episode_heat[i]` (cold
   = subtle, med = primary @ 55%, hot = primary). Caption on
   the right (e.g., "peak run · eps 7–9, 11"). Renders only
   when `episode_heat` is present.
5. **3-column body grid** (`.body-grid`). Left rail = sticky
   `.toc` with scrollspy; middle = `.article` (max-width 720);
   right rail = sticky `.thread`. Collapses to 2-col @ 1100px
   (TOC hidden) and 1-col @ 820px.
6. **Article sections.** The article splits into numbered
   sections that match the TOC anchors:
   - `01 The take` — lede paragraph(s) + optional `season-pull`
   - `02 The shape of the season` — body paragraphs from `body`
   - `03 Where it sits in the canon` — auto-generated paragraph
     using `canonical_position`, total-canon-count, and
     `community_rank` when available; falls back to a
     "Canon position not assigned yet" line.
   - `04 What to watch for` — `<WatchList>` grid of
     `watch_list` entries (2-col desktop / 1-col mobile),
     each item: `episode_label` + `body`. Section hidden when
     `watch_list` is absent.
   - `05 Adjacent in the canon` — port of the existing
     `<AdjacentSeasons>` into the `.season-related` grid
     style (no contract change; reuse component, restyle CSS).
   - `06 Also appears in` — port of `<AppearsInList>` into
     the `.appears-list` row group (no contract change).
   Sections with no data collapse + the TOC entry for that
   section hides.
7. **TOC scrollspy.** Tiny client component: numbered list of
   active sections, links update `aria-current="true"` on the
   nearest visible heading. Reduced-motion path collapses
   scroll-into-view to instant.
8. **Sticky thread rail.** The existing `<CommentThread>` +
   `<CommentInput>` (or `<CommentInputStub>`) sits in the
   `.thread` rail with `position: sticky; top: 96px`. Head
   shows `count · spoiler-safe`. Mobile (≤1100px) unsticks.

## Components

**New (under `src/components/composition/`):**

- `SeasonHero.tsx` — top hero block. Owns crumb / eyebrow /
  display-title rendering / lede / byline + the
  `<SeasonInfoCard>` rail.
- `SeasonInfoCard.tsx` — the sticky four-row info card.
- `SeasonStatsStrip.tsx` — the 6-tile stats grid.
- `SeasonEpStrip.tsx` — the episode-rhythm bar.
- `SeasonTOC.tsx` — sticky scrollspy TOC; client component.
- `WatchList.tsx` — `watch_list` grid renderer.
- `RankScale.tsx` — pure render for the canon scale-track
  (rank, total, fill %, marks); reused inside `SeasonInfoCard`.

**Reused, no contract change:**

- `<VotePair>`, `<CommentThread>`, `<CommentInput>` /
  `<CommentInputStub>`, `<AdjacentSeasons>`, `<AppearsInList>`,
  `<ShieldBadge>`, `<Bullet>`, `<RankShiftPill>`.

**Deprecated by this phase (delete in the same commit):**

- `<SeasonShell>` (replaced by the new `.body-grid` layout)
- `<SeasonHead>` (its surface is folded into `<SeasonHero>`)
- `<SeasonBody>` (the article column owns lede / body / pull
  inline)
- `<SeasonDetails>` (replaced by `<SeasonStatsStrip>`)

Drop the corresponding `__tests__/` files. Run a repo grep to
catch any stale imports before commit.

## CSS

Port the binding rules verbatim from
`design/tiered.tv · Heroes vs. Villains.html` into
`src/styles/screens.css` under a clearly labeled
`/* ========================================================
   SEASON PAGE — phase 30, ported from Heroes vs. Villains.
   ============================================================ */`
block. Use the canonical project tokens (`--color-*` etc.) where
the design's `:root` declares its locals; preserve the design's
`var(--show-*)` reads so per-show palette tinting works.

**CSS-comment discipline (post-phase-29).** Never write `*/`
literal inside a CSS comment body; lightningcss will terminate
the comment early and corrupt the rest of the file. The phase-29
postmortem (commit `0a757ff`) covers the pattern. Run a content
check after the port: `grep -n "*/.*[^/]" src/styles/screens.css`
must return no surprising hits inside `/* … */` blocks.

Retire the old `.season-shell / .season-main / .season-aside`
ruleset and any `.season-head`, `.season-details` rules unique
to it. Keep `.season-h1` + `.season-pull` semantics (their new
sizes come from the design block).

## Wiring (`src/app/shows/[show]/season/[n]/page.tsx`)

Replace the current `<SeasonShell main={…} aside={…}/>` body
with a top-to-bottom render:

1. `<SeasonHero …>` — pass `season`, `show`, computed
   `canonRank` / `totalCanon` / `communityRank` /
   `communityShift`, `authed`, vote-target-id.
2. `<SeasonStatsStrip stats={statsOf(season, show)} />` — the
   `statsOf` helper picks tile values + captions and filters
   empties.
3. `<SeasonEpStrip heat={season.episode_heat}
   caption={season.episode_heat_caption} />` — null when no
   heat array.
4. `<div className="body-grid">` containing `<SeasonTOC
   sections={visibleSectionIds} />`, the `<article>` with six
   numbered sections (collapse when empty), and `<aside
   className="thread">{thread}</aside>`.

`generateMetadata` + JSON-LD ld-season / ld-season-breadcrumb
stay unchanged.

## Tests

**Unit (vitest, colocated `__tests__/`):**

- `SeasonHero.test.tsx` — renders `display_title` with
  `<span class="amp">` accent + literal `<br/>`; falls back to
  plain `title` when `display_title` absent; eyebrow + byline
  optional.
- `SeasonInfoCard.test.tsx` — canon scale fills the correct
  percentage (snapshot a small set: rank=1/47, rank=24/47,
  rank=47/47); community row hidden when count is null.
- `SeasonStatsStrip.test.tsx` — six tiles render when all
  populated; tile collapses when both value + caption empty;
  whole strip hides at <3 populated tiles.
- `SeasonEpStrip.test.tsx` — bar count = `episode_heat.length`;
  hot / med / cold classes map correctly; null heat returns
  `null`.
- `WatchList.test.tsx` — empty array returns `null`; 3-cell and
  4-cell layouts.
- `SeasonTOC.test.tsx` — renders one row per visible section;
  the active row carries `aria-current="true"` for the section
  matching the scroll position (use a mocked `IntersectionObserver`).
- `RankScale.test.tsx` — fill percentage math; marks render
  for top, here, and bottom slots; "↑ here" arrow flips when
  rank is in the bottom third.

**Playwright (`apps/e2e/tests/season-page.spec.ts`):**

- `/shows/survivor/season/20` renders the hero h1 with
  `[data-testid="season-h1"]` and a child
  `span.amp` containing `vs.`.
- Info-card stickiness — scroll the page 800px; the canon-scale
  block stays inside the viewport at desktop, and falls into
  flow at 980px viewport.
- Stats strip carries six `[data-testid="stat-tile"]` tiles on
  S20.
- Episode-rhythm strip renders 14 `[data-testid="ep-bar"]`
  cells with the correct `hot/med/cold` classes from the S20
  frontmatter.
- TOC scrollspy — clicking the `04 What to watch for` TOC link
  scrolls the watch-list into view + marks the link
  `aria-current`.
- Watch-list renders four cards on S20; renders zero on
  `/shows/survivor/season/1` (Borneo — no `watch_list` yet)
  AND the corresponding TOC row hides.
- Thread rail is reachable at 1024px desktop; rail unsticks +
  inlines at 1100px viewport.
- Mobile (375px) — no horizontal scroll; sticky elements
  release; six stat tiles reflow to 2-col.

**Smoke walker.** No new URLs — season pages already live in
`apps/e2e/src/fixtures/canonical-urls.ts` + `page-reads.ts` from
phase 9. Confirm the smoke spec still passes against the new
shell.

## Acceptance

- `/shows/survivor/season/20` renders the design 1:1 against
  `design/tiered.tv · Heroes vs. Villains.html` for desktop +
  mobile, including the `vs.` colored accent, the 6-tile stats
  strip, the 14-cell episode rhythm, the four-item watch list,
  and the sticky info card.
- `/shows/survivor/season/1` (Borneo) renders cleanly without
  the deep editorial block — TOC drops empty sections,
  ep-strip + watch-list + pull-quote hide gracefully, stats
  strip shows the populated tiles only.
- `/shows/dragrace/season/9`, `/shows/top-chef/season/9` and
  the other 14 non-showcase seasons render without console
  errors or layout regressions; the e2e smoke walker passes.
- All deprecated components + their tests removed; no dead
  imports.
- `pnpm verify` green.
- Build-plan check-mark: `[x] Phase 30` with commit hash.
- Plain commit message, no Co-Authored-By, no emoji. Push as
  one atomic act per the standing rules.

## Out of scope

- **No data backfill for the 16 non-showcase seasons.** Their
  deep editorial fields are phase 26's drain. Phase 30 only
  ensures the page renders both populated and unpopulated
  seasons cleanly.
- **No content-curator / ship-content updates.** Both already
  document the new fields (phase 26a).
- **No JSON-LD changes.** The existing Article + BreadcrumbList
  shapes already cover the new surfaces.
- **No new content fields.** If a surface the design shows
  doesn't have a frontmatter mapping (e.g. design's "Canon
  entry by M. Reyes" byline / "Rev. 04 / 2026" / "7 min read"),
  derive it: byline = `season.curator ?? "tiered.tv Editors"`
  (fall back when absent; do **not** add the field to the
  schema), rev-month = `season.last_revised ?? canon's
  `last_revised` ?? null` (hide the chip when null),
  read-time = computed from article word count. None of these
  unblock phase 30 — they degrade.
