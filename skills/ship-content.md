# Skill: ship-content

> **Full autonomy, content-velocity mode.** When invoked
> (directly, via `/iterate` content delegation, or via `/march`
> Step 3b.5), you have authority to ship one content unit
> end-to-end — no review checkpoint. Read the content-gap
> queue, classify the unit, spawn agents in parallel, verify,
> commit, push. The loop fires again on the next gap.

## 1. Purpose

The three live content-velocity rules in `plan/bearings.md`
"Content velocity & editorial cadence" generate a continuous
stream of content-gap findings until tiered.tv's corpus reaches
its launch quota (12 shows, every aired season blurbed, ≥10
themed lists). Rule 4 (facade completeness) is **retired** —
per-show illustration is prohibited per `design/CLAUDE.md`. The
visual identity is color + typography + the shared brand mark,
not per-show art.

This skill codifies the proven shape — gap → classify → spawn
`content-curator` → verify → commit → push — as a single
autonomous flow.

Every tick is identical in shape; the variables are which
content unit (show / season-batch / theme) and which show/theme
it targets.

## 2. Invocation

```
/ship-content                # dispatch from content-gap queue
```

Called from:
- `/march` Step 3b.5 (direct dispatch when content-gap rows
  score ≥ 3.0)
- `/iterate` Step 3 delegation (when the top-scored finding
  is `category: content-gaps`)
- Direct user invocation when biasing toward content velocity

## 2.5 Canon discipline (31a)

The **always-working rule:** every show with one or more
seeded seasons should ALWAYS carry a `canon.md` ranking those
seasons. A new show ships with at least one season AND a
`canon.md` placing that season at #1 in the same commit. A
season backfill batch updates `canon.md` to slot every new
season at its correct rank, shifts the surrounding entries by
±1, and rewrites every shifted season's `canonical_position`
to match. The lax-mode invariant in `scripts/content-check.ts`
fails on conflict (mismatched ranks, dangling refs, duplicate
slugs); the strict-mode flip at the end of 31b makes the
canon-presence requirement binding.

The **filename-as-slug** convention: every season file is
named `NN-<slug>.md` (e.g. `04-marquesas.md`). The `<slug>`
suffix becomes the canonical URL slug — the site routes every
season at `/shows/<show>/season/<slug>`, and a digit-form URL
(`/season/4`) 308s to the slug form. Slugs are kebab-case
ASCII; transliterate accents (`kaoh-rong`, not `kaôh-rōng`).
Rename the file when you'd rename the URL — the override
field on the schema is reserved for cases where renaming
would break a legacy URL already in the wild.

Pre-flight checklist before committing a content tick:

```
[ ] every new/updated season has canonical_position set
[ ] every new/updated season's canonical_position matches its
    canon entry's rank (or the canon was updated to match)
[ ] canon.md was opened, the new season was inserted at the
    editorially-correct slot, and surrounding ranks shifted
[ ] every season filename is `NN-<slug>.md` with kebab-case
    ASCII slug; no spaces, no unicode
[ ] pnpm content:check passes (slug uniqueness + canon-rank
    sync; lax mode tolerates absence of canon)
```

## 3. Autonomy contract

- **Empty queue → exit cleanly.** Log "no content queue" and
  return. The caller falls through to the next target.
- **Ambiguous gap → pick the top row.** If two rows tie on
  score, prefer the one with the older filing date.
- **Show coverage gap (Rule 1) → ship one full show per tick.**
  Show metadata (twelve fields per `CLAUDE.md` — seven core +
  the editorial block `tier` / `network` / `est_year` /
  `genre_tag` / `featured`) + a populated `canon.md` ranking
  every seeded season + the seeded season blurbs themselves.
  31a's always-working rule: the new show ships with at least
  one season AND a `canon.md` placing that season at #1 with a
  full 80-120 word rationale, all in the same commit. ~5-7
  files in one commit. New shows default `tier: B`,
  `featured: false`; promotion to A happens inline with phase
  26 when canon + season coverage clears the floor. **No
  facade work** — the visual identity is color + typography +
  the shared brand mark; per-show illustration is prohibited.
