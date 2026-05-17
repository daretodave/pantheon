# 01 — Build plan

> Style guardrails for every phase below. **Always ship unit
> tests alongside code — never "add tests later".** Break work
> into small, focused components in folders; never jam-pack a
> single file. Pure helpers go in their own `.ts` modules with
> their own tests; React components live in folders with
> sub-section components and a colocated `__tests__/`. Prefer 5
> small files with clear names over 1 dense file. **Every new
> URL contributes to `apps/e2e/src/fixtures/canonical-urls.ts`
> AND `page-reads.ts`** so the smoke walker stays exhaustive.
> The verify gate enforces all of this; reviewers and the next
> loop tick depend on it.

## Status (at-a-glance)

`/march`, `/ship-a-phase`, and (transitively) `/loop` read this
block to find the next phase. Format: `[ ]` pending → `[WIP]`
in flight → `[x]` shipped (with commit hash). Tick in this file
in the same commit that ships the phase.

**Substrate (phases 1–4):**
<!-- Phase 4a slots between facade primitives (phase 4) and the first show
     family (phase 5). It ports the composition system the user already
     designed in design/compositions/screens.jsx + screens.css — the
     hero/split/season-card/season-shell page shells that phase 6 and
     phase 9 then consume. Without it, those phases re-derive layout
     from sibling pages and the design lift gets lost. -->

