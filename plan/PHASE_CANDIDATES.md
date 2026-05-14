# PHASE_CANDIDATES

> `/expand` reads accumulated signals (audit findings, critique
> findings, GH issues, spec drift, design landings, data
> growth) and proposes new phase candidates here. `/oversight`
> reviews and promotes them to `plan/steps/01_build_plan.md`.
>
> Posture: **bold** (per `plan/bearings.md`). `/expand` runs
> at standard cadence and files candidates here. `/oversight`
> is the only path to promote.

> Last pass: 2026-05-14 at commit b232052
> Pass count: 1

## Considered (awaiting promotion)

<!-- Format:
### <NN>. <Phase title>
**Score:** N.N (impact: N, ease: N)
**Source pass:** <expand pass number>
**Filed:** <ISO date>
**Why:** <one-paragraph rationale>
**Scope sketch:** <2-3 lines of what would ship>
-->

### 03. Newsletter subscribe (Buttondown embed)

**Score:** 3.0 (impact: 4, ease: 5, +1 multi, -1 vendor)
**Source pass:** 1
**Filed:** 2026-05-14
**Source signals:**
- `spec.md:281` — same spec phase 18 row that names RSS also
  names "newsletter."
- Seed S4 — same seed names Buttondown form embed.

**Why:** Split from candidate 01 because newsletter introduces
a vendor dependency (Buttondown account + DNS records once a
domain swap lands) that RSS doesn't share. Lower priority than
RSS because RSS already serves the "return-reader" need; the
newsletter is incremental on top. File so it isn't lost — but
defer until S1 (domain swap) lands, since `noreply@tiered.app`
or similar makes the sign-up trust signal real.

**Scope sketch:**
- `/newsletter` minimal page: Buttondown embed form, brief
  promise copy, no SDK.
- Footer link surfaces it once.
- No auth integration; subscribers list lives in Buttondown.
- e2e: page renders + form has the expected `<form action>`
  pointing at buttondown.

**Estimated phases:** 1.
**Conflicts:** depends on S1 (custom domain) for a credible
sender identity; can ship before but trust signal will be weak.

## Considered (below threshold)

### B1. `content/calendar.yml` + post-finale event triggers

**Score:** 2.0 (impact: 5, ease: 4, -2 expensive/uncertain)
**Source signals:** `spec.md:294` promises "Event triggers (a
finale air date in `content/calendar.yml`) prompt `/iterate` to
write a 'post-finale ranking shift' piece spoiler-free."
Calendar doesn't exist; no `/iterate` hook.
**Why deferred:** Single signal; the auto-write piece is
hand-wavy (what does "write a post-finale ranking shift piece"
mean in skill terms?). Worth raising again after at least one
real finale produces a hand-authored "shift" post that the
loop can pattern from.

## Promoted

<!-- Same format with **Promoted in:** <oversight commit hash>
     and **Build-plan row:** <link to row in 01_build_plan.md> -->

### 01. RSS feeds (`/feed.xml` + `/feed/<show>.xml`)

**Score:** 5.5 (impact: 5, ease: 5, +2 multi, +1 cheap)
**Source pass:** 1
**Filed:** 2026-05-14
**Source signals:**
- `spec.md:281` — spec lists "RSS + newsletter" as phase 18, but
  the build plan's phase 18 became "Performance + a11y polish"
  (spec phase 17). RSS never landed; spec/plan drift.
- Seed S4 — user-emptied seed for "Newsletter + RSS" with
  trigger "when content velocity exceeds ~15 published canons +
  5 themes." Current state: 13 shows, 12 themes, 8+ canons —
  trigger is reached.
- bearings Rules 1 + 3 quotas both cleared (phases 22 + 24
  shipped 13 shows + 12 themes); regular readers now have
  enough to subscribe to.

**Why:** RSS is the lowest-friction return-reader channel and
the only spec-promised feature still missing from the build
plan. It's also a SEO signal — feed-discovery surfaces on
aggregators that don't index regular HTML. The catalog is large
enough that "new canon, new list, new season blurb" updates
benefit from a stream. Scope is genuinely small (handwritten
XML route; no SDK; no auth) and orthogonal to other surfaces.

**Scope sketch:**
- `app/feed.xml/route.ts` — global RSS 2.0: latest items across
  shows / themed lists / canon revisions, sorted by file mtime
  or a `published` frontmatter field.
- `app/feed/[show]/route.ts` — per-show feed: that show's
  seasons + canon updates only.
- Add feed discovery `<link rel="alternate" type="application/rss+xml">`
  to relevant page heads.
- Sitemap entries for both feed routes.
- e2e: fetch `/feed.xml`, assert content-type + RSS 2.0 root +
  `<channel><item>` shape + `<link>` matches canonical URL.

**Estimated phases:** 1.
**Conflicts:** none. Spec-aligned; design has no opinion on
feeds (no UI impact beyond the discovery `<link>`).
**Promoted in:** oversight 2026-05-14 (queued behind phase 26 per user direction)
**Build-plan row:** Phase 32 — RSS feeds (`01_build_plan.md`)

### 02. Inline search takeover (replace `/search` route page)

