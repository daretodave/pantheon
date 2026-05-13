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

- [x] Phase 1 — Bootstrap (Next.js 15 App Router + TypeScript strict + Tailwind reading from `design/tokens.json` → CSS vars + Vitest + Playwright skeleton + Biome + Vercel Analytics gated on `DISABLE_ANALYTICS=1` + favicon pipeline + placeholder `public/sigil.svg` + `pnpm verify` runs clean + first deploy green at `pantheon-coral.vercel.app`) — a227f74
- [x] Phase 2 — Content layer (`src/content/loaders.ts` + Zod schemas for show / season / theme / canon, `pnpm content:check` validate script wired into verify, 1 sample show seeded — Survivor — proving the loader pipeline) — 037bcab
- [x] Phase 3 — URL contract + hermetic e2e infrastructure + `mint-e2e-cookie.mjs` (every route from bearings exists with stub or real page; **/about, /terms, /privacy render real content from `content/legal/*.md` markdown**; `src/lib/seo.ts` with `buildMetadata` + JSON-LD + `canonicalUrl`; `app/sitemap.ts`; `app/robots.ts`; **`apps/e2e/src/fixtures/canonical-urls.ts` derived programmatically from content loaders**; **`apps/e2e/src/fixtures/page-reads.ts`**; **smoke walker over every canonical URL**; **mobile spec template at 375px**; **`scripts/mint-e2e-cookie.mjs` ports the fibered pattern — password-realm grant + JWE encryption + cache + `.env` upsert**; **`apps/e2e/src/auth.ts` reads the cache + builds Playwright storageState**; **`pnpm verify` runs e2e against `next start` on `:4173` as a hard gate**; **`DISABLE_ANALYTICS=1` set in `playwright.config.ts`**; first authed spec example) — 13f051f
- [x] Phase 4 — Pantheon facade primitives (SVG components for `<Column>`, `<Pediment>`, `<Frieze>`, `<Ornament>` reading from `design/compositions/sigils.jsx` + `design/tokens.json`; sigil-from-facade derive helper that crops pediment + center column to 320×320; per-show palette CSS-var injector via `[data-show=<slug>]` wrapper; unit tests for the crop math + the palette injector; e2e snapshot of all four primitives in isolation) — 3747750
- [ ] Phase 4a — Composition primitives (port `design/compositions/screens.css` to `src/styles/screens.css` and **adopt the full rich-background show/season layouts from `design/compositions/screens.jsx`** as the layout source of truth. Build React primitives consumed by phases 6/7/8/9/14/16: `<ShowHero>` (warm background + facade art + crumb + title + lede + ShieldBadge), `<ShowSplit>` (canon/community two-button split), `<SeasonCard>` (rank + title + tag + season # + rank-shift pill), `<SeasonShell>` (two-column main + sticky aside), `<SeasonHead>` (crumb + sigil + rank row), `<RankShiftPill>` (delta + sentiment color), `<ShieldBadge>` (the spoiler-promise pill), `<TopNavTinted>` (header that takes on per-show palette). Per-show palette wired via `[data-show=<slug>]` CSS-var injection — `--show-paper`, `--show-ink`, `--show-primary` per the SHOWS map in screens.jsx. **Mobile reflow contract preserved.** Unit tests for every primitive + e2e renders a `/internal/composition-demo` page (gated behind a build-time flag so it doesn't ship to prod) that snapshots Survivor in all three compositions. After this phase: phase 6's brief becomes "wire data + JSON-LD into `<ShowHero>` + `<ShowSplit>` + a `<SeasonCard>` grid" rather than "design the show page from scratch.")

**First show families (phases 5–9):**
- [ ] Phase 5 — Three pioneer show facades (Survivor, Top Chef, RuPaul's Drag Race — full `facade.svg` + derived `sigil.svg` + 3 ornaments per show, committed under `public/shows/<slug>/`; matching `content/shows/<slug>.md` frontmatter with palette; brander sub-agent generates the SVGs; e2e renders all three show wrappers and snapshot-tests the palette swap)
- [ ] Phase 6 — Show home page (canonical sibling — `/shows/[show]`) — facade hero + season grid + canon/community split + per-show palette wrap + JSON-LD CollectionPage + BreadcrumbList. **Every later show home mirrors this.** Detailed brief: `phase_6_show_home.md`.
- [ ] Phase 7 — Editor's Canon page (`/shows/[show]/canon`) — ranked list with rich blurbs, per-rank rationale rendered from `canon.md`, JSON-LD ItemList, sitemap entries
- [ ] Phase 8 — Community Rank page (`/shows/[show]/community`) — vote-driven order computed from Supabase `compute_weighted_rank()` RPC, ISR'd, "be the first to vote" empty state mirrors canon order
- [ ] Phase 9 — Single season page (canonical sibling for season pages — `/shows/[show]/season/[n]`) — blurb + vote pair + comment thread shell (no backend yet — phase 11) + 72-hour rank pill if `canonical_position` shifted recently. Detailed brief: `phase_9_season_page.md`.

**Auth + dynamic backends (phases 10–13):**
- [ ] Phase 10 — Auth integration (Auth0 magic-link via `@auth0/nextjs-auth0` v4 + Next.js middleware that issues HttpOnly anon-guest cookie on first request + Supabase `sessions` table + `/sign-in` + `/u/[handle]` shell + claim-anon-on-login flow that calls `claim_anon_session()` RPC)
- [ ] Phase 11 — Vote backend (Supabase `votes` + `users` migrations land + RLS policies + `POST /api/vote` server action + new-account weight ramp + brigade rate-limits per bearings + e2e covers anon vote → sign-in → vote-claim flow)
- [ ] Phase 12 — Comment backend (Supabase `comments` + `flags` migrations + RLS + `POST /api/comment` with OpenAI `gpt-5-mini` pre-filter against the structured-output schema in `setup/06_openai.md` Section E + new-account 5-comment hold + AI-decision audit logging + e2e covers happy path + spoiler-blocked + flag flow)
- [ ] Phase 13 — Moderation queue page `/mod` (RBAC-gated via Auth0 `mod` role + drains `comments` where `status in ('pending','hidden')` + drains flag queue + writes `mod_actions` rows for every action + e2e covers a second test user with `mod` role for the gate test)

**Cross-cutting (phases 14–18):**
- [ ] Phase 14 — Themed lists (`/themes` + `/themes/[theme]` + `content/themes/<slug>.md` schema + cross-show ranked entries + ItemList JSON-LD + sitemap)
- [ ] Phase 15 — Search (`src/lib/search.ts` Supabase fulltext over content/shows + content/themes + season blurbs + `/search` page + header search affordance + e2e walks ≥3 representative queries)
- [ ] Phase 16 — Home page hero (`/` — featured show pediment teaser + featured rankings + themed list teaser + the cold-search promise: "the seasons, ranked. no spoilers." + `<SpeedInsights />` mounted)
- [ ] Phase 17 — SEO meta + sitemaps + structured data (per-route `opengraph-image.tsx` deriving from facade; FAQ JSON-LD on /about; tighten ItemList shapes; sitemap completeness e2e; OG image rendered to PNG via `scripts/build-icons.mjs` extension)
- [ ] Phase 18 — Performance + a11y polish (`@axe-core/playwright` + `apps/e2e/tests/a11y.spec.ts` covering 7 canonical pages desktop + 3 mobile WCAG 2.1 AA critical-only hard gate; skip-to-main-content link; `id="main"` on all routes; raw-`<img>` discipline gate; `pnpm size` script gating homepage gzipped JS at 250 KB)

**External-signal wiring (phase 19):**
- [ ] Phase 19 — `/critique` + `/triage` wiring (reader sub-agent walks live site with anon AND authed cookie passes; findings tagged `anon:`/`authed:`; triage skill enabled with the 13 labels; loop-issue mirror script; `/march` Step 3a starts dispatching to triage when unlabeled issues exist)

**Content velocity endgame (phases 20+):**
- [ ] Phase 20 — `/ship-content` skill landed + first show backfill (Amazing Race, Big Brother — `brander` + `content-curator` in parallel per show; bearings Rule 1 quota check goes live)
- [ ] Phase 21 — Show backfill round 2 (Bachelor, Bachelorette, Traitors)
- [ ] Phase 22 — Show backfill round 3 (Love Island US, Love Island UK, Bake Off, Project Runway, The Challenge — completes the 12-show launch quota per bearings Rule 1)
- [ ] Phase 23 — Themed lists round 1 (best premieres, best finales, best post-merge runs, best returnee seasons, best newbie casts — 5 themes drains bearings Rule 3 to ≥5/10)
- [ ] Phase 24 — Themed lists round 2 (best villain editing, best comeback seasons, best location reveals, best reunion specials, best non-winning runs — completes Rule 3 quota at 10)
- [ ] Phase 25 — Sigil + canon iteration (replace placeholder `public/sigil.svg` with the real Pantheon sigil via brander; refresh canon rationales for the first 3 shows after critique passes file substantive feedback)

> **After phase 25:** the loop transitions back into `/iterate`
> + `/ship-content` + `/critique` + `/triage` cycles. Content
> grows by ship-content draining content-gap rows; design grows
> by critique findings; data integrity grows by ship-data
> draining DB findings; the build plan grows via `/expand`
> proposing new candidates that `/oversight` promotes. `/march`
> handles the dispatch automatically.

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