- **Canon completeness (Rule 2) → ship a batch of 3-5 season
  blurbs.** Amortize the show context lookup across multiple
  blurbs in one tick. **Per 31a's canon discipline:** every
  blurbed season gets `canonical_position` filled at the rank
  it deserves, and the show's `canon.md` is opened in the
  same commit to insert each new season at the
  editorially-correct slot — surrounding ranks shift, every
  shifted season's `canonical_position` is rewritten to
  match. The pre-flight check (§2.5) gates the commit.
- **Themed list (Rule 3) → ship one themed list per tick** at
  the 19f schema — `title`, `description`, `tagline`,
  `category` (one of `tone` / `craft` / `era` / `single`),
  `sentiment`, `status`, `curator` byline, `last_revised` ISO,
  `featured` boolean (default false), `related` (0–2 slugs in
  practice; cap is 4), and 10–24 entries each with `title` +
  `blurb` + optional `season_label`. `category` and
  `last_revised` are non-negotiable — `pnpm content:check`
  rejects themes missing either, and the filter chips +
  index-last-revised stat both depend on them.
- **Rule 4 retired.** Historical content-gap rows tagged
  `category: facade-gap` are auto-marked `[x] superseded by 19a`
  and skipped. Do not file new ones.
- **content-curator returns malformed output → retry once**
  with a more explicit brief. If still malformed after retry,
  mark the row `[blocked: content-curator]`, skip to the
  next-highest content-gap row, ship that.

## 4. Procedure

### Step 0 — Sync

```bash
git pull --ff-only origin main
```

If divergence, stop per §8.

### Step 1 — Read the content-gap queue

Open `plan/AUDIT.md`. Collect all `Pending` content-gap
findings (rows with `category: content-gaps`, not prefixed
`[x]`). Score them: `impact × ease / 10`. Apply the bias
multiplier if the AUDIT.md header reads:

```
> Bias: content-gaps (set via oversight ...)
```

(Multiply each content-gap score by 1.5 before ranking.)

Confirm the top row maps to one of the 4 bearings rules:

- **Rule 1 — show coverage:** `count(content/shows/*.md) < 12`
  AND missing show is in the launch list (per bearings).
  Pick the highest-priority missing show (ordered by US
  cultural footprint: Survivor → Amazing Race → Big Brother →
  Bachelor → Bachelorette → Top Chef → Drag Race → Traitors
  → Love Island US → Love Island UK → Bake Off → Project
  Runway → The Challenge).
- **Rule 2 — canon completeness:** Some `content/shows/<slug>/seasons/`
  has fewer entries than `show.aired_season_count` OR
  `content/shows/<slug>/canon.md` doesn't include every season
  in `canonical_position`. Pick the show with the largest gap.
- **Rule 3 — themed lists:** `count(content/themes/*.md) < 10`.
  Pick the next theme from `plan/PHASE_CANDIDATES.md` "Seed
  candidates" or invent one (cross-show pattern: best
  premieres, best finales, best returnee seasons, best
  villain editing, best post-merge runs, best location
  reveals, etc.).
- **Rule 4 — retired.** Skip any row tagged
  `category: facade-gap` (auto-mark `[x] superseded by 19a`).
  Per-show illustration is prohibited per `design/CLAUDE.md`.

If no content-gap rows or all score < 3.0: exit cleanly. Log
"no content queue — falling through" and return.

### Step 2 — Mirror to GitHub (best-effort)

Open a GitHub issue documenting the unit being shipped:

```bash
N=$(gh issue create \
    --title "content: <unit-type> — <show-or-theme-name>" \
    --label content,loop-queued \
    --body-file /tmp/content-issue-body.md \
    --json number --jq .number) || N=""
echo "content-issue: ${N:-skip}"
```

The body explains: source row, rule, files about to ship.
On failure: log, set `N=""`, continue. Mirror is best-effort.

### Step 3 — Spawn sub-agents in parallel

Both run concurrently; their inputs are independent.

#### For Rule 1 (new show)