**Score:** 4.0 (impact: 6, ease: 5, +1 multi, -1 scope risk)
**Source pass:** 1
**Filed:** 2026-05-14
**Status:** shipped before promotion — phase 29 (commit c4ed547,
"feat: inline search overlay; retire /search — phase 29") landed
the cmd+K overlay with filter chips + keyboard nav, retired the
`/search` route as a 308, and reuses the phase 15 local index
exactly as the candidate sketched. Recording here for audit
trail; no new build-plan row needed.

**Source signals:**
- Seed S7 — user direction 2026-05-13 ("Search needs to be
  inline (or takeover) — not a new page"). Detailed scope
  sketch already filed.
- Design landing — phase 19b shipped the new chrome with a
  `⌕ Search` icon in the header; the icon currently links to
  the standalone `/search` route, which contradicts the user's
  brief.
- bearings "Content velocity & editorial cadence" — content
  catalog now warrants frictionless cross-show search; route
  navigation breaks the browsing flow.

**Scope sketch (as filed; matches what shipped):**
- New `<SearchTakeover>` in `src/components/chrome/`: panel
  slides down under `<TopNav>`, ARIA combobox, `<input
  type="search">` + grouped results.
- Header `⌕ Search` becomes a button toggling the takeover (no
  navigation).
- Per-keystroke local search; `<mark>` highlights in result
  titles + first blurb line.
- Keyboard: ↑/↓ navigate, Enter activate, Esc close; click
  outside closes.
- `/search?q=…` deep-link opens takeover pre-populated;
  `app/search/page.tsx` becomes the no-JS fallback.
- e2e: open via icon, type → results, keyboard nav, deep-link.

**Promoted in:** oversight 2026-05-14 (retroactive — phase 29 already shipped the scope)
**Build-plan row:** Phase 29 — Inline search overlay; retire `/search` (`01_build_plan.md` line 101)

### S7. Inline / takeover search (seed) — superseded by candidate #02

**Status:** shipped via phase 29 (commit c4ed547). Seed and
candidate #02 describe the same scope; both moved here together
so the audit trail is complete. The seed's accessibility
contract (ARIA combobox, `aria-live="polite"`, Esc/click-out
close, ↑/↓ navigation) matches what phase 29 e2e covers.

**Promoted in:** oversight 2026-05-14 (retroactive)
**Build-plan row:** Phase 29 — Inline search overlay; retire `/search` (`01_build_plan.md` line 101)

## Rejected

<!-- Same format with **Rejected at:** <oversight commit hash>
     and **Reason:** <why> -->

_(empty)_

---

## Seed candidates (pre-loaded for /expand to evaluate)

These aren't promoted; they're seeds the user pre-emptied so
`/expand` doesn't have to discover them. `/expand` may score,
score-and-defer, or merge with newly-discovered candidates.

### S1. Custom domain swap (`tiered.app` → primary)

**Trigger:** when `tiered.app` is purchased + DNS configured.
**Scope sketch:** add domain in Vercel, update Auth0 Allowed
URLs, swap `AUTH0_BASE_URL`, swap `EMAIL_FROM_ADDRESS` to
`noreply@tiered.app`, run `setup/05_email.md` v2 swap,
update all hardcoded `tiered.tv` refs in
content + canonicalUrl helpers.

### S2. Resend email provider migration

**Trigger:** depends on S1 (needs domain DNS).
**Scope sketch:** runbook in `setup/05_email.md` v2 path —
account, domain verify, API key, Auth0 SMTP wiring, bounce
webhook, swap from Auth0 dev SMTP. Bumps `setup/00_files.md`
05 status to ✅.

### S3. Cron-enable cloud /march

**Trigger:** after user vets the manual cloud workflow_dispatch
runs cleanly for ~1 week.
**Scope sketch:** add `schedule: - cron: '0 * * * *'` (or
similar cadence) to `.github/workflows/march.yml`. Bound by
the daily commit ceiling check and concurrency group already
in place.

### S4. Newsletter + RSS

**Trigger:** when content velocity exceeds ~15 published
canons + 5 themes (organic discovery via search starts to
matter).
**Scope sketch:** Buttondown form embed at `/newsletter` (no
SDK required); handwritten RSS 2.0 with global feed at
`/feed.xml` and per-show feeds at `/feed/<show>.xml`; sitemap
entries; e2e validates RSS 2.0 shape.

### S5. SVG → PNG OG generator

**Trigger:** after phase 17 (SEO meta) ships and per-route OG
images become a critique-finding source.
**Scope sketch:** extend `scripts/build-icons.mjs` to render
per-route OG (1200x630) compositions deriving from the show's
facade + the route's headline. `app/opengraph-image.tsx` per
route family.

### S6. Vercel Analytics dashboard review cadence

**Trigger:** ~30 days after launch (whenever real user traffic
starts).
**Scope sketch:** weekly `/oversight` checkpoint reads Vercel
Analytics dashboard; surfaces top-N pages, drop-off points,
404s; files audit rows for any URL with >5% bounce. Lightweight
human-in-loop ritual.

_(S7 promoted retroactively — see ## Promoted above. Phase 29 (c4ed547) shipped the scope.)_
