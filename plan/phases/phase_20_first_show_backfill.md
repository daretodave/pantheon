# Phase 20 — `/ship-content` skill landed + first show backfill

> **Outcome.** Two more shows enter the corpus — Amazing Race and
> Big Brother — and the bearings Rule 1 quota check becomes a
> first-class signal the loop can read. With this tick, Pantheon
> moves from 3 shows live (Survivor, Top Chef, Drag Race) to 5,
> and the remaining 7 launch shows are filed as `content-gaps`
> rows in `plan/AUDIT.md` so `/iterate` and `/ship-content` can
> drain them autonomously over phases 21 and 22.
>
> **Why this phase exists.** The `/ship-content` skill already
> exists at `skills/ship-content.md`. What's been missing is (a)
> a runnable check that surfaces the gap between covered shows
> and the launch quota, and (b) the first real bearings-Rule-1
> deliveries to prove the skill end-to-end against the post-19a
> seven-field show contract.
>
> **No facade work.** Visual identity is color + typography +
> the shared brand mark. The two new shows ship with palette +
> blurb + tagline — nothing else graphical. Per
> `design/CLAUDE.md` Hard Rule 1.

## 1. Two shows — frontmatter only

Mirror the existing pattern set by `content/shows/top-chef.md`
and `content/shows/dragrace.md`: a single `.md` file with the
seven-field frontmatter contract from phase 19a, no canon or
season backfill yet. The canon + seasons drain later through
Rule 2 content-gap rows once the show is on the corpus.

Paths:
- `content/shows/amazing-race.md`
- `content/shows/big-brother.md`

Required fields (`src/content/schemas.ts.showFrontmatterSchema`):
`slug`, `name`, `palette: { paper, ink, primary }`, `seasons`,
`status`, `blurb` (≤120 chars), `tagline` (≤280 chars).

Voice: knowledgeable peer. Plain-spoken. No exclamation points.
Spoiler discipline P0 — taglines describe what the show **is**,
never who wins.

The `palette` is the editorial palette for the show's tinted
chrome. Pick a paper / ink / primary trio that (a) reads as
distinct from any sibling show, (b) hits WCAG AA contrast
against `tokens.json`'s ink scale, (c) matches the show's
visual reality without descending into pastiche.

For Amazing Race: deep travel-poster blue or sun-bleached
ochre. For Big Brother: studio-saturated red or green-screen
green tinted toward the show's distinctive interior light.
Curator's call.

## 2. Rule 1 quota check — make it a script

`plan/bearings.md` "Rule 1 — show coverage quota" defines the
12-show launch list. After this phase, that list lives in code
as well as in prose, and a runnable `pnpm content:quota` script
reports which shows are missing.

Add `scripts/content-quota.ts`:
- Hard-code the 12-show launch list (slug + display name) at
  the top.
- Read `content/shows/*.md` via the existing loaders.
- Print `ok` + a summary if `count(covered) >= 12`.
- Otherwise print `missing N show(s):` and list each missing
  slug + display name, exit `1`.

Wire it into `package.json`:

```
"content:quota": "tsx scripts/content-quota.ts",
```

Do **not** add this to `pnpm verify` — the launch quota is a
content-velocity gate, not a code-correctness gate. Pantheon
ships at 3 shows now and will ship at 12; `pnpm verify` must
stay green throughout.

Colocate a node-test unit test at
`scripts/__tests__/content-quota.test.mjs` exercising the exit
code + the missing-shows list against a temporary content
directory fixture. The smoke test is run by `pnpm test:scripts`
already in the verify gate.

## 3. AUDIT seeding — file the remaining 7 shows

After this phase ships, the remaining missing shows are: The
Bachelor, The Bachelorette, The Traitors (US), Love Island
(US), Love Island (UK), The Great British Bake Off, Project
Runway, The Challenge. (`pnpm content:quota` will confirm.)

Append `Pending` content-gap rows to `plan/AUDIT.md`, one per
missing show, with `category: content-gaps`, `source: self`,
and a score per the standard formula. Use this format:

```
- [ ] [MED] launch-quota gap — content/shows/<slug>.md missing
  (Rule 1) (category: content-gaps, source: self, score: <s>) — <commit>
```

`score` per row: `impact 7 × ease 6 / 10 = 4.2` (each missing
show is independently easy to ship via /ship-content, and each
adds tangible launch-readiness).

This is what makes "Rule 1 quota check goes live" — there are
now real audit rows the loop can drain.

## 4. ship-content.md — drop the facade-grammar dead text

`skills/ship-content.md` §3 "For Rule 1 (new show)" still
references the May 2026 facade grammar (`hero_motifs`,
`palette: primary/ink/paper` as old shape, `network`, `format`,
`aired_season_count`, `air_year_start`, `air_year_end`) and
talks about commissioning a brander for the show facade.

Replace that section with the post-19a seven-field contract.
The skill body (§1) already correctly says "seven fields per
`design/CLAUDE.md`" — only the sub-brief in §3 needs aligning.

Drop the brander-for-show-facade brief entirely; brander only
runs for the shared brand mark + favicons + OG composites
now.

## 5. Tests

- `scripts/__tests__/content-quota.test.mjs` — exit code + the
  missing-shows list against a temp fixture.
- `src/content/__tests__/loaders.test.ts` — confirm the two new
  shows load cleanly (extend the existing fixture-count
  assertions if any; add a parse-roundtrip assertion if not).

No e2e contributions needed beyond the smoke walker
auto-extension — the new show URLs `/shows/amazing-race` and
`/shows/big-brother` get covered because
`apps/e2e/src/fixtures/canonical-urls.ts` is derived from the
content loaders.

## 6. Verify + commit + push

```
pnpm verify
git add content/shows/amazing-race.md content/shows/big-brother.md
git add scripts/content-quota.ts scripts/__tests__/content-quota.test.mjs
git add package.json plan/AUDIT.md skills/ship-content.md
git commit -m "feat: phase 20 — first show backfill + Rule 1 quota check"
git push origin main
pnpm deploy:check
```

Tick `[x]` for Phase 20 in `plan/steps/01_build_plan.md`.

## 7. Decisions

- **Frontmatter-only for the two shows** matches the depth of
  top-chef and dragrace from phase 5. Canon + season backfill
  is a Rule 2 / Rule 3 content-gap drain, not the launch-Rule-1
  unit. Mixing them in one phase commit would couple two
  concerns and slow the iterate cadence.
- **`pnpm content:quota` is out of the verify gate** because
  the launch quota is a content-velocity signal, not a
  correctness gate. Putting it in verify would red-CI Pantheon
  every commit until 12 shows ship — a meaningless block on
  unrelated work.
- **Palette choice is the curator's call**, not derived from
  some external palette catalog. Two human-readable
  constraints (WCAG AA + distinct from siblings) keep the
  identity coherent without micromanaging the editorial choice.
