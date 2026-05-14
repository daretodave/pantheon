# Phase 25 — Canon iteration

> **Goal.** Bring the pioneer trio (Survivor, Top Chef, Drag
> Race) to a baseline Editor's Canon state so future critique
> ticks have prose to react against. Survivor already ships a
> 4-entry canon (phase 7's seed). Top Chef and Drag Race ship
> 3-entry canons here, with the corresponding season files so
> the canon-page links resolve.
>
> **Why this shape.** The plan row reads "refresh canon
> rationales for the first 3 shows after critique passes file
> substantive feedback." In cloud mode `/critique` is local-only
> (reader sub-agent depends on Chrome MCP). `plan/CRITIQUE.md`
> is empty — there is no targeted feedback to apply. Without
> that input, the iteration would be cosmetic. What the trio
> actually needs is *to have canons in the first place* so the
> next local `/critique` pass has surfaces to walk. This phase
> ships that floor; subsequent `/iterate` ticks drain whatever
> critique files against the prose.

## Outcome

After this phase:

- `content/shows/top-chef/canon.md` exists with 3 ranked entries
  (rank 1–3), each a 80–120 word rationale, schema-valid, no
  spoilers.
- `content/shows/dragrace/canon.md` exists with 3 ranked entries
  on the same shape.
- Each canon entry references a season number that has a
  matching season file under
  `content/shows/<slug>/seasons/NN-<slug>.md` (6 new files —
  3 top-chef, 3 dragrace). Season files carry a 50–80 word
  spoiler-safe blurb under the same schema phase 22 used.
- `pnpm content:check` passes — every canon entry has its
  matching season file; every blurb is in word-count.
- The canon-page e2e fixture (`SHOWS_WITH_CANON` set in
  `apps/e2e/tests/canon-page.spec.ts`) is updated to include
  `top-chef` and `dragrace` so the populated-list assertion
  fires against both.
- Survivor's canon and season files are untouched. Without
  critique feedback there is no objective signal driving a
  rewrite — touching Survivor prose absent feedback is exactly
  the "cosmetic" trap the plan's "after critique" gate exists
  to prevent.

## Scope

- **In:** new content (canon + season files) for top-chef and
  dragrace. e2e fixture update. Build-plan tick.
- **Out:** Survivor canon refresh (no critique feedback to apply
  yet; a future local-`/critique` → `/iterate` cycle handles
  it). New tests beyond the fixture update — the existing canon
  e2e + smoke walker cover the new URLs automatically because
  `canonical-urls.ts` derives season URLs from the filesystem.

## Delegation

One `content-curator` call writes all 12 prose files in one
pass (3 canon entries × 2 shows + 3 season files × 2 shows).
Voice: knowledgeable peer, spoiler discipline P0, strict word
counts. Season selection is editorial — the agent picks
3 canon-worthy seasons per show based on cast / format /
cultural footprint, never on outcome. The main agent wires
fixtures, runs verify, commits.

## Season selection guidance (for the curator)

- **Top Chef** has 22 aired seasons. Strong canon contenders
  include S6 Las Vegas, S9 Texas, S11 New Orleans, S14
  Charleston, S18 Portland. Pick 3 from this set or near it —
  span eras when you can.
- **Drag Race** has 17 aired seasons. Strong canon contenders
  include S5, S6, S9, S10, S14. Pick 3, span eras.

Spoiler-safe rationale levers: format texture, cast chemistry,
era / cultural moment, structural innovation, judge / host
treatment. Never: winners, eliminations, who-went-home.

## Files touched

```
content/shows/top-chef/canon.md                    (new)
content/shows/top-chef/seasons/NN-<slug>.md        (new × 3)
content/shows/dragrace/canon.md                    (new)
content/shows/dragrace/seasons/NN-<slug>.md        (new × 3)
apps/e2e/tests/canon-page.spec.ts                  (SHOWS_WITH_CANON += top-chef, dragrace)
plan/steps/01_build_plan.md                        (tick phase 25)
```

## Verify gate

`pnpm verify` runs the full pipeline. The blocking checks:

- `pnpm content:check` validates frontmatter schemas and
  enforces the rationale 80–120 / blurb 50–80 word counts.
- `pnpm content:check` also enforces the canon→season
  cross-reference: every canon entry must have a matching
  season file (per `scripts/content-check.ts:41`).
- The canon-page spec asserts the populated-list path for
  top-chef and dragrace once the fixture is updated.
- The smoke walker derives new season URLs from the filesystem
  and walks them; the existing `/shows/[show]/season/[n]`
  read-spec covers content visibility.

## Decisions made upfront

- **No Survivor refresh.** Phase row's "after critique" gate
  is satisfied by Survivor having seeded prose to critique
  against; the actual iteration belongs to a future
  `/iterate` tick once feedback files into `plan/CRITIQUE.md`.
- **3 entries per new show, not 5.** Rule 2 (canon
  completeness) sets the long-term target; this phase
  establishes the floor. `/ship-content` rounds extend.
- **One curator call, not two.** Both shows share voice /
  spoiler discipline; batching amortizes context.
- **No new tests beyond the fixture set update.** The existing
  canon spec is parameterized over `SHOWS_WITH_CANON`; adding
  to that set is the test contribution. New season URLs flow
  through the smoke walker automatically.
