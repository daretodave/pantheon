# Phase 35 — Live community data (the read half of the vote system)

> The vote **write** path works (the `votes` table + `cast_vote()`
> RPC, weights materialized 0.1/0.25/1.0, phase 11). The vote
> **read** path was never built. There is no ranking RPC, no
> `/api/ranking/[show]` route (it sits in the *locked* URL
> contract but ships as nothing), no rank history. So every
> community number on the site is an honest placeholder
> ("votes pending", "when votes land", canon-mirror order).
>
> Phase 35 builds the read half **for real, in every sense** —
> nothing hardcoded, every counter Supabase-derived, the
> canon-mirror surviving only as the always-working fallback
> for shows below the vote threshold.
>
> Sits **after phase 32** (user direction — RSS first).

## Mandate (read this first)

**You are the data admin.** Per `plan/bearings.md` §Database
posture, tiered.tv v1 is an experiment and you have full
destructive authority on Supabase — add/drop tables, write or
rewrite migrations, add RPCs, add `pg_cron` jobs, change RLS,
reshape `votes` if the read path needs it. No confirmation
required; the audit trail is git + Supabase backups.

**Be bold with the solution shape.** If the cleanest answer is
a new API route, a route group restructure, an edge/runtime
change, an ISR strategy change, or a materialized view — do it.
The only hard constraints are the standing rules (verify gate,
atomic commit+push, no emoji/Co-Authored-By, content in
`content/` + data in Supabase) and the **already-working
rule** (a show with no/low votes must still render a clean
ranking — the canon-mirror fallback never disappears, it just
stops being the only thing).

`GET /api/ranking/[show]` is **already in the locked URL
contract** (`bearings.md` / `spec.md`). Building it is contract
*fulfilment*, not a change — no contract edit needed (contrast
phase 33).

## The bugs this closes (user-reported, live)

1. `/api/vote` returns `{"ok":true,"value":1,"weight":0.1,
   "count":0.3,"persisted":true}` but the page on refresh
   still shows the old net. → No server read path; the page
   never reads the aggregate at render.
2. Voting up again when already voted makes the net **go
   down**. → VotePair has no "you already voted" state and the
   client math double-counts / mishandles the toggle. The DB
   is correct (unique `(session_id,target_type,target_id)` +
   `ON CONFLICT DO UPDATE` — one row per voter per target);
   the bug is entirely UI state + missing read-back.
3. On refresh it always shows 0. → Static render, no dynamic
   aggregate read, no "my current vote" read.

These are symptoms of the same hole, not three bugs. Fixing
the read path + VotePair state fixes all three.

## Scope

Land it across as many commits/ticks as you (data admin) judge
right. Suggested internal sequence — collapse or split as the
work demands; do **not** treat these as rigid sub-phase rows:

### Stage 1 — Data layer

