# Pantheon — read this first

Every agent landing in this repo reads this file before doing
anything else. The standing rules are listed once below; the
authoritative deep-dives live in `agents.md`, `design/CLAUDE.md`,
and `plan/bearings.md`. **Honor this file before improvising.**

---

## Reading order (the "before you touch a thing" checklist)

1. **`design/CLAUDE.md`** — visual law. Read it cold before any
   UI work. It overrides any older guidance found elsewhere in
   the repo, including this file.
2. **`design/Pantheon · Brand.html`** — header, footer, brand
   mark spec. The mark is the **only** SVG illustration in the
   product.
3. **`design/Pantheon · Survivor.html`** — the canonical
   production show page (full-bleed, tinted chrome, all
   seasons). When you build a show page, this is the reference.
4. **`design/Pantheon · Heroes vs. Villains.html`** — the
   canonical production season page (lede, body, vote block,
   adjacent seasons, "also appears in," sticky thread aside).
5. **`design/compositions/screens.jsx` + `screens.css`** — the
   React + CSS source of truth for chrome and page shells.
6. **`design/compositions/interactions.jsx`** — VotePair,
   CommentInput, RankShiftPill. The production components are
   ports of these, not re-interpretations.
7. **`agents.md`** — standing rules, sub-agent index, repo shape.
8. **`plan/bearings.md`** — locked stack, voice, URL contract.
9. **`plan/steps/01_build_plan.md`** — what ships next.

If a phase brief mentions design files older than `design/CLAUDE.md`,
the design files win.

---

## The visual law (in one paragraph)

Pantheon's identity is **color + typography**. Each show carries
a three-color palette (paper / ink / primary) and a serif
wordmark. That is the whole identity. **There is no
illustration, no per-show iconography, no sigil, no facade, no
mascot, no thematic ornamentation.** The only SVG in the product
is the shared Pantheon brand mark (a small pediment over three
columns) which appears in every header and footer. Color does
the visual work. Type does the editorial work. Everything else
is text.

### The five hard rules — never break

1. **Never generate SVG illustration for individual shows.** No
   facades, sigils (per-show), mascots, torches, sequins,
   spoons, herbs, columns, pediments, friezes, ornaments, or
   any other per-show artwork. This direction was prototyped in
   the May 2026 facade grammar and **rejected** — the output
   reads as AI-generated and does not meet the bar. Do not
   retry it. Do not "improve" it. Do not add "just one small
   icon."
2. **Where a show needs a marker** — anywhere you'd otherwise
   reach for a tiny illustration, badge, sigil, or icon — use a
   **12–16px filled circle** in `var(--show-primary)`. Class
   `.bullet`. This is the only show-specific graphic permitted
   in the entire system.
3. **The only SVG in the product is the Pantheon brand mark** —
   monochromatic pediment + three columns + stylobate, shared
   across every show. See `design/Pantheon · Brand.html` for
   spec. Never invent per-show variants.
4. **Color identity flows through chrome tinting.** On a show
   page the chrome reads `--show-paper / --show-ink /
   --show-primary` and the body becomes the show paper. Big
   colored blocks holding huge serif type ARE the hero
   treatment. Resist the urge to "add visual interest" with
   art.
5. **Type does the heavy lifting.** Source Serif 4 for editorial
   (40–96px on heroes). Inter for chrome. JetBrains Mono for
   ranks. When in doubt, make the type bigger before reaching
   for ornament.

---

## Show identity, formalized

Each show carries **exactly seven fields** in
`content/shows/<slug>.md` frontmatter. No more, no less:

| field      | type      | example                                                       |
|------------|-----------|---------------------------------------------------------------|
| `slug`     | string    | `survivor`                                                    |
| `name`     | string    | `Survivor`                                                    |
| `palette`  | object    | `{ paper: "#0E2A2A", ink: "#EFE2BD", primary: "#D55E36" }`    |
| `seasons`  | int       | `47`                                                          |
| `status`   | enum      | `airing` / `ended` / `hiatus`                                 |
| `blurb`    | string    | `47 seasons. One torch at a time.`                            |
| `tagline`  | string    | `47 seasons of strangers on a beach. We've ranked every one.` |

No `hero_motifs`. No `format`. No `network`. No SVG path. No
icon name. No mascot reference. If a future contributor
proposes an eighth field that is graphical in nature, reject
it.

(The `seasons` int is the count of aired/airing seasons. The
`blurb` is the short hero subtitle. The `tagline` is the longer
editorial sentence — it appears on the show page meta column
and is the kind of line a reader quotes to a friend.)

---

## Standing rules summary (see `agents.md` for the full set)

1. **Commit and push as one atomic act.** No unpushed commits
   between loop ticks.
2. **No `Co-Authored-By:` trailers. No emojis.** Anywhere. (One
   carve-out: the cloud loop appends `Cloud-Run: <url>`.)
3. **`pnpm verify` is non-negotiable** — typecheck → test:run →
   build → e2e. No `--no-verify`. Fix root cause.
4. **`pnpm deploy:check` runs after every push.** Red deploy =
   blocked tick.
5. **No force-push. No destructive resets.**
5a. **Every commit ships unit tests AND e2e contributions.** New
    URL → row in `apps/e2e/src/fixtures/canonical-urls.ts` +
    `page-reads.ts`. New page family → dedicated spec.
6. **Pantheon is lowercase in running prose, capital P at
   headlines.**
7. **Spoilers are P0.**
8. **Database mutations are autonomous in v1.**
9. **Content stays in `content/`. Data stays in Supabase.** No
   hardcoded copy in components; no hardcoded data records in
   TypeScript.

---

## Where to look

| If you need… | Read |
|---|---|
| What Pantheon is | `spec.md` |
| Visual law (UI, brand, chrome) | `design/CLAUDE.md` |
| Stack, conventions, voice | `plan/bearings.md` |
| What ships next | `plan/steps/01_build_plan.md` |
| Sub-agent index | `agents.md` Sub-agents table |
| How a skill works | `skills/<skill>.md` |

---

## Tone of voice

Knowledgeable peer. Confident, warm, plain-spoken. The reader is
a friend who watches everything and wants the truth without
spoilers. No exclamation points unless quoted. The brand
promise (**"the seasons, ranked. no spoilers."**) is the only
place the word *ranked* needs to be loud; everywhere else it
can be quiet.