**`content-curator` brief** (twelve-field contract per
`CLAUDE.md`):

- Target paths — Rule 1 ships these together (always-working
  rule, 31a):
  - `content/shows/<slug>.md` (required)
  - `content/shows/<slug>/canon.md` (REQUIRED — even a
    single-entry canon ranking the seeded season at #1, with
    a full 80-120 word rationale)
  - `content/shows/<slug>/seasons/NN-<slug>.md` (REQUIRED —
    at least one seeded season, filename `NN-<slug>.md`
    where `<slug>` is kebab-case ASCII; the slug becomes the
    canonical URL — see §2.5 filename convention).
    `canonical_position` filled to match the canon rank.
- Frontmatter fields, **exactly twelve**, no more:
  - `slug` (lowercase kebab-case)
  - `name` (display name)
  - `palette` — object with `paper`, `ink`, `primary` hex
    codes (the show's tinted-chrome editorial palette; WCAG
    AA contrast against the ink/paper pair; distinct from
    every sibling show)
  - `seasons` (integer count of aired/airing seasons)
  - `status` — `airing` | `ended` | `hiatus`
  - `blurb` — ≤120 chars, the short hero subtitle
  - `tagline` — ≤280 chars, the longer editorial sentence
  - `tier` — `S` | `A` | `B`. New shows default `B`;
    promotion to A is inline with phase 26 once canon +
    seasons clear the floor. Reserve `S` for format-defining
    shows (currently survivor, dragrace).
  - `network` — string, the airing channel (CBS / MTV / Bravo
    / Peacock / ITV2 / Channel 4 / ABC, etc.)
  - `est_year` — int, the first-aired year
  - `genre_tag` — short editorial label, e.g.
    "Reality competition", "Culinary competition", "Dating"
  - `featured` — bool. **Exactly one show in the index has
    `true`.** New shows default `false`. To rotate the home
    hero, flip the existing featured to `false` and the new
    one to `true` in the same commit.
- Voice: knowledgeable peer, confident-warm-plain. No
  exclamation points.
- Spoiler discipline P0: NO winners, NO eliminations, NO
  plot, NO twists, NO finale outcomes, NO relationship
  outcomes. Format changes / casting energy / location /
  tonal shifts / structural innovations are fair.

**No `brander` for new shows.** Per-show illustration is
prohibited by `design/CLAUDE.md` Hard Rule 1. The visual
identity is **color + typography** plus the shared tiered.tv
brand mark — the palette in the frontmatter is the entire
visual contribution. Do not commission per-show SVG.

After the curator returns, confirm:

1. The two new files parse against
   `showFrontmatterSchema` in `src/content/schemas.ts`.
2. `pnpm content:check` validates the new frontmatter.
3. `pnpm content:quota` reports one fewer missing show.

#### For Rule 2 (season backfill — high-volume drain)

**`content-curator` brief:**
- Target show slug + list of missing season numbers (**up to
  10 per tick** post phase 26a — drain hard until the show's
  season floor is cleared).
- For each season, write
  `content/shows/<slug>/seasons/NN-<title>.md` with:
  - Required: `show`, `number`, `title`, `body` (50-80 words,
    spoiler-safe).
  - `display_title` if the title has a natural accent point
    (e.g. `vs.`, `&`, a colon): set
    `display_title: "Foo <em>vs.</em><br/>Bar"`. Only `<em>`
    and `<br/>` permitted; the renderer turns `<em>` into the
    show-primary italic accent.
  - Stats block — fill whatever's public-record: `location`,
    `host`, `premiere_date`, `ep_count`, `aired_year`,
    `episodes`. Captions are optional but well-rewarded — they
    surface as subtext under each stat tile per
    `design/tiered.tv · Heroes vs. Villains.html`.
  - Editorial block — `eyebrow`, `lede`, `pull`,
    `format_summary`, `format_caption`, `cast_size`,
    `cast_size_caption`, `host_caption`. Omit any field where
    you don't have a confident answer; the renderer collapses
    gracefully.
  - `episode_heat` if you can rank ep intensity from public
    discourse (length = `ep_count`); skip otherwise.
  - `watch_list` of 3-6 items is the single highest-value
    editorial addition — 1-2 sentence pointers at moments worth
    attention. Spoiler discipline P0: pointers, not outcomes.
