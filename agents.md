# agents.md

> Entry point for any AI agent landing in this repo cold. Read
> top-to-bottom; standing rules at the top are non-negotiable.

## Standing rules

These apply to every command, every skill, every session. The
skill files repeat them; this is the canonical source.

### 1. Commit and push as a single atomic act

Shipped work that isn't committed is rolled-back work waiting
to happen. Shipped work that's committed but not pushed is
invisible to Vercel and to future loop ticks. The autonomous
loop assumes `origin/main` is the source of truth.

Every shipping skill ends with `git commit` **immediately
followed by** `git push origin main`. No unpushed commits
between ticks. No dirty working tree at end of tick.

### 2. No `Co-Authored-By:` trailers. No emojis.

Plain commit messages, plain code, plain content, plain design
notes. Anywhere.

**One carve-out:** commits shipped from the cloud loop
(`.github/workflows/march.yml`) MUST end with a single trailer:
`Cloud-Run: <run-url>`. The cloud ceiling check uses this
trailer to distinguish cloud-shipped commits from local work.
Nothing else is allowed in the footer.

Local commits (your machine, manual `/march` or skill
invocations) MUST NOT include this trailer.

### 3. The verify gate is non-negotiable

`pnpm verify` runs **before** every commit:

```
typecheck → test:run → build → e2e
```

(Add `data:validate` if a Zod-schema validation script lands.)

Each leg is a hard gate. Hermetic e2e is the load-bearing
piece — it boots the production build on a separate port and
walks every URL with no live network. Never `--no-verify`. Fix
the root cause.

### 4. The deploy gate runs after every push

`pnpm deploy:check` polls Vercel for the deploy at HEAD. Exits
0 ready, 1 error, 2 timeout, 3 config/auth.

Every shipping skill calls it. Red deploy = blocked tick. Read
log, patch root cause, push again. Up to 3 same-root-cause
iterations; then stop per the skill's failure modes.

### 5. No `--no-verify`. No force-push. No destructive resets.

If a hook fails, fix the underlying issue. If `git pull`
diverges, stop and report.

### 5a. Every commit ships unit tests AND contributions to the e2e harness.

This is non-negotiable, not aspirational. "I'll add tests
later" is forbidden. Specifically:

- **Pure helpers** ship in their own `.ts` modules with a
  colocated `__tests__/<name>.test.ts`.
- **React components** ship in folders with sub-section
  components and a colocated `__tests__/<Component>.test.tsx`.
  Prefer 5 small files with clear names over 1 dense file.
- **New URL** added to the contract in
  `plan/bearings.md` → contributes a row to
  `apps/e2e/src/fixtures/canonical-urls.ts` (so the smoke
  walker covers it) AND a row to
  `apps/e2e/src/fixtures/page-reads.ts` (declaring what the
  page asserts: H1, expected element(s), no console errors,
  no horizontal scroll at 375px).
- **New page family** → contributes a dedicated spec under
  `apps/e2e/tests/<family>.spec.ts` with at least one
  per-instance walk and a mobile-reflow check.
- **New schema field on a content or DB record** → ships a
  unit test for the new field's parser AND adds an assertion
  in `page-reads.ts` for any UI surface that renders it.

The verify gate enforces this; reviewers and the next loop
tick depend on it. A commit that touches a new URL family
without adding to the e2e harness gets reverted.

### 6. Pantheon is lowercase in copy when used as a body word.

The brand is "Pantheon" (capital P) at headline / wordmark
positions. In running prose ("…how pantheon ranks seasons…")
keep it lowercase. In commit subjects, lowercase. The single
exception: the literal product name in headers, taglines, and
the `<title>`.

### 7. Spoilers are P0.

Any merged spoiler is a same-day patch. The `spoiler` GitHub
label is the highest-priority signal in `/triage` and
`/iterate`. The OpenAI moderation pre-filter (phase 12) is the
first line; community flag is the second; mod queue is the
third.

Definition of spoiler: winners, eliminations, plot beats,
deaths, twists, finale outcomes, relationship outcomes. Format
changes / casting energy / location / tonal shifts are NOT
spoilers and ARE fair game.

### 8. Database mutations are autonomous.

Pantheon v1 is an experiment. The agent has full authority to:
- Add tables and columns
- Drop tables, drop columns, drop indexes
- Run destructive migrations
- Truncate or delete rows
- **Drop the entire database if a clean rebuild is the simplest path forward**

No confirmation, no question to the user. Every migration is a
committed file in `supabase/migrations/`; the audit trail is
git. Supabase's built-in daily backups (7-day retention on
free tier) are the safety net if a cataclysm needs reversal.
Once Pantheon graduates from experiment, this rule tightens
(see `plan/bearings.md` "Database posture").

### 9. Content stays in `content/`. Data stays in Supabase.

No hardcoded copy in components. No hardcoded data records in
TypeScript files. Everything that's "content" is markdown +
frontmatter under `content/`; everything that's "user-generated
or per-action state" is a Supabase row.

---

## Project

**Pantheon** — A spoiler-free home for ranked TV seasons. Reality
genre cluster at launch. Live at https://pantheon-coral.vercel.app.

The product spec is `spec.md` at the repo root. Read it once.

