# Phase 23 — Themed lists round 1 (5 lists)

> **Outcome.** Five themed lists land — best premieres, best
> finales, best post-merge runs, best returnee seasons, best
> newbie casts — drawing from the curated Survivor corpus. After
> this phase, `content/themes/*.md` count goes from 2 → 7,
> draining bearings Rule 3 to 7/10. To make returnee + finale +
> premiere angles substantiable, four additional Survivor season
> files seed alongside (Pearl Islands S7, Heroes vs. Villains
> S20, Cambodia S31, Winners at War S40), bringing the curated
> Survivor season count from 4 → 8.
>
> **Why this phase exists.** Phases 20–22 completed Rule 1
> (launch-quota show coverage, 13/13 shows live). The loop now
> transitions toward Rule 3 (themed list quota, ≥10 lists at
> launch). Round 1 lays down five lists that exercise the schema
> shapes the curator-facing guidance documents — `category`
> spread across `craft` + `tone`, sentiments varied, `featured`
> set on the strongest two, `related` cross-links wired in.
> Round 2 (phase 24) completes the quota at 10/10.
>
> **No facade work, no cross-show seeding into other shows.**
> Per `design/CLAUDE.md` Hard Rule 1, visual identity is color +
> typography + the shared brand mark. Per the build plan's
> bearings Rule 2 phasing, season-blurb backfill for the other
> twelve shows is deferred to phase 25+; round 1 themed lists
> draw from Survivor only. This is the precedent set by
> `firsts.md` (filed in phase 19f as a cross-show theme but
> shipping with only Survivor entries — the lists' *angle* is
> cross-show; the *roster* draws from what's curated today).

## 1. The five themed lists

Mirror the schema + voice pattern from
`content/themes/firsts.md` and
`content/themes/survivor-pillars.md`. Required frontmatter per
phase 19f schema: `slug`, `title`, `description`, `tagline` (≤
360 chars, at most one `<b>…</b>` span), `category` (one of
`tone | craft | era | single`), `sentiment`, `status`,
`curator`, `last_revised` (ISO), `featured` (bool), `related`
(0-4 slugs), optional `era_range` (required when category=era),
`entries` (1-30). Each entry needs `show`, `season`, `rank`,
`title` (≤140 chars), `blurb` (≤280 chars), optional
`season_label`.

| Slug              | Title                       | Category | Sentiment | Featured | Anchor entries           |
|-------------------|-----------------------------|----------|-----------|----------|--------------------------|
| `best-premieres`  | Premieres that earned it    | craft    | warm-up   | true     | S1, S41, S7              |
| `best-finales`    | Finales that stuck the landing | craft | verdict   | true     | S20, S40, S45            |
| `best-post-merge` | Post-merge runs that delivered | tone  | consensus | false    | S28, S20, S45            |
| `best-returnees`  | Returnee seasons that paid off | tone  | hold      | false    | S20, S31, S40            |
| `best-newbie-casts` | Newbie casts that arrived ready | tone | warm-up | false    | S1, S7, S41, S45         |

Per-entry size: 3-5 entries per list. Voice: knowledgeable peer,
plain-spoken, no exclamation points. **Spoilers are P0** —
taglines + entry titles + blurbs describe what the season *is*
or *what it added to the show's grammar*, never who wins, who
gets voted out, or which players survive the merge.

The `related` cross-link spread:

- `best-premieres` → related: `[firsts, best-newbie-casts]`
- `best-finales` → related: `[best-returnees, survivor-pillars]`
- `best-post-merge` → related: `[survivor-pillars, best-returnees]`
- `best-returnees` → related: `[best-finales, best-post-merge]`
- `best-newbie-casts` → related: `[firsts, best-premieres]`

## 2. Four new Survivor season files

The five themes reference four Survivor seasons that don't yet
have season files. Seed them in this phase under
`content/shows/survivor/seasons/`:

- `07-pearl-islands.md` — S7, premiered 2003, Pulau Tiga
  follow-up era; iconic outlaw-themed cast; introduced the
  Outcasts twist.
- `20-heroes-villains.md` — S20, premiered 2010; the
  ur-returnee season the entire franchise's all-stars era is
  measured against.
- `31-cambodia.md` — S31, "Second Chance," premiered 2015,
  fan-voted cast; the second-wave returnees season the modern
  era treats as a touchstone.
- `40-winners-at-war.md` — S40, premiered 2020; 20 former
  winners, edge-of-extinction mechanics, the franchise's
  milestone-50 retrospective compressed into one season.

Each season file: 50-80 word body per bearings Standing
Decision, frontmatter per `seasonFrontmatterSchema`
(`show`, `number`, `title`, `premiere_date`, `ep_count`,
`location`, `host`, `format_changes`). Voice consistent with
the existing four Survivor season files.

These seedings are deliberate: phase 23 needs entries for
returnees + finales + premieres that the existing four season
files can't substantiate alone. Rule 2 (canon completeness)
remains a deferred drain — phase 23 does not seed canon entries
for these new seasons, only season files.

## 3. Bearings Rule 3 progress

The bearings `Content velocity & editorial cadence` Rule 3
section doesn't need editing — it states the quota (≥10 themed
lists) and the schema contract. The count is implicit from
`content/themes/*.md`. Updating the bearings copy is
unnecessary churn.