- Update `content/shows/<slug>/canon.md` IN THE SAME COMMIT —
  insert each new season at the editorially-correct rank, shift
  the surrounding entries by ±1, and rewrite every shifted
  season's `canonical_position` so the lax-mode content-check
  passes. The 31a canon discipline (§2.5) is binding for every
  Rule 2 batch from this phase forward.

**No `brander` for canon completion.** Per-show illustration
is prohibited; the show's palette + the shared brand mark are
the entire visual contribution.

#### For Rule 3 (themed list)

**`content-curator` brief:**
- Theme slug + theme `title` + 1-line `description`.
- Write `content/themes/<slug>.md` at the 19f schema:
  - Theme fields: `slug`, `title`, `description`, `tagline`
    (1–2 sentences, one optional `<b>...</b>`),
    `category` (`tone` / `craft` / `era` / `single`),
    `sentiment` (default `hold`), `status` (default `stable`),
    `curator` (default `"tiered.tv Editors"`),
    `last_revised` (today's ISO date), `featured` (default
    false), `related` (0–2 sibling theme slugs).
  - For `category: era` lists, include `era_range: [<year>,
    <year>]`. Required.
  - 10–24 entries (cap is 30). Each entry:
    `{ show, season, rank, title (≤140 chars, spoiler-safe
    framing), blurb (≤280 chars, 1–3 sentences),
    season_label? (e.g. "S07 · Texas") }`.
- Cross-show by design — no `tone` or `craft` themed list
  should pull >3 entries from one show. `single` lists are
  the exception by definition.

**No `brander` for themed lists.** Per-show illustration is
prohibited (`design/CLAUDE.md` Hard Rule 1); themed-list
banner art was never shipped and should not be reintroduced.
The list page does its visual work through type + the
per-show bullet color.

#### For Rule 4 (retired — facade grammar)

Skip any audit row tagged `category: facade-gap` or referencing
`hero_motifs`. Mark `[x] superseded by 19a` and move on. See
the autonomy contract §3 for the canonical retirement note;
the May 2026 facade grammar was prototyped and rejected.

### Step 4 — Validate

```bash
pnpm content:check
```

