# Phase 33 — Show page consolidation (canon-first)

> The show landing page and the separate Editor's Canon /
> Community Rank pages merge into **one canon-first show page**.
> `/shows/[show]` becomes the entire ranking experience: hero →
> what changed → the ranking (Editor's Canon / Community tabs) →
> themed lists. The two intermediate pages stop existing.
>
> This is a **page-side recomposition**, not a from-scratch
> build. The ranking internals already exist (`src/components/
> canon/*`, shipped phase 31c against the now-deleted
> `design/tiered.tv · Survivor Canon.html`). Phase 33 lifts
> them onto the show page, collapses two routes into one,
> builds the one component 31c specced but never shipped (the
> era toolbar), and rewires every link/contract/fixture that
> pointed at `/canon` or `/community`.
>
> Sibling reference: `plan/phases/phase_31c_page_rebuild.md`.

## Gate (blocking)

Do **not** start until the design drop is committed to `main`:

- `design/tiered.tv · Survivor.html` — the new consolidated
  page (binding reference).
- `design/tiered.tv · Survivor Canon.html` — **deleted** (the
  standalone canon design no longer exists).
- `design/tiered.tv · Heroes vs. Villains.html` — updated TOC
  current-progress indicator (bolt-on 3).
- `design/CLAUDE.md` — file-map line for Survivor.html updated.

If the loop reaches this row and `git log` shows the new
`Survivor.html` is **not** committed (still the pre-consolidation
two-pane-split version), skip to phase 26 and leave this row
`[ ]`. The design drop is the trigger.

## Reference

- `design/tiered.tv · Survivor.html` — **binding**. `body
  [data-view="canon"|"community"]` flips the ranking section;
  `[data-view-pane]` swaps the pane; the `.ranking-intro`
  h2 + meta swap copy via `.can-only` / `.com-only`. Every
  block below maps to a labelled section in this file.
- `design/tiered.tv · Heroes vs. Villains.html` — updated;
  binding for bolt-on 3 (the `.toc` block, lines ~289–307 /
  633–641 / scrollspy ~928–931).
- `design/CLAUDE.md` — visual law. Supreme on conflict.
- `plan/phases/phase_31c_page_rebuild.md` — sibling; the canon
  components this phase recomposes were built there.

## What changes

### A. Route collapse — `/canon` + `/community` → `/shows/[show]`

The two intermediate pages no longer exist as content pages.

1. **Delete** `src/app/shows/[show]/canon/page.tsx`,
   `src/app/shows/[show]/canon/opengraph-image.tsx`,
   `src/app/shows/[show]/community/page.tsx`,
   `src/app/shows/[show]/community/opengraph-image.tsx`.
2. **Replace each with a 308 redirect** (mirror the phase-29
   `/search` retire + phase-31a season digit→slug pattern —
   page-level `redirect()` with `permanent`, not middleware):
   - `/shows/[show]/canon` → `/shows/[show]`
   - `/shows/[show]/community` → `/shows/[show]?view=community`
   `?view=` is the SSR-visible default-tab mechanism (it
   survives to the server; a hash does not). It reuses the
   `?view=` precedent phase 31c established on the show-home
   FilterBar. Hash (`#canon` / `#community`) is progressive
   enhancement layered on top by the tab client (see D).
3. Both redirects keep `generateStaticParams` over all show
   slugs so every show's old URLs 308 cleanly (no 404).

### B. Show page recomposition (`src/app/shows/[show]/page.tsx`)

New top-to-bottom structure, matching `Survivor.html`:

1. `<ShowHero>` — unchanged shell. **One change:** the second
   hero stat flips from "on the air" (`computeYearsOnAir`) to
   **"Canon last revised"** = the year of `canon.last_revised`
   (fallback: omit the stat if no canon). Matches design
   `.h-stat` "2026 / Canon last revised".
3. `<ShiftsRow>` — unchanged. Stays in its honest empty state
   ("No shifts this week.") — the 72-hour rank-shift signal is
   still unwired and explicitly **out of scope** (see below).
4. **`<ShowRanking>`** (new composition, see C) — the
   `.ranking` section: `.ranking-intro` + sticky `.tabs` +
   canon pane + community pane.
5. `<FeaturedThemes>` — unchanged (themed-lists section).
6. **Remove `<ShowSplit>`** from the page entirely — the
   Canon/Community two-button split is replaced by the in-page
   tabs. Delete the component + its tests if no other consumer
   (grep first).

`data-view` is seeded server-side from `?view=` (`'community'`
when `?view=community`, else `'canon'`). Both panes are
SSR-rendered; visibility is a CSS toggle keyed off
`body[data-view]` / `[data-view-pane]` — **no JS-gated
content** (SEO: both rankings must be in the static HTML).
JSON-LD for both ItemLists is emitted server-side regardless
of active tab.

### C. `<ShowRanking>` — recompose the canon internals

`CanonPageShell` (phase 31c) already renders methodology +
tier bands + community strip/movers/weekly/list under
`data-view-pane`. It is **route-coupled** (takes `canonHref`/
`communityHref`, owns `CanonHead`/`CanonStats`). Refactor:

1. **Rename** `src/components/canon/CanonPageShell.tsx` →
   `ShowRanking.tsx`. Drop `CanonHead` + `CanonStats` (the
   show hero replaces them). Delete `CanonHead.tsx` /
   `CanonStats.tsx` + tests if unused elsewhere (grep).
2. Add the **`.ranking-intro`** block — `<h2>` with
   `.can-only` ("The canon, top to bottom.") + `.com-only`
   ("What N readers think.") spans, and a `.meta` paragraph
   with the same dual spans. Copy is per the design; the
   community count/recompute line reads from
   `community.source` (graceful when no live votes — see
   Out of scope). Server-rendered both; CSS shows/hides by
   `body[data-view]`.
3. **Rework `CanonTabSwitch.tsx`** — today it navigates
   between `/canon` and `/community` routes. New behavior
   (per `Survivor.html` script): same-page toggle —
   `document.body.dataset.view = view`, toggle `.on` +
   `aria-selected`, `history.replaceState` the `?view=`
   param (and `#canon`/`#community` hash), read `?view=` /
   `location.hash` on mount. No route navigation. Keep it the
   only `'use client'` island in the ranking.
4. Reused **unchanged**: `CanonMethodology`, `CanonTierBand`
   (+ `CanonHeroEntries` / `CanonMidEntries` /
   `CanonCompactEntries` / `CanonTailEntries`),
   `CommunityLiveStrip`, `CommunityMovers`,
   `CommunityWeeklyQuestionCard`, `CommunityRankList`,
   `buildTierBands`, `<Bullet>`, `<ShieldBadge>`. Reconcile
   any markup/CSS delta between the new `Survivor.html` and
   what 31c shipped (e.g. `.he-aside` community mini-cards,
   `.tab-cap`, `.ranking-intro`) — the new file wins.

### D. Era toolbar (the one 31c component never shipped)

`CanonEraToolbar.tsx` was specced in phase 31c §D but is
**not in the codebase**. Build it now, per `Survivor.html`
`.toolbar`:

- Client component. Chips: **`All N`** (preselected, `.on`,
  always functional) + one chip per `canon.era_bands[]`
  (`label`, keyed by `key`). `.toolbar-mode em` label updates
  on click.
- Each tier entry carries `data-era="<band key>"`, derived by
  matching the season's `premiere_date` year against
  `era_bands[].range`. Chip click filters entries via a
  page-root class + CSS (same CSS-toggle discipline as the
  FilterBar — no DOM removal, SEO-safe). "All" clears the
  filter.
- **Graceful when `era_bands` is absent:** render the toolbar
  with **only the "All" chip** (functional no-op — everything
  already shows). No era chips, no empty rail.

> **Note for the approver (data already partly exists):**
> Survivor's `canon.md` *already* carries 5 authored
> `era_bands` (pioneer/classic/high-strategy/twist-heavy/
> new-era) and the schema already supports the field
> (`era_bands: z.array(eraBandSchema).max(6).optional()`).
> So this toolbar is **functional for Survivor on day one**
> and degrades to "All only" for the 11 shows that lack
> bands. Phase 34 drains `era_bands` into those shows; their
> chips then light up with zero further page work. This is
> the gold-standard→drain pattern (cf. Heroes vs. Villains
> for seasons). Building the toolbar live-but-degrading is
> strictly better than a deliberately-inert one and still
> honours "All preselected, works, data comes later."

### E. CSS

The 31c port already lives in `src/styles/canon.css`.
Reconcile it against the new `Survivor.html`: add `.ranking`,
`.ranking-intro` (+ `.can-only`/`.com-only` rules), the
sticky `.tabs` / `.tab` / `.tab-cap` block, `.toolbar` /
`.chip` / `.toolbar-mode`, and any delta in the tier /
community-list rules. Keep the show-page wrapper classes.

**Reminder — never write a literal `*/` inside a CSS comment
body** (phase-29 postmortem `0a757ff`). After the port:
`grep -n "\*/.*[^/]" src/styles/canon.css` must return no
surprising hits inside `/* … */`.

### F. Wiring (every `/canon` + `/community` reference)

1. **Season page** (`src/app/shows/[show]/season/[slug]/
   page.tsx`) — repoint **every** canon/community href, named
   explicitly so none is missed:
   - **The `AppearsInList` "Also appears in → Editor's Canon"
     row** at `season/[slug]/page.tsx:182` (`href:
     /shows/${slug}/canon`). This is the row a reader sees at
     the bottom of e.g. `/shows/survivor/season/gabon`.
     Repoint to `/shows/[show]` (canon is the default view).
     If cheap, anchor to the season's canon entry; do not
     over-engineer it — a clean landing on the consolidated
     page is the bar. Keep the row (the season *is* ranked in
     the canon; the cross-ref still makes sense).
   - Any "see the full canon" / "community top 10" CTA →
     `/shows/[show]` / `/shows/[show]?view=community`.
   - The vote-question fallback wording ("community top 10",
     set 31c) is unchanged.
2. **Home, search index, themed-list cross-links, `/u/
   [handle]`** — grep for `/canon` and `/community` hrefs;
   repoint to the show page (+ `?view=community` where the
   intent was the community pane).
3. **JSON-LD** — the canon `ItemList` and community
   `ItemList` (previously emitted by the deleted pages) are
   now emitted from `/shows/[show]` server-side (both, always).
   The `BreadcrumbList` loses the `Editor's Canon` /
   `Community Rank` leaf — trail is `Tiers / {show}`.
4. **Sitemap** (`app/sitemap.ts`) — drop `/shows/[show]/canon`
   and `/shows/[show]/community` entries.
5. **OG / metadata accuracy review (explicit acceptance
   item).** `/shows/[show]` `generateMetadata` +
   `opengraph-image.tsx` must describe the *consolidated*
   page (canon + live community in one), not the old
   landing-only framing. Verify the rendered OG PNG copy is
   accurate for Survivor before sign-off. The two deleted OG
   routes are gone (A).
6. **No-dead-links guarantee (belt + suspenders + tested).**
   This phase must not strand a single internal link.
   - *Belt:* the 308 redirects in §A mean any
     `/shows/[show]/canon` or `/community` link that slips
     through repointing still resolves (308 → consolidated
     page) — **no 404, ever**, including external inbound
     links and stale bookmarks.
   - *Suspenders:* a repo-wide grep for
     `/shows/.*?/(canon|community)` hrefs is part of the
     work; every internal occurrence is repointed to the
     canonical consolidated URL so internal navigation never
     even takes the redirect hop. The full enumerated set
     today: `ShowSplit` (removed in §B), the season
     `AppearsInList` row (F.1), `season/[slug]/page.tsx:182`,
     plus any home / search-index / `/u/[handle]` /
     themed-list occurrences (grep is authoritative — treat
     the list as a floor, not a ceiling).
   - *Tested:* add an e2e link-integrity assertion (see
     Tests) so "no dead links" is a gate, not a hope.

### G. URL contract + e2e (the locked-surface change)

The URL contract in `bearings.md` and `spec.md` lists
`/shows/[show]/canon` and `/shows/[show]/community` as locked
permanent surfaces. This phase is **explicitly authorised by
the user** to change them.

1. Update the URL-contract block in **both** `plan/bearings.md`
   and `spec.md` in the same commit: mark `/canon` and
   `/community` as `308 → /shows/[show]` (note: consolidated
   into the show page, `?view=community` for the community
   default). Add a one-line dated note ("Phase 33 — canon +
   community consolidated into the show page").
2. **e2e fixtures** (usual rules — every URL change pays the
   harness tax):
   - New redirect fixture mirroring
     `apps/e2e/src/fixtures/redirect-fixtures.ts` — one
     `/shows/<show>/canon` and one `/shows/<show>/community`
     row per show, asserting 308 + `Location`.
   - `apps/e2e/src/fixtures/canonical-urls.ts` — stop
     emitting `/canon` + `/community` as 200 page rows.
   - `apps/e2e/src/fixtures/page-reads.ts` — drop the
     `/shows/[show]/canon` + `/community` page-read entries;
     extend the `/shows/[show]` entry to assert: tabs
     present, canon pane SSR'd, community pane SSR'd, era
     toolbar present (≥ "All"), `?view=community` seeds the
     community pane, mobile 375 no horizontal scroll.
   - Rework `apps/e2e/tests/canon-page.spec.ts` +
     `community-page.spec.ts` → assert the 308s, then assert
     the consolidated show page renders both panes + tab
     toggle + era toolbar (Survivor: chips present;
     `?view=community` deep-link lands on community).
   - **Link-integrity crawl.** On `/shows/survivor` and a
     representative season page (`/shows/survivor/season/
     gabon` — the exact page the user flagged, which carries
     the "Also appears in → Editor's Canon" row), collect
     every internal `<a href>` and assert each resolves
     `200` (or an intended `308` whose target is `200`) —
     **zero 404s**, and the season "Also appears in" canon
     row lands on the consolidated page. Keep it a small,
     fast spec, not a whole-site spider.

## Bolt-ons (small, season-page polish — ship in this commit)

1. **Cagayan `&amp;`.** `https://tiered.tv/shows/survivor/
   season/cagayan` renders "Brains Brawn **&amp;** Beauty".
   Source: `content/shows/survivor/seasons/28-cagayan.md`
   `display_title: "Cagayan: <em>Brains</em><br/>Brawn &amp;
   Beauty"`. The field carries HTML (`<em>`, `<br/>`), so a
   correctly HTML-rendered surface shows `&`; a literal
   `&amp;` means a surface renders `display_title` as escaped
   plain text. **Root-cause the render path** on the season
   header (`SeasonHero` h1 / metadata / OG) and fix it so an
   entity-bearing `display_title` renders `&` everywhere.
   Add a regression unit test (an `&amp;`-bearing
   `display_title` → renders `&`, not `&amp;`). Acceptable
   fallback if the field is plain-text by contract: normalize
   the one file (`&amp;`→`&`) **and** add a `content-check`
   guard forbidding raw entities in plain-text-rendered
   fields. Pick the fix that doesn't require ongoing data
   discipline if both are viable.
2. **Season stat-strip padding.** `SeasonStatsStrip` tiles
   ("Premiered / Feb 26, 2014 / CBS · Wednesday 8/7c", and
   likewise Episodes / Format / Cast size / Host) sit flush
   to the left edge. Add a reasonable `padding-left` (match
   the section gutter rhythm) to `.stat` / `.stats-inner` in
   the season CSS. Visual-only; covered by the existing
   season e2e (no new URL). Verify at 375px.
3. **Season TOC current-progress indicator.** The updated
   `design/tiered.tv · Heroes vs. Villains.html` `.toc`
   removes the old "you are here" affordance in favour of the
   `.active` treatment (primary-colored `.toc-num` + label)
   plus an `[o]`-style current-progress dot. Port the updated
   `.toc` markup / CSS / scrollspy verbatim into
   `SeasonTOC.tsx` + the season CSS + its client scrollspy.
   Update the component's unit test + the season e2e
   assertion for the active item.

## Tests (usual rules — unit + e2e ship with the code)

**Unit (vitest):**
- `ShowRanking.test.tsx` — `?view=community` seeds
  `data-view="community"`; both panes render server-side;
  `.ranking-intro` swaps copy by view.
- `CanonTabSwitch.test.tsx` — rewritten: same-page toggle
  mutates `body[data-view]` + `?view=`/hash; no navigation;
  mount reads `?view=` then `location.hash`.
- `CanonEraToolbar.test.tsx` — "All" preselected + functional;
  N era chips from `era_bands`; entry `data-era` derivation
  from `premiere_date`; **renders All-only when `era_bands`
  absent**.
- Redirect unit coverage for the two collapsed routes.
- Bolt-on regression tests (1 + 3 above).

**Playwright:** as enumerated in G.2. Plus a11y axe gate
(phase 18) extended to the tab control + era toolbar (focus
ring, `aria-selected`, ≥44px hit targets).

## Acceptance

- `/shows/survivor` renders the new consolidated page 1:1
  vs. `design/tiered.tv · Survivor.html` (desktop + 375px):
  hero (with "Canon last revised" stat) → what changed
  (honest empty) → ranking (intro + sticky tabs + canon pane
  [methodology, era toolbar with Survivor's 5 era chips, Tier
  S/A/B/C] + community pane [live strip, weekly question, full
  table]) → themed lists.
- Tab toggle flips panes with no navigation; `?view=`
  persists; deep-link `?view=community` + old `/community`
  308 both land on the community pane.
- `/shows/survivor/canon` 308 → `/shows/survivor`;
  `/shows/survivor/community` 308 → `/shows/survivor?view=community`.
  Same for every show.
- Era toolbar: Survivor chips functional; a show without
  `era_bands` shows "All" only, no broken rail.
- URL contract updated in `bearings.md` + `spec.md`;
  sitemap + canonical-urls + page-reads + redirect fixtures
  consistent; smoke walker green.
- **No dead links.** The season "Also appears in → Editor's
  Canon" row (and every other internal canon/community link)
  resolves to the consolidated page; the link-integrity
  crawl is green; nothing 404s.
- OG/meta for `/shows/[show]` reviewed and accurate for the
  consolidated page (sign-off item).
- Three bolt-ons shipped and verified on the Cagayan /
  Heroes-vs-Villains season pages.
- `pnpm verify` green; `pnpm deploy:check` green post-push.
- Build-plan row `[x] Phase 33` with commit hash, same
  commit. Plain message, `Cloud-Run:` trailer, no emoji,
  no `Co-Authored-By:`.

## Out of scope (do not pull in)

- **Live community-vote aggregates.** `computeCommunityRank`
  returns `{rank, season, tag}` only — no approval %, 7-day
  trend, or vote counts. The community list renders those
  cells gracefully absent (the 31c `CommunityRankList`
  contract). A future `/ship-data` phase wires real vote
  aggregates. **Not 33, not 34.**
- **The 72-hour rank-shift signal.** `ShiftsRow` stays in its
  honest empty state. Separate future candidate.
- **`era_bands` for non-Survivor shows.** That is **phase
  34** (auto-draining, after phase 26). Phase 33 only builds
  the consuming toolbar + ships Survivor (already authored).
- **Splitting the phase.** Intended as one cloud tick. If the
  loop diagnoses it as too large (cf. phase 31 → 31a/b/c),
  it may split A+B+C (route collapse + recompose) from D
  (era toolbar) + bolt-ons, but the default is one tick.
