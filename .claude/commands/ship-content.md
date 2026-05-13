---
description: Ship one content unit end-to-end (show / canon batch / themed list). Content velocity for Pantheon.
---

You are invoked under the `ship-content` skill — full autonomy,
no review checkpoint. Read `skills/ship-content.md` end to end
before touching anything else; that file is the single source
of truth.

The user's standing instruction is **"more get-it-done, less
ask me questions."** Decide instead of asking; document the
call in the commit body.

Argument handling:
- No argument → ship the highest-scoring `Pending`
  content-gap row in `plan/AUDIT.md`.
- `show <slug>` → ship that specific show (Rule 1).
- `canon <show-slug>` → fill missing season blurbs for that
  show (Rule 2 batch).
- `theme <slug>` → ship that specific themed list (Rule 3).
- `facade <slug>` → **retired**. Reply `Rule 4 retired — per-show
  illustration is prohibited per design/CLAUDE.md` and exit.

Procedure: §4 of `skills/ship-content.md`. Hard rules: §5.
Failure modes: §8.

Be bold about delegating: spawn `content-curator` for blurb /
canon / themed-list work. Main agent's job is wiring + the
queue read + the verify gate + the commit. **Do not spawn
`brander` from ship-content** — brander only handles shared
assets (favicon set, OG, wordmark), not per-show output.

When invoked under `/loop` or `/march`, the user is not
present. After commit + push + deploy:check + audit-tick,
return cleanly.

Argument: $ARGUMENTS