Validates frontmatter for every content/*.md against Zod
schemas. If new tags or fields surface, this fails clean —
fix the schema if the new field is intentional, else fix the
content.

### Step 5 — Verify

```bash
pnpm verify
```

Full gate: typecheck → test:run → content:check → build → e2e.

The new show / season / theme automatically extends the smoke
walker via `apps/e2e/src/fixtures/canonical-urls.ts` (which
reads from the content loaders). New URLs get covered "for
free."

Iterate up to 3 times on the same root cause; stop per §8.

### Step 6 — Commit + push

Stage explicitly. Never `git add .`:

```bash
git add content/shows/<slug>.md
git add content/shows/<slug>/canon.md
git add content/shows/<slug>/seasons/
git add public/shows/<slug>/
# only if a themed list:
git add content/themes/<slug>.md
```

Commit message (lowercase "tiered" in subject; rule 6 in
agents.md):

```
content: <unit-type> — <show-or-theme-name>

- Audit row: rule-<N> content-gap, score <X>.
- Rule: <Rule 1 show coverage | Rule 2 canon completion | Rule 3 themed list>.
- Files shipped:
  - <list>
- Palette (Rule 1 only): paper <#hex>, ink <#hex>, primary <#hex>.
- <Optional: any decision the agent made worth noting>

Closes #<N if mirrored>
```

For cloud-loop ticks, append the `Cloud-Run:` trailer per
agents.md §2 carve-out.

### Step 7 — Tick the audit

Flip the addressed finding to `[x]` in `plan/AUDIT.md` and
append the commit hash. Commit separately:

```bash
git add plan/AUDIT.md
git commit -m "audit: content-gap addressed — <unit> for <show-or-theme>"
git push origin main
```

### Step 8 — Confirm deploy

```bash
pnpm deploy:check
```

- **Exit 0 (ready):** continue to close-comment.
- **Exit 1 (error):** read log + patch + re-push. Up to 3
  iterations on the same root cause; then stop per §8.
- **Exit 2 (timeout):** surface, continue.
- **Exit 3 (config):** `VERCEL_TOKEN` missing. Stop per §8.

If `$N` was set, close-comment the issue:

```bash
gh issue comment "$N" --body "Shipped: $(git rev-parse HEAD~1) → https://tiered.tv/<route>"
gh issue close "$N"
```

Failure of close-comment is a warning, not a blocker.

### Step 9 — Done

Return cleanly. The next loop tick re-dispatches to the next
content-gap row (or another verb if the queue is drained).

## 5. Hard rules

1. **One unit per tick.** Multi-show or multi-theme commits
   are unreviewable.
2. **Spoilers are P0.** Every blurb passes the spoiler
   discipline in agents.md §7. Ambiguous → redact, don't ship.
3. **`pnpm content:check` is non-negotiable.** Fix schemas
   when new fields are intentional; fix content when they're
   not.
4. **Verify gate is non-negotiable.** No `--no-verify`.
5. **No `Co-Authored-By:` trailers, no emojis** (agents.md §2).
   Cloud-loop ticks include the `Cloud-Run:` trailer; nothing
   else.
6. **No per-show illustration.** `design/CLAUDE.md` Hard Rule
   1 — color + typography only, with the shared tiered.tv
   brand mark. The frontmatter `palette` is the entire
   visual contribution for a new show.
7. **Word counts are strict.** Blurbs 50-80 words; canon
   rationales 80-120 words. The verify gate's
   `pnpm content:check` enforces if a `wordCount` schema
   constraint is in place.

## 6. Quick reference

```bash
# Read state
plan/AUDIT.md                                 # content-gap queue
plan/bearings.md                              # voice + spoiler discipline + content velocity rules
content/shows/                                # existing shows
content/themes/                               # existing themes

# Write
content/shows/<slug>.md                       # via content-curator (Rule 1)
content/shows/<slug>/canon.md                 # via content-curator (Rule 2)
content/shows/<slug>/seasons/NN-<slug>.md     # via content-curator (Rule 2) — filename slug = URL slug
content/themes/<slug>.md                      # via content-curator (Rule 3)
plan/AUDIT.md                                 # tick the addressed row

# Sub-agents
Agent({ subagent_type: "content-curator", prompt: "..." })

# Verify + commit + push
pnpm verify
git add <explicit files>
git commit -m "<message>"
git push origin main
```

## 7. Call flow from `/march` and `/iterate`

```
/march
  Step 3a: pending phase?            → /ship-a-phase
  Step 3b: pending data?             → /ship-data
  Step 3b.5: content-gap rows ≥3?    → /ship-content
  Step 3c: expand due?               → /expand
  Step 3d: else                      → /iterate

/iterate
  Step 3 dispatch (content-gap)      → /ship-content
  failure-mode 6 (no work, bold)     → /ship-content
                                       then /expand if no content queue
```

## 8. Failure modes — when to stop

1. **`pnpm verify` fails ≥ 3 times on the same root cause.**
   Open a GitHub issue and exit.
2. **`pnpm deploy:check` fails ≥ 3 times after verify passes.**
   Same — open an issue, exit.
3. **`VERCEL_TOKEN` missing** (deploy:check exit 3). Stop;
   report config gap.
4. **content-curator returns malformed output.** Retry once
   with explicit brief. If still malformed, mark row
   `[blocked: content-curator <ISO timestamp>]`, skip to next
   row, ship that.
5. **No content-gap rows scoring ≥ 3.0.** Exit cleanly. Log
   "no content queue." Caller falls through.
6. **`git pull` divergence.** Stop and report; do not
   blind-rebase.
7. **Spoiler check fails for a blurb in review.** Reject the
   curator output, retry once with explicit redaction notes,
   else block the row.
