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

- [ ] [HIGH] show-home season grid sorts by season number, not canon rank — label reads "Sorted by Editor's Canon" but the actual order on `/shows/[show]` is season order. `src/app/shows/[show]/page.tsx:72` does `[...seasons].sort((a, b) => a.number - b.number)`; should sort by `canonical_position` (ascending; missing values fall back to end, tie-break on season number). Cards already render `rank={season.canonical_position ?? season.number}`, so cards display correct rank but in wrong sequence. Fix touches the one sort + a unit test asserting the order matches canon. (category: bug, source: user-jot, score: 5.6) — oversight 2026-05-14
- [ ] [MED] season-page comment thread renders empty state — read path not wired to Supabase (#24) (category: bug, source: triage, score: 4.2) — cf69494

## Done

<!-- Same format with [x] and the commit-hash that addressed it -->

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