## 4. AUDIT updates

`plan/AUDIT.md` has no Pending content-gap rows for themed
lists today (phase 22 drained all Rule 1 rows; Rule 3 rows
haven't been filed because `/iterate` files them only when a
quota check is run — which happens via `pnpm content:quota`,
currently Rule-1-only). No AUDIT ticks needed in this commit.

## 5. Tests

No new unit tests required. `pnpm content:check` validates the
new theme files against `themeFrontmatterSchema` and the new
season files against `seasonFrontmatterSchema`. The smoke
walker covers `/themes/<slug>` automatically because
`apps/e2e/src/fixtures/canonical-urls.ts` derives from the
content loaders.

If `pnpm content:check` fails because a referenced season is
missing, the brief's contract is broken — add the missing
season file in the same commit, do not relax the validator.

## 6. Verify + commit + push

```
pnpm verify
git add content/themes/best-premieres.md \
        content/themes/best-finales.md \
        content/themes/best-post-merge.md \
        content/themes/best-returnees.md \
        content/themes/best-newbie-casts.md \
        content/shows/survivor/seasons/07-pearl-islands.md \
        content/shows/survivor/seasons/20-heroes-villains.md \
        content/shows/survivor/seasons/31-cambodia.md \
        content/shows/survivor/seasons/40-winners-at-war.md
git commit -m "feat: phase 23 — themed lists round 1 (5 lists + 4 seed seasons)"
git push origin main
pnpm deploy:check
```

Tick `[x]` for Phase 23 in `plan/steps/01_build_plan.md` in a
separate follow-up commit per `skills/ship-a-phase.md` Step 11.

## 7. Decisions

- **Five Survivor-only themed lists** matches the corpus depth
  today (Survivor is the only show with curated seasons). The
  *angle* of each list is cross-show in spirit — `firsts.md`'s
  precedent — and round 2 (phase 24) can keep this shape or
  shift to cross-show entries once more shows have season
  files.
- **Four new Survivor season files** is the minimum seeding
  required to substantiate the returnee + finale + premiere
  angles. Adding more would pull Rule 2 (canon completeness)
  into a Rule 3 phase. Cap at four.
- **No canon entries seeded for the four new seasons** —
  canon.md drains via Rule 2; conflating it here would balloon
  the phase. The four seed seasons appear in themes but not
  yet in canon — that's intentional and not a validation
  error.
- **`featured: true` on `best-premieres` and `best-finales`** —
  these are the most reader-recognizable angles, suitable for
  the `/themes` overview's Featured row.
- **No `category=era`** — Pantheon's reality corpus spans 2000
  → 2026, plenty of era angles exist (golden age, new era,
  pre-merge era), but they require cross-show context. Round 1
  stays in `craft` + `tone`. Era-category lists wait for
  cross-show seasons.
- **`status: stable`** for all five — Pantheon's editorial
  voice is `growing` only when entries are explicitly planned
  to be added; these five ship complete.