The promise (reinforced at every depth — pediment flame, hero
headline, shield pill, vote question, inline comment reminder):
**The seasons, ranked. No spoilers.**

## Repo shape

```
content/             Show metadata, season blurbs, themed lists. Markdown + frontmatter.
public/              Static assets — generated favicon set, sigils, OG images.
src/                 Next.js App Router source.
supabase/            Schema migrations + RLS policies + seed.
scripts/             deploy-check.mjs, build-icons.mjs.
plan/                Build plan, phase briefs, audit, critique queues.
skills/              Source-of-truth skill files invoked by slash commands.
.claude/             Claude Code slash commands and sub-agent definitions.
.github/             Workflow + issue templates.
design/              Design exports (user-emitted, async). Authoritative.
setup/               External-service runbooks. Pre-flighted dashboards.
```

## How work happens

Pantheon is **driven autonomously** by a small set of skills.
You don't normally edit files by hand; you invoke a skill that
does the right thing end-to-end.

### Skills (the verbs)

| Skill | Source of truth | What it does |
|---|---|---|
| `ship-a-phase` | `skills/ship-a-phase.md` | Ship one phase from the build plan. |
| `ship-data` | `skills/ship-data.md` | Ship one Supabase migration or data ops change. |
| `ship-content` | `skills/ship-content.md` | Ship one content unit (show, season blurbs, themed list, missing facade). Content velocity. |
| `plan-a-phase` | `skills/plan-a-phase.md` | Refine the next phase brief, no code. |
| `iterate` | `skills/iterate.md` | Audit + ship one improvement. |
| `critique` | `skills/critique.md` | External-observer pass; writes to `plan/CRITIQUE.md`. |
| `triage` | `skills/triage.md` | Issue review; routes to backlogs. |
| `expand` | `skills/expand.md` | Plan-expansion pass; proposes phase candidates. |
| `march` | `skills/march.md` | Outer dispatcher: triage → critique → phase → data → content → expand → iterate. |
| `oversight` | `skills/oversight.md` | **User-in-the-loop.** The only skill that asks anything. |
| `jot` | `skills/jot.md` | Append a free-text observation to `plan/CRITIQUE.md`. |

### Invocation

```
/ship-a-phase                 # ship next pending phase
/ship-data                    # ship next Supabase change (migration / RLS / data fix)
/ship-content                 # ship next content gap (show / canon / theme / facade)
/plan-a-phase                 # refine next phase brief
/iterate                      # audit + ship one improvement
/critique                     # external-observer pass
/triage                       # review unlabeled issues
/expand                       # propose new phase candidates
/march                        # do the right thing
/oversight                    # course-correct
/jot <text>                   # add a critique row
/loop 30m /march              # autonomous loop (local)
```

### Sub-agents

| Agent | Use for |
|---|---|
| `scout` | Open-web research (cast lists, air dates, format changes, casting news). Citations required. |
| `reader` | Fresh-eyes critique of the live site (anonymous; no auth needed for public pages). |
| `brander` | Per-show pantheon facade SVG generation. Column / pediment / frieze / ornament + 3-color palette. |
| `data-steward` | Supabase migrations, RLS policies, query optimization, drop ops. |
| `content-curator` | Spoiler-disciplined editorial blurbs. Voice: knowledgeable peer. |

The main agent writes wiring, code, decisions. Spawn sub-agents
aggressively for everything else. Two-or-more agents in parallel
when their work is independent (a `brander` + `content-curator`
pair for new-show launches, for instance).

---

## Operational secrets

The autonomous loop is hermetic for shipping; the awareness
layer needs tokens. Both live in `.env` (gitignored). Mirror to
Vercel + GitHub Actions secrets per `setup/`.

Required:
- `GH_TOKEN` — `gh` CLI + `/triage`. Mirrored to Actions as
  `ACTIONS_PAT` so cloud commits attribute to the user.
- `CLAUDE_CODE_OAUTH_TOKEN` — cloud loop's billing path. Bills
  against Pro/Max subscription, $0 marginal.
- `VERCEL_TOKEN` — `pnpm deploy:check`.
- `OPENAI_API_KEY` — runtime moderation pre-filter (phase 12).
- All `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`, `DATABASE_URL`,
  `DIRECT_URL` — Supabase client + server.
- All `AUTH0_*` — Auth0 magic-link + RBAC.

If a token is missing, the relevant skill stops at its
failure-mode condition rather than inventing a placeholder.

---

## Where to look

| If you need… | Read |
|---|---|
| What Pantheon is | `spec.md` |
| Stack, conventions, defaults, voice | `plan/bearings.md` |
| External-service config status | `setup/00_files.md` |
| What ships next | `plan/steps/01_build_plan.md` |
| How a phase is built | `plan/phases/phase_<N>_<topic>.md` |
| How a skill works | `skills/<skill>.md` |
| What a sub-agent does | `.claude/agents/<name>.md` |
| Latest weaknesses | `plan/AUDIT.md` |
| Critique queue | `plan/CRITIQUE.md` |
| Phase candidates from `/expand` | `plan/PHASE_CANDIDATES.md` |
| Design tokens + grammar | `design/tokens.json`, `design/compositions/*.jsx` |
