# plan/

The plan tree is the loop's working memory across context loss.

```
plan/
├── README.md                       this file
├── bearings.md                     stack, voice, standing decisions, hard rules
├── steps/
│   └── 01_build_plan.md            at-a-glance status + per-phase scope
├── phases/
│   ├── phase_1_bootstrap.md        first-shipped phase, detailed
│   ├── phase_6_show_home.md        canonical sibling for show families
│   ├── phase_9_season_page.md      canonical sibling for season pages
│   └── phase_<N>_<topic>.md        per-phase brief
├── AUDIT.md                        open audit findings — /iterate's queue
├── CRITIQUE.md                     external-observer findings — /iterate's second queue
└── PHASE_CANDIDATES.md             /expand outputs awaiting /oversight promotion
```

Read order on session start:
1. `spec.md` (repo root) — what Pantheon is
2. `agents.md` (repo root) — standing rules
3. `plan/bearings.md` — stack + decisions
4. `plan/steps/01_build_plan.md` — what's pending
5. The relevant phase brief in `plan/phases/`
6. The relevant skill file in `skills/`
