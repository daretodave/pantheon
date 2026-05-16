# Phase 33b — Era toolbar + season-page bolt-ons

> Split out of phase 33. Phase 33a shipped the consolidation core
> (route collapse + show-page recomposition + `ShowRanking` +
> same-page `CanonTabSwitch` + wiring + URL contract + e2e). The
> consolidation was diagnosed too large for one cloud tick (cf.
> phase 31 → 31a/b/c; the phase-33 brief "Out of scope / Splitting
> the phase" explicitly sanctions this). 33b is the genuinely
> separable remainder: the era toolbar (one self-contained client
> component) and three orthogonal season-page polish bolt-ons.
>
> Binding references unchanged: `design/tiered.tv · Survivor.html`
> (the `.toolbar` block) and the updated
> `design/tiered.tv · Heroes vs. Villains.html` (the `.toc` block).
> Parent brief: `plan/phases/phase_33_show_consolidation.md` §D +
> §Bolt-ons.

## Gate

None beyond 33a being shipped (it is). The era toolbar mounts
inside the already-shipped canon pane of `ShowRanking`.

## D. Era toolbar (`CanonEraToolbar.tsx`)

Build per `Survivor.html` `.toolbar`, exactly as the parent
brief §D specifies:

- Client component. Chips: **`All N`** (preselected, `.on`,
  always functional) + one chip per `canon.era_bands[]` (`label`,
  keyed by `key`). `.toolbar-mode em` label updates on click.
- Each tier entry carries `data-era="<band key>"`, derived by
  matching the season's `premiere_date` year against
  `era_bands[].range`. Chip click filters entries via a page-root
  class + CSS (same CSS-toggle discipline as the old FilterBar —
  no DOM removal, SEO-safe). "All" clears the filter.
- **Graceful when `era_bands` is absent:** render only the "All"
  chip (functional no-op). No era chips, no empty rail.
- Mount it in `ShowRanking`'s canon pane, above the first tier
  band. Survivor's `canon.md` already carries 5 authored
  `era_bands` so it is functional day one; the other shows show
  "All" only until phase 34 drains their bands (zero further page
  work — the toolbar consumes `era_bands` generically).
- The `.cp-toolbar` CSS is already ported in `src/styles/canon.css`
  (31c). Reconcile against `Survivor.html` `.toolbar` if needed.
- Unit test `CanonEraToolbar.test.tsx`: "All" preselected +
  functional; N era chips from `era_bands`; entry `data-era`
  derivation from `premiere_date`; renders All-only when
  `era_bands` absent. e2e: on `/shows/survivor` the canon pane
  shows ≥1 era chip; "All" preselected; a11y axe extended to the
  toolbar (focus ring, ≥44px hit targets).

## Bolt-ons (season-page polish — independent of the consolidation)

1. **Cagayan `&amp;`.** `/shows/survivor/season/cagayan` renders
   "Brains Brawn **&amp;** Beauty". Source:
   `content/shows/survivor/seasons/28-cagayan.md`
   `display_title` carries HTML (`<em>`, `<br/>`). Root-cause the
   season-header render path (`SeasonHero` h1 / metadata / OG) so
   an entity-bearing `display_title` renders `&` everywhere. Add a
   regression unit test. Acceptable fallback: normalize the one
   file **and** add a `content-check` guard forbidding raw
   entities in plain-text-rendered fields — pick the fix that
   doesn't require ongoing data discipline.
2. **Season stat-strip padding.** `SeasonStatsStrip` tiles sit
   flush to the left edge. Add a `padding-left` matching the
   section gutter rhythm to `.stat` / `.stats-inner` in the season
   CSS. Visual-only; covered by the existing season e2e. Verify at
   375px.
3. **Season TOC current-progress indicator.** Port the updated
   `design/tiered.tv · Heroes vs. Villains.html` `.toc` markup /
   CSS / scrollspy into `SeasonTOC.tsx` + the season CSS + its
   client scrollspy: `.active` treatment (primary-colored
   `.toc-num` + label) + an `[o]`-style current-progress dot.
   Update the component unit test + the season e2e active-item
   assertion.

## Tests

Usual rules — unit + e2e ship with the code. `CanonEraToolbar`
unit + e2e; bolt-on 1 + 3 regression tests; existing season e2e
covers bolt-on 2.

## Acceptance

- `/shows/survivor` canon pane shows the era toolbar with
  Survivor's 5 era chips, "All" preselected and functional; a
  show without `era_bands` shows "All" only, no broken rail.
- Three bolt-ons shipped and verified on the Cagayan /
  Heroes-vs-Villains season pages (desktop + 375px).
- `pnpm verify` green; `pnpm deploy:check` green post-push.
- Build-plan row `[x] Phase 33b` with commit hash. Plain message,
  `Cloud-Run:` trailer, no emoji, no `Co-Authored-By:`.

## Out of scope

Same as parent phase 33: live community-vote aggregates, the
72-hour rank-shift signal, `era_bands` for non-Survivor shows
(phase 34).
