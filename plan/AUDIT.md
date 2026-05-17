# AUDIT

> Open audit findings. `/iterate` reads the Pending section
> and ships the highest-scoring item per tick. Score formula:
> `impact × ease / 10`, then apply the bias multiplier from
> the header (if present) for the matching category.
>
> Categories: `bug`, `perf`, `a11y`, `seo`, `content-gaps`,
> `data`, `docs`, `mod`, `spoiler`, `other`.

<!-- Bias mechanism — set via /oversight to direct iterate's focus.
     Format:
       > Bias: <category> (set 2026-MM-DD via oversight, valid for N ticks)
     Multiplies findings of <category> by 1.5x for ranking. -->

## Pending

<!-- Format:
- [ ] [SEV] <one-line description> (category: <c>, source: <jot|critique|triage|expand|self>, score: N.N) — <commit hash where filed>
-->

- [ ] [MED] season-page comment thread renders empty state — read path not wired to Supabase (#24) (category: bug, source: triage, score: 4.2) — cf69494
- [ ] [HIGH] auth-chrome gap — Header resolves auth server-side but `/` is SSG (Phase 27) so it renders permanently signed-out; real fix is Phase 36 (auth-state island via GET /api/auth/me). `authed-example.spec.ts:30` is `test.fixme()`'d as a deterministic stopgap so the gap is declared rather than intermittently red-gating the cloud loop; un-fixme when Phase 36 ships. Resequencing 36 ahead of 26/32/34/35 is a user/oversight call. (#54) (category: bug, source: triage, score: 5.4) — cloud 2026-05-17

## Done

<!-- Same format with [x] and the commit-hash that addressed it -->

- [x] [HIGH] sign-out broken — `/auth/logout?returnTo=/` sent a relative `returnTo`; Auth0 forwards it verbatim as `post_logout_redirect_uri=%2F` and always rejects a non-absolute URL. Fixed: `HeaderView` builds the logout href from `canonicalUrl('/')` (→ `https://tiered.tv/`), URL-encoded, with a unit test asserting `returnTo` decodes to an absolute https URL. Full resolution still needs the absolute URL added to Auth0 → Allowed Logout URLs (dashboard task noted on #56); the code fix is correct and shippable alone. (#56) (category: bug, source: triage, score: 5.6) — this commit
- [x] [HIGH] show-home season grid sorts by season number, not canon rank (category: bug, source: user-jot, score: 5.6) — STALE: resolved by phase 33a (3ac0b42). The standalone `/shows/[show]` season grid and its `page.tsx:72` `[...seasons].sort((a,b)=>a.number-b.number)` no longer exist; the page was rebuilt canon-first around `<ShowRanking>`, which renders `canon.entries` (ranked by `canonical_position`) and `community.entries`. The raw `seasons` array is now only a season-number→slug lookup map, never the displayed order. No code change needed; closing for AUDIT accuracy.

- [x] [HIGH] header "sign in" link still shows "sign in" after auth — render user name + log-out when session is present (#31) (category: bug, source: triage, score: 5.6) — 0685538
- [x] [HIGH] show page "on the air" reads "2000–2023" for airing shows — render "<min>–present" when status=airing (#26) (category: bug, source: triage, score: 4.8) — 12f953a
- [x] [HIGH] /api/vote returns rpc_failed — `public.cast_vote` missing in Supabase schema cache (#23) (category: data, source: triage, score: 5.4) — applied all 14 phase 11–13 migrations to prod Supabase + reloaded schema cache; live API returns `{ok:true}`. See `supabase/OPS_LOG.md`.
- [x] [MED] launch-quota gap — content/shows/love-island-us.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-22
- [x] [MED] launch-quota gap — content/shows/love-island-uk.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-22
- [x] [MED] launch-quota gap — content/shows/bake-off.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-22
- [x] [MED] launch-quota gap — content/shows/project-runway.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-22
- [x] [MED] launch-quota gap — content/shows/the-challenge.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-22
- [x] [MED] launch-quota gap — content/shows/bachelor.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-21
- [x] [MED] launch-quota gap — content/shows/bachelorette.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-21
- [x] [MED] launch-quota gap — content/shows/traitors.md missing (Rule 1) (category: content-gaps, source: self, score: 4.2) — phase-21
