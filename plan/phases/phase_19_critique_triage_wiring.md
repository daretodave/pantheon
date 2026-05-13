# Phase 19 — `/critique` + `/triage` wiring

> **Wiring + bookkeeping phase.** The artifacts already exist:
> the `reader` sub-agent supports both anonymous and
> authenticated passes (`auth_state: "anonymous" | "authenticated"`),
> the `/critique` skill runs both per invocation,
> `plan/CRITIQUE.md` is initialized with the format header, the
> `/triage` skill is fully spelled out with labels + dispatch
> rules, `/march` Step 1 already gates on the unlabeled-issue
> query, and `scripts/loop-issue.mjs` exposes the open / close
> / phase-open / phase-close commands.
>
> What's missing: the **GitHub labels themselves don't all
> exist on the repo yet**, and there's no programmatic guard
> that future drift won't break the `/triage` skill mid-run.
> Phase 19 closes that gap.

## Goal

By the end of this phase:

- All **13 canonical labels** exist on
  `github.com/daretodave/pantheon` with consistent descriptions
  + colors:
  - **Status (triage:* prefix)**: `triage:loop-queued`,
    `triage:needs-user`, `triage:closed`, `triage:reviewed`
  - **Category**: `bug`, `enhancement`, `content`, `data`,
    `docs`, `seo`, `a11y`, `perf`
  - **P0**: `spoiler`
- `scripts/check-triage-labels.mjs` validates the 13-label set
  exists on the repo. Standalone (not in `pnpm verify` —
  remote-network-dependent + slow). Documents the canonical
  set in code so future drift surfaces fast.
- `scripts/__tests__/check-triage-labels.test.mjs` covers the
  pure-logic split (the canonical set constant + the
  comparison function — not the gh call).
- A wiring smoke pass: run the `gh issue list` query that
  `/march` Step 1 uses; expect 0 unlabeled (none filed yet);
  document the result in the commit body.
- The label-create commands are idempotent (`gh label create
  --force` semantics where supported, otherwise check-then-create).

## Outputs

```
scripts/check-triage-labels.mjs
scripts/__tests__/check-triage-labels.test.mjs
scripts/create-triage-labels.mjs                # one-shot bootstrap
```

The actual GitHub labels are created via `gh label create` —
not source-tracked.

## Decisions made upfront — DO NOT ASK

- **13 labels = 4 status + 8 category + 1 P0**. The status
  set uses the `triage:*` prefix to namespace from generic
  categories. Spoiler is its own thing per bearings line 463
  ("Spoiler ambiguity: when in doubt, redact").
- **`triage:loop-queued` is the prefixed canonical name.** The
  existing un-prefixed `loop-queued` label on the repo is
  legacy from phase 0 setup. We CREATE the prefixed version
  alongside, but do NOT delete the un-prefixed one — keeps
  any existing label references on closed issues intact.
  Same for `needs-user` vs `triage:needs-user`.
- **`gh label create` is idempotent via try-then-update.**
  The script uses `gh label create <name>; gh label edit
  <name> --description ... --color ...` so re-runs converge
  to the canonical metadata. Color palette mirrors the
  bearings convention (status = neutral grey, category =
  semantic, spoiler = red).
- **`check-triage-labels.mjs` is NOT in `pnpm verify`.** It's
  remote-network-dependent + slow. Runs ad-hoc + in CI on
  schedule. The verify chain stays hermetic.
- **No e2e for /critique or /triage in this phase.** Both
  skills run against real GitHub + the live deploy. Wiring
  them into Playwright would require a sandbox repo + a
  shadow deploy — both follow-ups. The smoke pass that runs
  manually (`/triage dry-run` + the unlabeled-count query)
  is the validation surface for v1.
- **`/march` Step 1 dispatching to /triage already exists**
  (skills/march.md line 58-78). No code change needed; this
  phase just verifies it functions.
- **No CRITIQUE.md primer**. The doc already has the header
  + format. First-real-pass populates it once `/march` Step 2
  conditions hold (12+ commits since last pass — easily true
  now — and a green deploy — yes).

## Out of scope

- The first actual `/critique` invocation. `/march` is the
  scheduler; phase 19 only wires the rails.
- Sandbox-repo testing of the `/triage` write path. Too much
  infra for a wiring phase.
- Refactor the `/triage` skill to merge the prefixed +
  un-prefixed legacy labels.
- A label-color audit / consistency pass (the skill creates
  labels with simple colors; finer palette is a follow-up).
- Renaming or deleting the legacy un-prefixed `loop-queued`
  / `needs-user` labels.
- Adding `loop:opened` / `loop:phase` to the 13-label set —
  those are internal-bookkeeping labels created by
  `loop-issue.mjs`, not triage-vocabulary labels.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---|---|
| `scripts/check-triage-labels.mjs` | unit test on canonical-set constant + diff function | — (remote-net; runs ad-hoc) |
| `scripts/create-triage-labels.mjs` | smoke-runs once during this phase | — |
| `/triage` end-to-end | — | smoke via `gh issue list` query in march Step 1 |
| `/critique` end-to-end | — | first real invocation happens via `/march` (not this phase) |

## Verify gate

`pnpm verify` — same composition. `check-triage-labels.mjs`
runs OUTSIDE verify (documented; ad-hoc only).

## Commit body template

```
feat: critique + triage wiring — phase 19

- 13 canonical GitHub labels created (idempotent).
- scripts/check-triage-labels.mjs validates the set.
- /march Step 1 dispatch verified end-to-end.

Decisions:
- triage:* prefix used for status labels; legacy un-prefixed
  loop-queued + needs-user kept for back-compat.

Closes #<issue>
```

## DoD

- All 13 labels exist on github.com/daretodave/pantheon.
- `node scripts/check-triage-labels.mjs` exits 0.
- `node scripts/__tests__/check-triage-labels.test.mjs` green.
- The /march Step 1 unlabeled-count query returns 0
  (verified manually + documented in commit).
- `pnpm verify` green.
- Vercel deploy ready.
- Mirror issue closed.

## Follow-ups (out of scope)

- First real `/critique` invocation (via `/march`).
- Sandbox repo + shadow deploy for end-to-end triage e2e.
- Legacy label rename / cleanup (un-prefixed `loop-queued`).
- Label-color audit pass.
- Add `loop:opened` / `loop:phase` to the canonical set if
  triage starts to care about loop-self-issued items.
