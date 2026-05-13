# PHASE_CANDIDATES

> `/expand` reads accumulated signals (audit findings, critique
> findings, GH issues, spec drift, design landings, data
> growth) and proposes new phase candidates here. `/oversight`
> reviews and promotes them to `plan/steps/01_build_plan.md`.
>
> Posture: **bold** (per `plan/bearings.md`). `/expand` runs
> at standard cadence and files candidates here. `/oversight`
> is the only path to promote.

## Considered (awaiting promotion)

<!-- Format:
### <NN>. <Phase title>
**Score:** N.N (impact: N, ease: N)
**Source pass:** <expand pass number>
**Filed:** <ISO date>
**Why:** <one-paragraph rationale>
**Scope sketch:** <2-3 lines of what would ship>
-->

_(empty — populates after the first `/expand` invocation,
typically after phase 5 ships)_

## Promoted

<!-- Same format with **Promoted in:** <oversight commit hash>
     and **Build-plan row:** <link to row in 01_build_plan.md> -->

_(empty)_

## Rejected

<!-- Same format with **Rejected at:** <oversight commit hash>
     and **Reason:** <why> -->

_(empty)_

---

## Seed candidates (pre-loaded for /expand to evaluate)

These aren't promoted; they're seeds the user pre-emptied so
`/expand` doesn't have to discover them. `/expand` may score,
score-and-defer, or merge with newly-discovered candidates.

### S1. Custom domain swap (`pantheon.app` → primary)

**Trigger:** when `pantheon.app` is purchased + DNS configured.
**Scope sketch:** add domain in Vercel, update Auth0 Allowed
URLs, swap `AUTH0_BASE_URL`, swap `EMAIL_FROM_ADDRESS` to
`noreply@pantheon.app`, run `setup/05_email.md` v2 swap,
update all hardcoded `pantheon-coral.vercel.app` refs in
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

### S7. Inline / takeover search (replace the `/search` route page)

**Trigger:** after phase 19b ships (search icon lives in the
new header).
**Source:** user direction 2026-05-13 — "Search needs to be
inline (or takeover) — not a new page. you click the icon
(thats in the style of "Show identity, tokens and
compositions" from the design, the search expands and you can
type right there. the index is local so we don't care that we
are hitting the service per keystroke. highlight the content
that comes up with the keystroke (if we can)."

**Scope sketch:**

- Click `⌕ Search` in the header → an inline takeover slides
  down from under the topnav. No route change.
- The takeover holds a single `<input type="search">` + a
  results list below.
- Per-keystroke query against the local index built in phase
  15 (`src/lib/search.ts`). Fast — no Supabase round-trip for
  the index, since the index is content-only and built at
  request-time from the content loader.
- Highlight matching substrings in the results titles + first
  blurb line (use `<mark>` spans).
- Results group by kind: shows, seasons, themed lists.
- Escape closes the takeover. Click outside also closes.
- Keyboard: ↑/↓ navigates results; Enter activates the
  highlighted result.
- `/search?q=…` deep-link remains valid and opens the
  takeover pre-populated. The standalone `/search` page can
  redirect to `/?search=…` or simply continue to live as a
  fallback for users without JS.
- Accessibility: ARIA combobox pattern; results have
  `aria-live="polite"`.

Phase work: rewire `<Header>` (19b ships the icon link as a
stub) so the icon toggles a `<SearchTakeover>` rather than
navigating; create `<SearchTakeover>` under
`src/components/chrome/`; deprecate `src/app/search/page.tsx`
or render it as the no-JS fallback.

**Filed:** 2026-05-13. Awaiting `/oversight` promotion.
