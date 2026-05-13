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

- [ ] [HIGH] /api/vote returns rpc_failed — `public.cast_vote` missing in Supabase schema cache (#23) (category: data, source: triage, score: 5.4) — cf69494
- [ ] [MED] season-page comment thread renders empty state — read path not wired to Supabase (#24) (category: bug, source: triage, score: 4.2) — cf69494

## Done

<!-- Same format with [x] and the commit-hash that addressed it -->

_(empty)_