- **`compute_weighted_rank(p_show text)`** read RPC. For each
  season target (`target_type='season'`, `target_id='<show>:<n>'`):
  `score = SUM(value*weight)`, `approval =` weighted share of
  positive over total non-zero weight (the design's "approval
  %" — share who'd keep/raise the slot), `vote_count =`
  distinct voting sessions, ordered → the ranked table the
  community list needs. `SECURITY DEFINER`, granted to
  `service_role` (mirror `cast_vote`'s privilege posture).
- **`rank_snapshots`** table — `(show, season_number, rank,
  score, approval, vote_count, snapshot_at)`. The 7-day trend,
  the movers, "last/next recompute", and the
  `RankShiftPill` delta all derive from comparing the live
  ranking to the most recent snapshot ≥ 7 days old.
- **Scheduled recompute** — the design says "Recomputed every
  Thursday 9pm ET". Implement with `pg_cron` writing a
  `rank_snapshots` row + a materialized current-ranking row.
  If `pg_cron` is unavailable on the project tier, fall back
  to a Vercel Cron hitting an authenticated
  `POST /api/internal/recompute` (service-role guarded) — your
  call as data admin; document which in the migration/route.
- **"Voters this week"** = distinct `session_id` with a
  non-zero vote on any of the show's targets in the trailing
  7 days. **Version** = snapshot sequence/id. Nothing on the
  live-strip is a literal.
- Seed: extend `supabase/seed.sql` with representative votes
  + at least one historical snapshot so the hermetic e2e
  renders deterministic non-empty community state.

### Stage 2 — API + ranking lib

- Build **`GET /api/ranking/[show]`** — the contracted cached
  aggregate, ISR'd (`revalidate` tuned to the recompute
  cadence; the route reads the materialized ranking, never
  recomputes on the hot path).
- Rewire `src/lib/community/rank.ts`: `computeCommunityRank`
  (or a new `getCommunityRanking`) reads the materialized
  ranking. Keep the `source` discriminator
  (`'votes' | 'canon' | 'seasons'`) — `'votes'` finally
  becomes reachable. **Below the vote threshold the
  canon-mirror still serves** (always-working rule); the
  `source` value is what the live-strip / intro copy keys off.
- Decide ISR vs. dynamic for the consuming pages so refresh
  reflects truth (this is the shared root-cause with phase
  36: the SSG show/season pages have no dynamic read path).
  Be bold — segment-level `revalidate`, `dynamic`, or a
  client hydration fetch against `/api/ranking` are all on
  the table.

### Stage 3 — VotePair correctness + every counter real

- **VotePair**: on mount, read the viewer's existing vote for
  the target (a `GET` on `/api/vote?...` or a "my votes"
  read keyed by the session cookie) and render the
  already-voted state. Net count comes from the **real
  aggregate**, not optimistic-only. Re-clicking the same
  direction is a no-op or a clear (toggle), never a
  double-count. After a write, reconcile to the server's
  returned `count`. Refresh shows true net.
- Wire real data into every component built in phase 31c /
  rendered by phase 33: `CommunityRankList` (approval bar +
  % + 7-day trend pill + vote count per row),
  `CommunityLiveStrip` (last recompute ts, next recompute,
  voters/wk, version, status), `CommunityMovers` **and** the
  show page `ShiftsRow` ("what changed this week" — same
  snapshot-delta source), `CommunityWeeklyQuestionCard`
  (real tally + close time), the canon Tier-S `he-aside`
  community mini-pills (Community #N + trend, cross-ref to
  the live ranking).
- **`RankShiftPill` production placement.** Built phase 19d,
  explicitly "not yet rendered in the product … no
  production placement until a future phase wires the
  72-hour shift signal." **This is that phase.** Place it
  per `design/tiered.tv · Survivor.html` (community list
  trend cells, shift cards, canon asides) off the real
  snapshot delta.

## Tests (usual rules)

- Unit: `compute_weighted_rank` aggregate math (weighting,
  approval %, ties, all-zero/all-retracted edges); trend =
  live vs. ≥7d snapshot; VotePair state machine
  (already-voted, toggle, reconcile-to-server, no
  double-count).
- e2e (hermetic, local Supabase + seeded votes/snapshot):
  `/api/ranking/survivor` returns the contracted shape;
  community pane renders real approval/%/trend/votes;
  vote → refresh shows the persisted net (not 0, not
  double); re-vote same direction does not inflate; mobile
  375 clean. Update `canonical-urls.ts` / `page-reads.ts`
  for the new API route.
- a11y gate (phase 18) unaffected; extend if the shift pill
  adds interactive surface.

## Acceptance

- Every community number on `/shows/[show]` (and any season
  page surface) is Supabase-derived. Zero hardcoded counters.
- Vote → refresh shows the true persisted net; an
  already-voted viewer sees their state and cannot
  double-count; the three reported bugs are gone.
- `/api/ranking/[show]` exists, ISR'd, matches the contracted
  description.
- Shows below the vote threshold still render a clean
  ranking via the canon-mirror (always-working rule);
  `source` drives honest live-strip / intro copy.
- `RankShiftPill` rendered in production off real deltas.
- `pnpm verify` green each commit; `deploy:check` green
  post-push. Build-plan `[x] Phase 35` on completion (interim
  ticks `[WIP]`).

## Out of scope

- Comment display / auth-state chrome → **phase 36**.
- Re-weighting historical votes on account-age crossover
  (the votes migration notes this is explicitly deferred for
  v1 — leave it).
- Real-time push (websockets). ISR + recompute cadence is
  the v1 contract; "live" means "fresh within the cadence".