- [x] Phase 1 — Bootstrap (Next.js 15 App Router + TypeScript strict + Tailwind reading from `design/tokens.json` → CSS vars + Vitest + Playwright skeleton + Biome + Vercel Analytics gated on `DISABLE_ANALYTICS=1` + favicon pipeline + placeholder `public/sigil.svg` + `pnpm verify` runs clean + first deploy green at `tiered.tv`) — a227f74
- [x] Phase 2 — Content layer (`src/content/loaders.ts` + Zod schemas for show / season / theme / canon, `pnpm content:check` validate script wired into verify, 1 sample show seeded — Survivor — proving the loader pipeline) — 037bcab
- [x] Phase 3 — URL contract + hermetic e2e infrastructure + `mint-e2e-cookie.mjs` (every route from bearings exists with stub or real page; **/about, /terms, /privacy render real content from `content/legal/*.md` markdown**; `src/lib/seo.ts` with `buildMetadata` + JSON-LD + `canonicalUrl`; `app/sitemap.ts`; `app/robots.ts`; **`apps/e2e/src/fixtures/canonical-urls.ts` derived programmatically from content loaders**; **`apps/e2e/src/fixtures/page-reads.ts`**; **smoke walker over every canonical URL**; **mobile spec template at 375px**; **`scripts/mint-e2e-cookie.mjs` ports the fibered pattern — password-realm grant + JWE encryption + cache + `.env` upsert**; **`apps/e2e/src/auth.ts` reads the cache + builds Playwright storageState**; **`pnpm verify` runs e2e against `next start` on `:4173` as a hard gate**; **`DISABLE_ANALYTICS=1` set in `playwright.config.ts`**; first authed spec example) — 13f051f
- [x] Phase 4 — tiered.tv facade primitives (SVG components for `<Column>`, `<Pediment>`, `<Frieze>`, `<Ornament>` reading from `design/compositions/sigils.jsx` + `design/tokens.json`; sigil-from-facade derive helper that crops pediment + center column to 320×320; per-show palette CSS-var injector via `[data-show=<slug>]` wrapper; unit tests for the crop math + the palette injector; e2e snapshot of all four primitives in isolation) — 3747750
- [x] Phase 4a — Composition primitives (port `design/compositions/screens.css` to `src/styles/screens.css` and **adopt the full rich-background show/season layouts from `design/compositions/screens.jsx`** as the layout source of truth. Build React primitives consumed by phases 6/7/8/9/14/16: `<ShowHero>` (warm background + facade art + crumb + title + lede + ShieldBadge), `<ShowSplit>` (canon/community two-button split), `<SeasonCard>` (rank + title + tag + season # + rank-shift pill), `<SeasonShell>` (two-column main + sticky aside), `<SeasonHead>` (crumb + sigil + rank row), `<RankShiftPill>` (delta + sentiment color), `<ShieldBadge>` (the spoiler-promise pill), `<TopNavTinted>` (header that takes on per-show palette). Per-show palette wired via `[data-show=<slug>]` CSS-var injection — `--show-paper`, `--show-ink`, `--show-primary` per the SHOWS map in screens.jsx. **Mobile reflow contract preserved.** Unit tests for every primitive + e2e renders a `/internal/composition-demo` page (gated behind a build-time flag so it doesn't ship to prod) that snapshots Survivor in all three compositions. After this phase: phase 6's brief becomes "wire data + JSON-LD into `<ShowHero>` + `<ShowSplit>` + a `<SeasonCard>` grid" rather than "design the show page from scratch.") — a9b05c4

**First show families (phases 5–9):**
- [x] Phase 5 — Three pioneer show facades (Survivor, Top Chef, RuPaul's Drag Race — full `facade.svg` + derived `sigil.svg` + 3 ornaments per show, committed under `public/shows/<slug>/`; matching `content/shows/<slug>.md` frontmatter with palette; brander sub-agent generates the SVGs; e2e renders all three show wrappers and snapshot-tests the palette swap) — 32cc220
- [x] Phase 6 — Show home page (canonical sibling — `/shows/[show]`) — facade hero + season grid + canon/community split + per-show palette wrap + JSON-LD CollectionPage + BreadcrumbList. **Every later show home mirrors this.** Detailed brief: `phase_6_show_home.md`. — c0ef90a
- [x] Phase 7 — Editor's Canon page (`/shows/[show]/canon`) — ranked list with rich blurbs, per-rank rationale rendered from `canon.md`, JSON-LD ItemList, sitemap entries — e23d2f4
- [x] Phase 8 — Community Rank page (`/shows/[show]/community`) — vote-driven order computed from Supabase `compute_weighted_rank()` RPC, ISR'd, "be the first to vote" empty state mirrors canon order — 3dcd190
- [x] Phase 9 — Single season page (canonical sibling for season pages — `/shows/[show]/season/[n]`) — blurb + vote pair + comment thread shell (no backend yet — phase 11) + 72-hour rank pill if `canonical_position` shifted recently. Detailed brief: `phase_9_season_page.md`. — c8119bd

**Auth + dynamic backends (phases 10–13):**
- [x] Phase 10 — Auth integration (Auth0 magic-link via `@auth0/nextjs-auth0` v4 + Next.js middleware that issues HttpOnly anon-guest cookie on first request + Supabase `sessions` table + `/sign-in` + `/u/[handle]` shell + claim-anon-on-login flow that calls `claim_anon_session()` RPC) — ab5c90f
- [x] Phase 11 — Vote backend (Supabase `votes` + `users` migrations land + RLS policies + `POST /api/vote` server action + new-account weight ramp + brigade rate-limits per bearings + e2e covers anon vote → sign-in → vote-claim flow) — 47a11ee
- [x] Phase 12 — Comment backend (Supabase `comments` + `flags` migrations + RLS + `POST /api/comment` with OpenAI `gpt-5-mini` pre-filter against the structured-output schema in `setup/06_openai.md` Section E + new-account 5-comment hold + AI-decision audit logging + e2e covers happy path + spoiler-blocked + flag flow) — 9dbba68
- [x] Phase 13 — Moderation queue page `/mod` (RBAC-gated via Auth0 `mod` role + drains `comments` where `status in ('pending','hidden')` + drains flag queue + writes `mod_actions` rows for every action + e2e covers a second test user with `mod` role for the gate test) — 1f2f669

**Cross-cutting (phases 14–18):**
- [x] Phase 14 — Themed lists (`/themes` + `/themes/[theme]` + `content/themes/<slug>.md` schema + cross-show ranked entries + ItemList JSON-LD + sitemap) — 330113f
- [x] Phase 15 — Search (`src/lib/search.ts` Supabase fulltext over content/shows + content/themes + season blurbs + `/search` page + header search affordance + e2e walks ≥3 representative queries) — 72b53ae
- [x] Phase 16 — Home page hero (`/` — featured show pediment teaser + featured rankings + themed list teaser + the cold-search promise: "the seasons, ranked. no spoilers." + `<SpeedInsights />` mounted) — cbe2b3f
- [x] Phase 17 — SEO meta + sitemaps + structured data (per-route `opengraph-image.tsx` deriving from facade; FAQ JSON-LD on /about; tighten ItemList shapes; sitemap completeness e2e; OG image rendered to PNG via `scripts/build-icons.mjs` extension) — c5a8fbc
- [x] Phase 18 — Performance + a11y polish (`@axe-core/playwright` + `apps/e2e/tests/a11y.spec.ts` covering 7 canonical pages desktop + 3 mobile WCAG 2.1 AA critical-only hard gate; skip-to-main-content link; `id="main"` on all routes; raw-`<img>` discipline gate; `pnpm size` script gating homepage gzipped JS at 250 KB) — 917291b

**External-signal wiring (phase 19):**
- [x] Phase 19 — `/critique` + `/triage` wiring (reader sub-agent walks live site with anon AND authed cookie passes; findings tagged `anon:`/`authed:`; triage skill enabled with the 13 labels; loop-issue mirror script; `/march` Step 3a starts dispatching to triage when unlabeled issues exist) — e3bc4e5

**Design re-grounding (phases 19a–19e) — May 2026 pivot:**

> The May 2026 facade grammar (column / pediment / frieze /
> ornament + derived sigil) was prototyped and rejected — it
> reads as AI-generated. The new visual law is **color +
> typography only**, with a single shared brand mark. See
> `design/CLAUDE.md`. These five phases scorch the per-show
> SVG system and rebuild every page against the new spec
> (`design/tiered.tv · {Brand, Survivor, Heroes vs. Villains,
> Show Identity, Compositions}.html`). Ship in order — 19a
> first (removes the old system), 19b through 19e in any
> order after.

- [x] Phase 19a — Scorched earth (rip out `src/components/facade/`, `src/lib/facade/`, `ShowFacadeArt`, `ShowSigilArt`, `/internal/facade-demo`, every `public/shows/<slug>/*.svg`, every facade unit test, every `show-facades.spec.ts` e2e. Add `<Bullet color size>` primitive at `src/components/atoms/Bullet.tsx`. Update show schema to the seven-field contract per `design/CLAUDE.md` — drop `hero_motifs`, `network`, `format`, `first_aired`; add `seasons` int + `blurb` required. Migrate three existing shows. Verify gate green.) — 34b5da3
- [x] Phase 19b — Chrome + brand mark + bounded layout (new `<Header>` and `<Footer>` per `design/tiered.tv · Brand.html`: shared brand-mark SVG `<svg viewBox="0 0 28 28">` + serif "tiered.tv" wordmark; header has Shows / Lists / About + Search icon + Sign in; footer has wordmark + serif italic promise + three link columns + theme toggle + drops "an experiment". Page-width contract: non-show routes get a `<Wrap max-width:1240px>` container; show + season routes stay full-bleed. Reduced-motion contract preserved. Brand-mark source `public/sigil.svg` already matches the canonical viewBox 28 spec; favicon re-bake deferred to a brander pass.) — ce9db7b
- [x] Phase 19c — Show + season pages to spec (rebuild `/shows/[show]` against `design/tiered.tv · Survivor.html`: full-bleed, chrome tints to show palette, `<ShowHero>` with wordmark + meta column + tagline + stats + shield, `<ShowSplit>` Canon/Community pair, season grid using the new `<SeasonCard>`. Rebuild `/shows/[show]/season/[n]` against `design/tiered.tv · Heroes vs. Villains.html`: full-bleed tinted, eyebrow + h1 + rank row + body + vote block + adjacent prev/next + "Also appears in" themed-list row group + sticky thread aside on desktop. Content authoring expands: seasons need a lede + body paragraphs. Per-show palette delivered via `[data-show=<slug>]` wrapper + tinted layout segment.) — see `phase_19c_show_and_season_pages.md`
- [x] Phase 19d — Interaction primitives to spec (rewrite `<VotePair>`, `<CommentInput>`, `<RankShiftPill>` as exact ports of `design/compositions/interactions.jsx` — VotePair pill with flash + reduced-motion fade, CommentInput collapsed→open with serif placeholder + spoiler-phrase detection + warn border + "✱ flag" tooltip + post button gated, RankShiftPill arrow + delta + sentiment-tinted background. RankShiftPill is **built but not yet rendered in the product** — component + tests + Storybook-style demo route, but no production placement until a future phase wires the 72-hour shift signal. VotePair wires to existing `/api/vote`; CommentInput wires to existing `/api/comment`.) — 7d0ef29
- [x] Phase 19e — Homepage to spec (rebuild `/` against `HomeScreen` in `design/compositions/screens.jsx` + the home section of `design/tiered.tv · Compositions.html`: split hero — left cover = featured show paper + huge serif wordmark + blurb + "go to Survivor" pill, right copy = "tiered.tv · est. 2026" eyebrow + "The seasons, ranked. *no spoilers.*" title + intro blurb + Browse all shows / How it works actions. Tiers grid: 3-up `<ShowTile>` cards, each tinted to show palette, with bullet + name + blurb + meta. Themed lists rail: 1-column list of `<ListTile>` (sentiment dot + title + meta + arrow). No featured "Per-show facade" anything — color does it.) — 5b648d5

**Lists rebuild (19f–19h) — match `design/tiered.tv · Lists.html` + `design/tiered.tv · Best Premieres.html`:**

> The current `/themes` and `/themes/[theme]` pages predate the May 2026
> design pivot. The new design adds categories, featured tags, a curator
> byline, per-entry titles, and adjacent-list cross-links. 19f lands the
> schema + content-curator guidance (blocking); 19g rebuilds the overview;
> 19h rebuilds the detail. Ship in order — 19f first, 19g and 19h in
> either order after.

- [x] Phase 19f — Themed-list schema refresh + curator updates (Zod schema gains `category` enum [tone/craft/era/single], `tagline`, `sentiment`, `status`, `curator`, `last_revised`, `featured`, `related`, optional `era_range`; per-entry adds `title` + optional `season_label`; entry cap 15→30. New loader helpers — `getFeaturedThemes`, `getThemesByCategory`, `getShowsForTheme`, `getRelatedThemes`, `getThemeStats`. Migrate the two existing themes via `content-curator`. Update `.claude/agents/content-curator.md` + `skills/ship-content.md` Rule 3 so future content ticks tag data correctly. No URL or UI changes; just data + agent guidance.) — see `phase_19f_lists_schema.md` — 25b7677
- [x] Phase 19g — Lists overview to spec (rebuild `/themes` against `design/tiered.tv · Lists.html`: bounded 1240px `<Wrap>`, stats hero, 5-chip filter bar, 3-card Featured row [first card `.big`], category-grouped All-Lists section with row stacks. Server-static + CSS-toggle filter via `data-active-filter` for SEO. New components under `src/components/lists/`. No tinted chrome — `/themes` uses ceremonial gold; per-show bullets carry the palette accents.) — see `phase_19g_lists_overview.md` — 6aca8d0
- [x] Phase 19h — List detail page to spec (rebuild `/themes/[theme]` against `design/tiered.tv · Best Premieres.html`: bounded 1100px `<Wrap width="narrow">`, tall hero with crumb [bullet stack + Lists / title] + h1 + serif italic tagline with `<b>` emphasis + 4-cell meta strip [Entries / Spans / Curated / Revised] + tools row [Save/Share/Suggest stubs + Shield badge]. Ranked entry stack with rank-mono + show-palette bullet + show-name/season-label + entry title + entry blurb. Adjacent-lists section using `getRelatedThemes` with same-category fallback. JSON-LD adds `author` + `dateModified`.) — see `phase_19h_list_detail.md` — ec07a99

**Content velocity endgame (phases 20+):**
- [x] Phase 20 — `/ship-content` skill landed + first show backfill (Amazing Race, Big Brother — `content-curator` per show; bearings Rule 1 quota check goes live. **No facade work** — color + type only per `design/CLAUDE.md`. The show frontmatter is the seven-field contract from 19a.) — 495c9e8
- [x] Phase 21 — Show backfill round 2 (Bachelor, Bachelorette, Traitors) — 5ba35f1
- [x] Phase 22 — Show backfill round 3 (Love Island US, Love Island UK, Bake Off, Project Runway, The Challenge — completes the 12-show launch quota per bearings Rule 1) — 09f1a87
- [x] Phase 23 — Themed lists round 1 (best premieres, best finales, best post-merge runs, best returnee seasons, best newbie casts — 5 themes drains bearings Rule 3 to ≥5/10) — 0001655
- [x] Phase 24 — Themed lists round 2 (best villain editing, best comeback seasons, best location reveals, best reunion specials, best non-winning runs — 5 lists, total 12, Rule 3 quota cleared) — 0f03ff6
- [x] Phase 25 — Canon iteration (refresh canon rationales for the first 3 shows after critique passes file substantive feedback. **Brand mark refresh is not needed** — 19b already regenerated the favicon set + brand-mark SVG from the canonical spec.) — see `phase_25_canon_iteration.md`
- [x] Phase 26a — Season data-shape evolution + existing-content backfill (local, session-shipped). Schema gains the editorial block consumed by `design/tiered.tv · Heroes vs. Villains.html`: `display_title` (with `<em>` colored-accent markup + `<br/>`), stats-strip captions, `format_summary`/`format_caption`, `cast_size`+caption, `host_caption`, `episode_heat` array, `episode_heat_caption`, `watch_list` (3-6 spoiler-safe pointers). All 17 existing season files backfilled with public-record stats; Heroes vs. Villains is the gold-standard reference. Content-curator + ship-content briefs document the new fields. Detailed brief: `phase_26a_season_data_shape.md`.
- [x] Phase 27 — Homepage rework to spec (rebuild `/` against `design/tiered.tv · Home.html`: fluid hero, hero stat strip, 3-up featured shows + sub-row + 6 compact tiles, dual-rank callout, themed lists stacked. Featured show already data-driven via `getFeaturedShow()`. Detailed brief: `phase_27_home_rework.md`.) — ec7187e
- [x] Phase 28 — `/shows` tier-list page to spec (rebuild against `design/tiered.tv · All Shows.html`: tier-grouped (S/A/B) sections with tier-head + glyph + count; tile variants per tier — tall, regular, small with in-progress status pill. Reads new `tier` frontmatter field. Detailed brief: `phase_28_shows_tier_list.md`.) — a6710c3
- [x] Phase 29 — Inline search overlay; retire `/search` (cmd+K modal with filter chips + keyboard nav, mounted globally via chrome layout. Header search trigger opens the overlay instead of routing. `/search` becomes a 308 to `/`. Detailed brief: `phase_29_inline_search.md`.)
- [x] Phase 30 — Season detail page rework to spec. — 1963b11 Rebuild `/shows/[show]/season/[n]` against `design/tiered.tv · Heroes vs. Villains.html`: hero with sticky info-card (canon scale + community + vote + shield), `display_title` with `<em>` colored accent, 6-tile stats strip, 14-cell episode-heat rhythm bar, 3-col body grid (sticky TOC + article + sticky thread), watch-list card, numbered sections (01 The take / 02 Shape / 03 Where it sits / 04 What to watch for / 05 Adjacent / 06 Appears in). **Pre-flight confirmed:** schema (26a), gold-standard content (Survivor S20), and generative skills (content-curator + ship-content Rule 2) are all already in place — phase 30 is page-side only. Renders gracefully when the deep editorial block (`watch_list`, `episode_heat`, `pull`, `lede`, extended `body`) is absent so non-showcase seasons stay clean while phase 26 drains them. **Sits ahead of phase 26 in the queue** so the cloud loop sees the new page as its content drain ships season files into it. Detailed brief: `phase_30_season_page_rework.md`.
<!-- Phase 31 was split into 31a / 31b / 31c after the cloud loop diagnosed
     the monolith as too large for a single tick (issue #44). The three
     sub-phases ship the same end product — every seeded season ranked,
     every show with seasons carrying a canon, the always-working rule
     enforced by content-check, the unified canon/community page rebuilt
     to the new design, and season URLs slug-canonical. They land in
     order: 31a (code-only, one tick) → 31b (canon data drain, multi-tick
     like phase 26) → 31c (page rebuild, one tick). The original brief at
     `plan/phases/phase_31_canon_rank_unification.md` stays as the
     reference document tying the three together. Phase 26 stays parked
     behind 31c. -->
- [x] Phase 31a — Schema, content-check invariants (lax mode), season URL slugs, content-curator + ship-content rewrites. Pure code; one cloud tick. Adds the canon frontmatter block (editor / last_revised / methodology / tier blurbs / weekly_question / era_bands) + canon entry fields (tag / slot_argument / community_rank_hint) — all optional. Adds the lax-mode invariant in `scripts/content-check.ts` (fails on mismatch + dangling refs; tolerant of absence). Renames `/shows/[show]/season/[n]` → `[slug]` with a page-level 308 redirect from the digit form (cleaner than middleware — no edge-runtime / Node-runtime tradeoff). Locks the always-working rule + filename-as-slug convention in `.claude/agents/content-curator.md` + `skills/ship-content.md` (Rule 1 ships a populated canon with the first season; Rule 2 rebases canon ranks on every batch). Detailed brief: `phase_31a_schema_invariants_slugs.md`.
- [x] Phase 31b — Canon data drain (multi-tick). Per-show ticks like phase 26: each cloud tick picks one show, authors or extends its `canon.md` with the new frontmatter + ranked entries for every seeded season (80–120-word rationale + tag + top-5 slot_argument + community_rank_hint), and walks every seeded season file to set `canonical_position` matching the canon rank. Priority order: Survivor (gold-standard, 18 seeded) → Amazing Race (13) → The Challenge (10) → Drag Race (3) → Top Chef (3). The final tick flips `STRICT = true` at the bottom of `scripts/content-check.ts`, enabling strict invariants (every show with seasons has a canon; every season has canonical_position; no orphans). Shows without seeded seasons stay alone — per the always-working rule, they only need a canon once phase 26 seeds them. Detailed brief: `phase_31b_canon_data_drain.md`.
- [x] Phase 31c — Canon + Community page rebuild, show-home chip wiring. UI consuming 31a + 31b's data. Rebuilds `/shows/[show]/canon` + `/shows/[show]/community` to share the unified shell from `design/tiered.tv · Survivor Canon.html` (tier S/A/B/C bands, methodology cells, era toolbar, hero+mid+compact+tail entry layouts, community live-strip + movers + weekly-question card + full ranking table). Fixes show-home FilterBar (drops "By era", makes Canon/Community functional with shift pills, URL-state-persisted via `?view=`). Flips season-detail vote default fallback wording to "community top 10". One cloud tick. Detailed brief: `phase_31c_page_rebuild.md`.
- [x] Phase 33a — Show page consolidation core (canon-first). Merged `/shows/[show]` + the standalone `/canon` + `/community` pages into one canon-first show page per `design/tiered.tv · Survivor.html`: hero (2nd stat → "Canon last revised") → ShiftsRow (honest empty) → the ranking (sticky Editor's Canon / Community tabs, `?view=`-seeded, both panes SSR'd) → themed lists. Lifted the phase-31c `src/components/canon/*` internals onto the show page (`CanonPageShell` → `ShowRanking`, `CanonHead`/`CanonStats` dropped, new `.ranking-intro`), reworked `CanonTabSwitch` to a same-page toggle (no navigation). Collapsed `/canon` + `/community` to 308 redirects (`→ /shows/[show]` / `?view=community`); updated the locked URL contract in `bearings.md` + `spec.md`, sitemap, e2e redirect fixtures + page-reads + link-integrity crawl. Era toolbar + 3 season-page bolt-ons split out to 33b (too large for one cloud tick — cf. phase 31 → 31a/b/c, sanctioned by the phase-33 brief). Detailed brief: `phase_33_show_consolidation.md`. — 3ac0b42
- [x] Phase 33b — Era toolbar + season-page bolt-ons. The genuinely separable remainder of phase 33. Build `CanonEraToolbar.tsx` per `design/tiered.tv · Survivor.html` `.toolbar` (All-N preselected + one chip per `canon.era_bands[]`; `data-era` derived from `premiere_date`; CSS-toggle filter; All-only graceful when `era_bands` absent — functional for Survivor day one, phase 34 drains the rest), mounted in `ShowRanking`'s canon pane. Plus the 3 orthogonal bolt-ons: Cagayan `&amp;` render fix + regression test, season stat-strip left-padding, season TOC `[o]` current-progress indicator per the updated `Heroes vs. Villains.html`. One cloud tick. Detailed brief: `phase_33b_era_toolbar_boltons.md`. — df6c373
- [x] Phase 37 — Show + season design-fidelity nits (user-injected 2026-05-16, **jumps the queue** ahead of phase 26). — 6c74c46 Five concrete faithful-port misses on the two highest-traffic page families, each measured against its binding design file: (1) `/shows/[show]` sticky `.ranking .cp-tabs` `top: 60px → 72px` (real `.site-header` height) so the canon's top — not its middle — is the stick point, + mobile override; (2) season number stacked under the rank numeral in canon S/A bands (`.cp-he-rank-stack` / `.cp-mid-season-tag`) and surfaced as `S## · Community #NN` in B/C, per the updated `design/tiered.tv · Survivor.html`; (3) drop `.cp-toolbar` `margin-top` + `border-top` so methodology→toolbar is one seam, not a hollow double rule; (4) `ShiftsRow` returns `null` while empty so the permanently-empty "What changed this week." section (+ its border) is absent until phase 35 wires the signal; (5) season `#info-row` scale block to the new `design/tiered.tv · Heroes vs. Villains.html` — `.scale-here` dot + label on the track + two descriptive endpoint marks, replacing the flat bar + 3-span "↑ here" row. Page/CSS/component side only — no content, data, or schema; one cloud tick. Detailed brief: `phase_37_design_fidelity_nits.md`.
- [x] Phase 26 — Season backfill, full drain (10/tick) + canon long-truck. Rewritten in 26a to (a) raise the per-tick budget to 10 seasons, (b) drain every show until aired-season coverage is complete, (c) graduate each show into canon-mode once coverage clears the floor, writing a full ranked canon with rationales. **Parked behind 31a/b/c** — the always-working rule + strict content-check require canon-conforming content from every future tick, which 31b establishes. After 31c lands, phase 26 resumes with the cloud loop producing canon-conforming + slug-canonical content from the first tick onward. Detailed brief: `phase_26_season_backfill.md`. Final tick: Love Island UK Series 11 (Summer 2024) closed the last season gap (12/13 shows were already fully drained + canon'd by prior ticks); canon reranked to 11 entries, no show remains in B tier.
- [x] Phase 34 — Era-band drain (tag 'em all). Multi-tick **auto-draining** content phase (phase-26/31b mechanic): each tick `content-curator` authors one show's per-show era taxonomy into the existing optional `canon.era_bands` frontmatter (3–6 bands, gap-free coverage of the aired span on real editorial era shifts). **Zero page code** — phase 33's era toolbar consumes `era_bands` generically, so each drained show's filter chips light up automatically. Priority: Amazing Race → The Challenge → Top Chef → Drag Race → remaining canon'd shows (Survivor already authored, skipped). Lax→strict `content-check` invariant (final tick flips strict); `content-curator` + `ship-content` briefs updated so new shows are born era-banded. Sits **after phase 26** (user holds 26's priority). Detailed brief: `phase_34_era_tags.md`. Final tick: all 13 canon'd shows already era-banded by prior content ticks; this tick fixed stale bachelorette bands (2006-07 gap + missing 2024 S21), shipped the strict gap/overlap/span-coverage `content-check` invariant + `validateEraBandCoverage` helper, and folded era-band discipline into the `ship-content` brief. — 187fa96
- [x] Phase 32 — RSS feeds (`/feed.xml` global + `/feed/<show>.xml` per-show). — 3c67ec9 Handwritten RSS 2.0 routes; no SDK. Global feed lists latest items across shows / themed lists / canon revisions, sorted by mtime or a `published` frontmatter field. Per-show feed scopes to that show's seasons + canon updates. Adds feed-discovery `<link rel="alternate" type="application/rss+xml">` to relevant page heads + sitemap entries. e2e fetches `/feed.xml` and asserts content-type + RSS 2.0 shape (`<channel><item>`) + canonical link. Promoted via `/oversight` 2026-05-14 from PHASE_CANDIDATES #01 (score 5.5; signals: spec drift on spec.md:281, seed S4 trigger reached at 13 shows + 12 themes + 8+ canons). Queued behind phase 26 per user direction so the season-backfill drain finishes first. Brief drafted on-demand from this row when the loop picks it up.
- [x] Phase 35 — Live community data (the read half of the vote system). — e976282 (stages: 3711261 read path + 6977e59 VotePair read-back + 2359621 live pane/RankShiftPill + 53c6c3f ShiftsRow + e976282 weekly-question tally + canon he-aside cross-ref). Every community number on /shows/[show] is Supabase-derived; the three reported vote bugs are closed; canon-mirror still serves below threshold. The vote **write** path works (phase 11 `votes` + `cast_vote()`); the **read** path was never built — no ranking RPC, no `/api/ranking/[show]` route (it sits in the *locked URL contract* but ships as nothing), no rank history. Every community number is an honest placeholder. Phase 35 builds it real, nothing hardcoded: `compute_weighted_rank()` read RPC + `rank_snapshots` + scheduled recompute (pg_cron Thursday 9pm ET, or Vercel-Cron fallback) → real order / approval % / 7-day trend / vote counts / voters-this-week / movers; the contracted `/api/ranking/[show]` ISR route finally built (fulfilment, not a contract change); `computeCommunityRank` rewired with the canon-mirror surviving as the always-working fallback; **VotePair correctness** (already-voted state, no double-count, true net on refresh — closes the three user-reported vote bugs); `RankShiftPill` finally placed in production off real deltas; e2e seed votes/snapshot. **Agent is the data admin — bold with schema + routes** (bearings §Database posture). After phase 32 per user direction. Detailed brief: `phase_35_live_community.md`.
- [x] Phase 36 — Auth-state chrome + comment read/display. — e95b019 Same root cause as 35 (write works, read/reflect on SSG/ISR pages absent). Header calls `auth0.getSession()` but show/season routes are static → permanently signed-out chrome; comments post (`status:pending`) but the thread never reads Supabase and RLS hides `pending` from its own author → "No comments yet" after a successful post. Fixes: auth-state island hydrated from a bold-but-tiny `GET /api/auth/me` so chrome reflects sign-in on every route; server-side comment read path (published + the author's own held comment with a "held for review" affordance); spoiler/mod P0 intact (public never sees pending/hidden/removed). **Agent is the data admin — bold with routes** (bearings §Database posture). Sits after 35; **may be pulled ahead** — it is the smaller, higher-trust fix (user's call). Detailed brief: `phase_36_auth_chrome_comments.md`.

> **After phase 25:** the shipping queue is not done — phase
> 36 is still `[ ]` (26 / 32 / 34 / 35 shipped), so `/march` Step 3a
> keeps shipping them (`/ship-a-phase` wins every tick while
> any remain). Meanwhile `/iterate`, `/ship-content`, and
> `/triage` run per their own gates: content grows by
> ship-content draining content-gap rows; data integrity grows
> by ship-data draining DB findings; the build plan grows via
> `/expand` proposing candidates that `/oversight` promotes.
> **`/critique` is the one exception — it stays fully suppressed
> until the Phase 36 row is `[x]`** (shipping mode, enforced by
> `/march` Step 2.0; rationale in `plan/bearings.md` "Critique
> cadence", user-set 2026-05-16). Once Phase 36 ships, shipping
> mode ends and the full `/iterate` + `/ship-content` +
> `/critique` + `/triage` cycle resumes — `/march` handles the
> dispatch automatically.

> **Note on Vercel auto-deploy before phase 1:** auto-publish
> stays on; deploys will fail until `package.json` and `next`
> exist. The deploy gate (`pnpm deploy:check`, run after every
> shipping skill's push) reports the failure clearly. Phase 1's
> first push trips it; the patch loop within phase 1 iterates
> to a green deploy. From phase 2 onward, a red `deploy:check`
> is a real regression requiring root-cause patching.

---

## Per-phase scope

Each row above corresponds to one phase. The detailed brief
lives at `plan/phases/phase_<N>_<topic>.md` for phases 1, 3,
6, 9. For others, the at-a-glance row above is the brief — the
loop generates a working brief from the row + `phase_6_show_home.md`
(canonical sibling for show families) or `phase_9_season_page.md`
(canonical sibling for per-season pages) when it picks the
phase up.

If a brief is missing when the loop reaches its phase, the loop
generates one in-place from the scope row + the canonical
siblings + any matching `design/` export, then commits it as
`plan: phase_<N>_<topic>.md brief drafted on-demand` before
continuing.
