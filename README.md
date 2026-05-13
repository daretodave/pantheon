# pantheon

> *pantheon* /ˈpan.θi.ən/ — *n.* a temple housing the gods of a people; a small group of figures regarded as the most important of their kind.

[![march](https://github.com/daretodave/pantheon/actions/workflows/march.yml/badge.svg?branch=main)](https://github.com/daretodave/pantheon/actions/workflows/march.yml)
[![site](https://img.shields.io/website?url=https%3A%2F%2Fpantheon-coral.vercel.app&label=pantheon-coral.vercel.app&up_message=live)](https://pantheon-coral.vercel.app)
[![built with](https://img.shields.io/badge/built%20with-claude%20code-d97757)](https://claude.com/claude-code)
[![methodology: nexus](https://img.shields.io/badge/methodology-nexus-lightgrey)](https://github.com/daretodave/nexus)

A spoiler-free home for ranked TV seasons. **The seasons, ranked. No spoilers.** Live at [pantheon-coral.vercel.app](https://pantheon-coral.vercel.app).

Every show on Pantheon gets two rankings side by side: an **Editor's Canon** (written by someone with the whole series in their head) and a **Community Rank** (vote-driven, weekly). The launch cluster is reality TV — Survivor, Top Chef, Drag Race, and ~9 more — covering ~250 seasons in total. The promise is reinforced at every depth: hero headline, shield pill, vote question, inline comment reminder.

**This site is always being worked on.** An autonomous loop ships improvements 24/7 through a small set of slash commands — new shows, season blurbs, canon rationales, themed lists, broken-link fixes, schema updates, SEO catches, design landings. The cloud half ticks **hourly** via [GitHub Actions](https://github.com/daretodave/pantheon/actions/workflows/march.yml); the local half runs on my laptop. No human in the per-commit loop, but every commit is gated by a hermetic verify (`typecheck → test → build → e2e`) and a post-push deploy gate.

The visual law is uncompromising and lives in [`design/CLAUDE.md`](./design/CLAUDE.md): **color + typography only**, with a single shared brand mark. No per-show illustration, no facades, no sigils, no mascots. Where a show needs a marker in a list, a 12–16px filled circle in the show's primary color does the job.

The methodology powering all of this is [**nexus**](https://github.com/daretodave/nexus) — a portable kit that turns any repo into an autonomous-loop project. If you want to do the same to your own repo, start there.

The product spec is in [`spec.md`](./spec.md). The autonomous build loop is documented below.

---

## Skills

This project is shipped by a small set of autonomous skills, each invoked as a Claude Code slash command. Skills are **source-of-truth** files (under `skills/`) — the slash commands are thin pointers. Other AI clients can follow the skill files directly.

### `/ship-a-phase`

Ship the next pending phase of the [build plan](./plan/steps/01_build_plan.md) end-to-end: code, unit tests, e2e tests, commit, push. The Vercel deploy follows automatically.

```
/ship-a-phase                       # next [ ] phase
/ship-a-phase phase 19c             # specific phase by number
/ship-a-phase phase 19c dry-run     # plan + emit brief, no code commit
/loop 30m /ship-a-phase             # autonomous, every 30 min
```

Source: [`skills/ship-a-phase.md`](./skills/ship-a-phase.md)

### `/ship-data`

Ship one self-contained update to the Supabase data layer — write a versioned SQL migration, add an RLS policy, tune an index, add or drop an RPC. The autonomous loop has full destructive authority on the v1 experiment (drop tables, drop the database, truncate) — git is the audit trail and Supabase's 7-day backups are the safety net.

```
/ship-data                          # next data backlog row, or audit→fix
/ship-data add migration <slug>     # specific migration
/ship-data audit                    # audit-only; emit a queue row
/ship-data rls <table>              # tighten / repair RLS
```

Source: [`skills/ship-data.md`](./skills/ship-data.md)

### `/ship-content`

Ship one content unit end-to-end (show, canon batch, themed list). The four content-velocity rules in [`plan/bearings.md`](./plan/bearings.md) generate a continuous stream of content-gap findings until Pantheon's corpus reaches its launch quota (12 shows, every aired season blurbed, ≥10 themed lists). The skill drains them one tick at a time, spawning `content-curator` for the prose work.

```
/ship-content                       # highest-scoring content-gap row
/ship-content show <slug>           # ship that specific show (Rule 1)
/ship-content canon <show-slug>     # fill missing season blurbs (Rule 2)
/ship-content theme <slug>          # ship that themed list (Rule 3)
```

Source: [`skills/ship-content.md`](./skills/ship-content.md)

### `/plan-a-phase`

A thinking pass — refines the next phase brief without shipping code. Useful before a long autonomous run so `/ship-a-phase` has zero ambiguity.

```
/plan-a-phase                       # refine next pending phase
/plan-a-phase phase 19c             # refine a specific phase
```

Source: [`skills/plan-a-phase.md`](./skills/plan-a-phase.md)

### `/iterate`

The post-build loop. Audit the site for the highest-impact weakness (content gap, broken link, missing OG, stale data, a11y issue, etc.) and ship one improvement. Designed to run forever once the planned phases are done.

```
/iterate                            # audit + ship the top finding
/iterate audit                      # audit-only; no fix shipped
/iterate content-gaps               # bias toward content
/iterate seo                        # bias toward SEO
/loop 1h /iterate                   # autonomous improvement loop
```

Source: [`skills/iterate.md`](./skills/iterate.md)

### `/critique`

The **external-observer** pass. Spawns the `reader` sub-agent to visit https://pantheon-coral.vercel.app as a first-time reader would, take notes (visual, voice fidelity, mobile reflow, comprehension, navigation honesty, spoiler discipline), self-assess what was returned, and append the surviving findings to [`plan/CRITIQUE.md`](./plan/CRITIQUE.md). `/iterate` reads CRITIQUE.md as one of its audit sources — that's the **feedback address loop**.

Two passes per invocation — anonymous + authenticated — so member-only paths get observed too. Rate-limited: only fires when there's a green deploy + ≥12 commits or ≥24h since the last pass. Caps at 6 filed findings per pass.

```
/critique                           # full pass — visits ~6 representative URLs
/critique <url>                     # focused pass on one URL
/critique mobile                    # 375x800 only
```

Source: [`skills/critique.md`](./skills/critique.md)

### `/triage`

The **issue review** loop. Reads open unlabeled issues at github.com/daretodave/pantheon, classifies each (bug, feature, content, data, docs, spoiler, etc.), applies the right label, posts a short comment, and routes actionable issues into the right backlog (`plan/AUDIT.md`, build plan, or content-gap queue). When there are zero unlabeled issues, exits in <1s — the loop hums on. **Spoilers are P0** — any merged spoiler is a same-day patch.

`/iterate`, `/ship-data`, and `/ship-content` close issues automatically when their addressing commits ship.

```
/triage                             # all unlabeled open issues
/triage <issue-number>              # focused pass
/triage all                         # re-evaluate every open issue
/triage dry-run                     # classify + report, no labels/comments
```

Source: [`skills/triage.md`](./skills/triage.md)

### `/expand`

The **plan-expansion** pass. Reads accumulated signals (audit findings, critique findings, GH issues, spec drift, design landings, data growth) and proposes new phase candidates to [`plan/PHASE_CANDIDATES.md`](./plan/PHASE_CANDIDATES.md). `/oversight` reviews and promotes — the build plan grows when reality demands it, but never without a human gate.

Posture is set to **bold** in `bearings.md`. Rate-limited (≥20 commits or ≥48h between passes). Caps at 3 candidates per pass — boldness is not flooding.

```
/expand                             # full pass — read signals, file candidates
/expand audit | spec | design       # bias toward one signal source
/expand dry-run                     # report candidates; do not commit
```

Source: [`skills/expand.md`](./skills/expand.md)

### `/jot`

The user-input quickfire. Append a one-line observation directly to [`plan/CRITIQUE.md`](./plan/CRITIQUE.md) so the next `/iterate` tick acts on it. No questions back, no autonomy — just capture-and-go.

```
/jot footer link to /about is dead
/jot the bullet on the Top Chef tile should be brighter
```

Source: [`skills/jot.md`](./skills/jot.md)

### `/march`

The outer dispatcher. Picks the right thing to do automatically:

- unlabeled issues exist → behaves as `/triage`
- critique due (rate-limited) → behaves as `/critique`
- pending phase → behaves as `/ship-a-phase`
- pending data → behaves as `/ship-data`
- pending content gap → behaves as `/ship-content`
- expand due + bold posture → behaves as `/expand`
- else → behaves as `/iterate`

Use this with `/loop` for the autonomous-beast endgame.

```
/march                              # one tick: dispatch + execute
/loop /march                        # self-paced autonomous loop
/loop 30m /march                    # autonomous, every 30 min
```

Source: [`skills/march.md`](./skills/march.md)

### `/oversight`

The **user-in-the-loop** command. Pause autonomy, get a tight briefing on current state (shipping velocity, pending phases, open audits, deploy state, working-tree state), answer a targeted questionnaire generated from what was found, and the skill applies your answers as plan adjustments — drop a stuck phase, bias the iterate loop, refresh a brief in light of new design, prune findings, promote `/expand` candidates.

The only skill that asks you anything. Everything else decides and ships.

```
/oversight                          # full audit + general questionnaire
/oversight phase                    # bias toward phase progress
/oversight content                  # bias toward /iterate findings
/oversight deploy                   # bias toward Vercel / CI/CD
/oversight reset                    # bias toward scope reduction
```

Source: [`skills/oversight.md`](./skills/oversight.md)

---

## Sub-agents

Each skill delegates aggressively to specialist sub-agents (definitions in [`.claude/agents/`](./.claude/agents/)):

| Agent | When invoked |
|---|---|
| `scout` | Open-web research — cast lists, air dates, format changes, casting news. Citations required. |
| `reader` | Fresh-eyes external observer of the live site (used by `/critique`). Anonymous + authenticated passes. |
| `content-curator` | Spoiler-disciplined editorial prose — show frontmatter, season blurbs (50–80 words), Editor's Canon rationales (80–120 words per ranked position), themed-list curation. Voice: knowledgeable peer. |
| `data-steward` | Versioned Supabase migrations, RLS policies, indexes, RPC functions. Has destructive authority on v1. |
| `brander` | Shared asset rendering **only** — the single Pantheon brand mark, favicons + apple-touch-icon, OG / social-card composites, the wordmark lockup, svg2png. **Never per-show illustration** (see [`design/CLAUDE.md`](./design/CLAUDE.md)). |

---

## Repo orientation

For any agent landing cold: read [`CLAUDE.md`](./CLAUDE.md) first (visual law + reading order), then [`agents.md`](./agents.md) (standing rules + sub-agent index). They point you to everything else in the right order.
