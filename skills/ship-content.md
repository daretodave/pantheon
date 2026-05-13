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
stream of content-gap findings until Pantheon's corpus reaches
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

## 3. Autonomy contract

- **Empty queue → exit cleanly.** Log "no content queue" and
  return. The caller falls through to the next target.
- **Ambiguous gap → pick the top row.** If two rows tie on
  score, prefer the one with the older filing date.
- **Show coverage gap (Rule 1) → ship one full show per tick.**
  Show metadata (seven fields per `design/CLAUDE.md`) + initial
  canon stub + 3 seed season blurbs. ~5-7 files in one commit.
  **No facade work** — the visual identity is color + typography
  + the shared brand mark; per-show illustration is prohibited.
- **Canon completeness (Rule 2) → ship a batch of 3-5 season
  blurbs.** Amortize the show context lookup across multiple
  blurbs in one tick.
- **Themed list (Rule 3) → ship one themed list per tick.**
  10-entry ordered list with cross-show entries.
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

**`content-curator` brief:**
- Target: write `content/shows/<slug>.md` frontmatter +
  `content/shows/<slug>/canon.md` initial stub +
  `content/shows/<slug>/seasons/01-<title>.md`,
  `02-<title>.md`, `03-<title>.md` (the first 3 aired
  seasons).
- Required frontmatter fields (per bearings facade grammar):
  `slug`, `name`, `network`, `format`, `hero_motifs`
  (3-element array), `palette` (primary/ink/paper hex codes —
  see brander brief for coordinates), `aired_season_count`,
  `status` (airing | concluded | hiatus), `tagline` (single
  sentence), `air_year_start`, `air_year_end`.
- Voice: knowledgeable peer, confident-warm-plain.
- Spoiler discipline: NO winners, NO eliminations, NO plot,
  NO deaths, NO twists, NO finale outcomes, NO relationship
  outcomes. Format changes / casting energy / location /
  tonal shifts / structural innovations are fair.
- Word counts:
  - Show tagline: ≤140 chars.
  - canon.md per-rank rationale: 80-120 words.
  - Each season blurb: 50-80 words. STRICT.
- Output paths exact: `content/shows/<slug>.md`,
  `content/shows/<slug>/canon.md`,
  `content/shows/<slug>/seasons/NN-<title>.md`.

**`brander` brief:**
- Show slug + name + 3 hero_motifs (which curator must
  decide first — pass via brief).
- Generate facade per the Pantheon facade grammar (1200×800
  viewBox, four slots: column / pediment / frieze / ornament).
- Derive the sigil by cropping the pediment + center column
  to a 320×320 square.
- Generate 3 ornament SVGs reusable on season pages.
- Pick the show's 3-color palette: primary (warm, distinct
  from any sibling show), ink (deep, paper-tinted), paper
  (warm-tinted background slightly off Pantheon's default).
  WCAG AA contrast against `tokens.json` ink scale required.
- Output paths exact: `public/shows/<slug>/facade.svg`,
  `public/shows/<slug>/sigil.svg`,
  `public/shows/<slug>/ornament-{1,2,3}.svg`.

After both return, confirm:
1. All required files exist.
2. The frontmatter `palette` matches the brander's chosen
   palette. (If they diverged, brander wins; rewrite frontmatter
   palette block.)
3. `pnpm content:check` validates the new frontmatter.

#### For Rule 2 (canon completion — batch)

**`content-curator` brief:**
- Target show slug + list of missing season numbers (3-5).
- For each: write `content/shows/<slug>/seasons/NN-<title>.md`
  with 50-80 word blurb. Spoiler discipline same as Rule 1.
- Update `content/shows/<slug>/canon.md` to include each
  newly-blurbed season's `canonical_position` (estimate based
  on tonal/structural commentary; canon position can shift
  later via `/iterate`).

**No `brander` for canon completion.** Existing show's facade
+ ornaments cover the new season pages.

#### For Rule 3 (themed list)

**`content-curator` brief:**
- Theme slug + theme description.
- Write `content/themes/<slug>.md` with 10-entry ordered list.
- Each entry: `{ show: <slug>, season: <n>, position: <1..10>,
  why: "<60-100 words explaining placement, spoiler-safe>" }`.
- Cross-show by design — no themed list should pull >3
  entries from one show.

**No `brander`** unless this is the FIRST themed list (in
which case spawn brander to create `public/themes/<slug>/banner.svg`
— a horizontal composition borrowing motifs from the top-3
shows in the list).

#### For Rule 4 (facade backfill)

**`brander` only.**
- Target show slug.
- Read `content/shows/<slug>.md` for hero_motifs + existing
  palette declarations.
- Generate facade + sigil + ornaments per the facade grammar.
- Replace placeholder `<!-- placeholder -->` markers if present.

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

Commit message (lowercase "pantheon" in subject; rule 6 in
agents.md):

```
content: <unit-type> — <show-or-theme-name>

- Audit row: rule-<N> content-gap, score <X>.
- Rule: <Rule 1 show coverage | Rule 2 canon completion | Rule 3 themed list | Rule 4 facade backfill>.
- Files shipped:
  - <list>
- Brander palette: primary <#hex>, ink <#hex>, paper <#hex>.
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
gh issue comment "$N" --body "Shipped: $(git rev-parse HEAD~1) → https://pantheon-coral.vercel.app/<route>"
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
6. **Brander palette wins over content-curator's frontmatter
   guess.** Rewrite frontmatter to match.
7. **Word counts are strict.** Blurbs 50-80 words; canon
   rationales 80-120 words. The verify gate's
   `pnpm content:check` enforces if a `wordCount` schema
   constraint is in place.

## 6. Quick reference

```bash
# Read state
plan/AUDIT.md                                 # content-gap queue
plan/bearings.md                              # voice + spoiler rules + facade grammar
content/shows/                                # existing shows
content/themes/                               # existing themes
public/shows/<slug>/                          # facade + sigil + ornaments

# Write
content/shows/<slug>.md                       # via content-curator (Rule 1)
content/shows/<slug>/canon.md                 # via content-curator (Rules 1, 2)
content/shows/<slug>/seasons/NN-<title>.md    # via content-curator (Rules 1, 2)
content/themes/<slug>.md                      # via content-curator (Rule 3)
public/shows/<slug>/{facade,sigil}.svg        # via brander (Rules 1, 4)
public/shows/<slug>/ornament-{1,2,3}.svg      # via brander (Rules 1, 4)
plan/AUDIT.md                                 # tick the addressed row

# Sub-agents
Agent({ subagent_type: "content-curator", prompt: "..." })
Agent({ subagent_type: "brander", prompt: "..." })

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
5. **brander fails.** Ship placeholder facade + AUDIT row
   `[brander-retry] <slug>` (severity LOW).
6. **No content-gap rows scoring ≥ 3.0.** Exit cleanly. Log
   "no content queue." Caller falls through.
7. **`git pull` divergence.** Stop and report; do not
   blind-rebase.
8. **Spoiler check fails for a blurb in review.** Reject the
   curator output, retry once with explicit redaction notes,
   else block the row.
