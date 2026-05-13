# Phase 2 — Content layer

> **The seam between markdown-on-disk and TypeScript-in-React.**
> Phase 3's URL contract and phase 6's show home both read
> through these loaders. Get the schemas right here and the rest
> of the build composes.

## Goal

By the end of this phase:
- Zod schemas exist for `Show`, `Season`, `Theme`, and `Canon`
  (the latter is the ranked rationale set, not a separate model).
- A small loader module reads `content/shows/*.md`,
  `content/shows/<slug>/seasons/NN-<title>.md`,
  `content/shows/<slug>/canon.md`, and `content/themes/*.md`,
  validates each against the schemas, and returns typed objects.
- The legal trio (`content/legal/{about,terms,privacy}.md`) is
  loadable by the same module — phase 3's stub pages and the
  eventual real `/about`, `/terms`, `/privacy` routes both read
  from this loader rather than embedding copy.
- `pnpm content:check` runs the loader against every file under
  `content/` and exits non-zero on any validation failure.
- `content:check` is wired into `pnpm verify` so a malformed
  show / season / theme / canon file fails the gate, not just
  e2e.
- Survivor is seeded as the first show: `content/shows/survivor.md`
  + a tiny `canon.md` + a handful of season blurbs proving the
  loader pipeline end-to-end.
- Loader output is **cached** at module load: the filesystem
  reads happen once per process. Phase 3 will derive the
  canonical URL fixture from these loaders; phase 6 will read
  shows + seasons from them on every server render. Both rely
  on the cache to keep build + start-up fast.

The bar: phase 3 can import `getAllShows`, `getShow`,
`getSeasons`, `getCanon`, `getAllThemes`, `getTheme`,
`getLegalDoc` from `@/content` and rely on them.

## Outputs

```
content/
├── legal/                                  # already shipped phase 1
│   ├── about.md
│   ├── privacy.md
│   └── terms.md
├── shows/
│   ├── survivor.md                         # show frontmatter (palette, motifs, status)
│   └── survivor/
│       ├── canon.md                        # ranked positions + rationale stubs
│       └── seasons/
│           ├── 01-borneo.md                # 50–80 word spoiler-free blurb
│           ├── 28-cagayan.md
│           ├── 41-new-era-i.md
│           └── 45-mom-i-won.md
└── themes/                                 # empty stub dir tracked via .gitkeep — populated phase 14+

src/content/
├── index.ts                                # public surface: re-exports the loaders + types
├── schemas.ts                              # Zod schemas for Show, Season, Theme, CanonEntry, LegalDoc
├── loaders.ts                              # sync loaders + module-level cache
├── parse.ts                                # parseShowFile / parseSeasonFile / parseThemeFile / parseLegalFile helpers
├── paths.ts                                # content root + per-family path helpers (single source of truth)
└── __tests__/
    ├── schemas.test.ts                     # schema accepts valid / rejects malformed
    ├── parse.test.ts                       # frontmatter + body parsing on fixtures
    └── loaders.test.ts                     # loads from a temp content dir, asserts shape

scripts/
└── content-check.mjs                       # validates every content/*.md; calls loaders, prints failures, exit 1 on any

package.json
└── add zod + gray-matter to dependencies
└── add "content:check" script
└── add content:check to "verify" between test:run and build
```

## Detailed steps

### 1. Add the libraries

- `zod` ^3.23 — schema validation.
- `gray-matter` ^4.0 — YAML frontmatter parser. Already de-facto
  standard for Next.js content sites; no native alternative
  that's worth the ergonomic loss.

Both go in `dependencies` (not devDependencies) because
`src/content/loaders.ts` imports them at runtime during
`next build` and `next start`.

### 2. `src/content/schemas.ts`

Zod schemas, exported types alongside.

- `paletteSchema` — `{ primary, ink, paper }`, all hex strings
  (regex `/^#[0-9a-fA-F]{6}$/`).
- `showSchema` — `slug`, `name`, `network`, `format` (string;
  free-form),  `hero_motifs` (string array, 0–6 items),
  `palette`, `status` (`"airing" | "ended" | "hiatus"`),
  `tagline` (optional, used on `/shows/[show]`),
  `first_aired` (ISO date string, optional).
- `seasonSchema` — `show` (slug), `number` (positive int),
  `title`, `premiere_date` (ISO date string, optional),
  `ep_count` (positive int, optional), `location`
  (string, optional), `host` (string, optional),
  `format_changes` (string array, optional, default `[]`),
  `canonical_position` (positive int, optional — set by
  `canon.md`, not season frontmatter, BUT a season may
  declare its own when canon hasn't ranked it yet; the canon
  file wins on conflict).
- `themeSchema` — `slug`, `title`, `description` (1–2
  sentences), `entries` (array of `{ show, season, rank,
  blurb }`, 1–15 items).
- `canonEntrySchema` — `{ rank, season, rationale }` (rank is
  a positive int, season is the season number, rationale is
  80–120 words of body markdown).
- `canonFileSchema` — `{ show, entries: CanonEntry[] }`. The
  `canon.md` frontmatter declares `show`, the body holds the
  ranked list parsed from `### NN. <Season title>` headings
  followed by paragraphs (see step 4 for body parsing).
- `legalDocSchema` — `slug` (`"about" | "terms" | "privacy"`),
  `title`, `updated` (ISO date string, optional), `body`
  (markdown body, no further validation).

Word-count rules (season blurb 50–80, canon rationale 80–120)
are checked via a `.refine()` that splits body on whitespace.
Validation messages cite the offending file path (the loader
threads it through).

### 3. `src/content/paths.ts`

```ts
import path from 'node:path'

export const CONTENT_ROOT = path.resolve(process.cwd(), 'content')

export const showsDir = () => path.join(CONTENT_ROOT, 'shows')
export const showFile = (slug: string) =>
  path.join(showsDir(), `${slug}.md`)
export const seasonsDir = (slug: string) =>
  path.join(showsDir(), slug, 'seasons')
export const canonFile = (slug: string) =>
  path.join(showsDir(), slug, 'canon.md')
export const themesDir = () => path.join(CONTENT_ROOT, 'themes')
export const legalDir = () => path.join(CONTENT_ROOT, 'legal')
```

`CONTENT_ROOT` resolves from `process.cwd()` because Next.js
builds and runs from the repo root. Tests override via a
`setContentRoot()` helper exported only for `__test__/`.

### 4. `src/content/parse.ts`

Pure functions, no filesystem access:

- `parseShowFile(raw: string, file: string): Show` — runs
  `matter(raw)`, validates frontmatter against `showSchema`,
  returns the typed object plus body. The body becomes
  `tagline` only if the frontmatter doesn't already include
  one (free-text fallback).
- `parseSeasonFile(raw: string, file: string): Season` —
  same shape, plus blurb word-count refine. Returns
  `{ ...frontmatter, blurb_md: body }`.
- `parseThemeFile(raw: string, file: string): Theme` — themes
  carry their ranked entries in frontmatter (an array of
  `{ show, season, rank, blurb }`); the body is optional flavor
  text rendered on `/themes/[theme]`.
- `parseCanonFile(raw: string, file: string): CanonFile` —
  frontmatter declares `show`; body parses as a sequence of
  ATX `## NN. <title>` headings each followed by 1–N paragraphs.
  The parser is small and intentional: split body on
  `/^## (\d+)\. (.+)$/m`, then group paragraphs by heading.
  Result is an array of `{ rank: number, season: number,
  rationale: string }`. The `season` field on each entry maps
  to the heading's `NN` (which is the season number, **not** a
  display index — Survivor heading `## 28. Cagayan` means
  "season 28, ranked at position X" where X is the position in
  the file). The `rank` is the 1-based position in the file.
- `parseLegalFile(raw: string, file: string): LegalDoc` —
  frontmatter `{ title, updated? }` + body markdown.

Word-count guards: throw a typed `ContentValidationError` with
`{ file, field, message }`. The loader catches and rethrows
with the file path attached.

### 5. `src/content/loaders.ts`

Module-level cache: a lazily-initialized `Map<string, Show>` +
sibling maps for seasons / canons / themes / legal. The first
call to any loader triggers a single full scan; subsequent calls
hit the cache.

Public surface:

```ts
export function getAllShows(): Show[]
export function getShow(slug: string): Show | null
export function getAllSeasons(showSlug: string): Season[]
export function getSeason(showSlug: string, n: number): Season | null
export function getCanon(showSlug: string): CanonFile | null
export function getAllThemes(): Theme[]
export function getTheme(slug: string): Theme | null
export function getLegalDoc(slug: 'about' | 'terms' | 'privacy'): LegalDoc | null
export function loadAllContent(): void  // forces the scan; used by content:check
export function __resetContentCache(): void  // test-only
```

Loader internals use `node:fs` `readdirSync` + `readFileSync` —
sync is fine because this runs during `next build` and during
Server Component render (Next 15 is happy with sync FS in RSC).

Sort discipline:
- `getAllShows()` — by `slug` ascending (deterministic; phase
  6's show grid sorts by `name` itself).
- `getAllSeasons(slug)` — by `number` ascending.
- `getAllThemes()` — by `slug` ascending.
- Canon entries — preserved in file order (the file IS the
  ranking).

The loader does NOT cross-validate (e.g., that every season
referenced in a canon file exists). Cross-validation is the
content-check script's job (step 6), not a loader concern.

### 6. `scripts/content-check.mjs`

```js
#!/usr/bin/env node
import { loadAllContent, getAllShows, getCanon, getAllSeasons } from '../src/content/loaders.ts'
// ^ uses an inline tsx loader OR a compiled JS shim; see below
```

Two viable wirings:

**Option A — `tsx` as a dev-dep + shebang via `node --import tsx`**.
**Option B — author the script in TypeScript at
`scripts/content-check.ts` and run via `tsx scripts/content-check.ts`**.

Pick **B**: keep the file `.mts` is awkward with sync FS, and a
dedicated `.ts` script + `tsx` in devDependencies keeps it
simple.

Add to package.json:
- `tsx` ^4.x in `devDependencies`.
- Script: `"content:check": "tsx scripts/content-check.ts"`.

The script:
1. Calls `loadAllContent()`. Any Zod error throws with the file
   path; the script catches, prints to stderr, increments a
   failure counter.
2. Cross-validates: every canon entry's `season` field
   references a season file that exists on disk. Every theme
   entry's `{ show, season }` pair resolves. Missing references
   are validation failures.
3. Exits `0` if no failures, `1` otherwise. Prints a one-line
   green "validated N shows, M seasons, K themes" on success.

Wired into `verify`:

```json
"verify": "pnpm tokens && pnpm typecheck && pnpm test:run && pnpm content:check && pnpm build && pnpm e2e"
```

Order: after `test:run` (so unit tests catch loader bugs first)
and before `build` (so a malformed file fails fast, not via a
500 in the e2e walk).

### 7. Seed Survivor

`content/shows/survivor.md`:

```yaml
---
slug: survivor
name: Survivor
network: CBS
format: outwit-outplay-outlast
hero_motifs: [palm-column, torch-pediment, woven-frieze]
palette:
  primary: "#C9551A"
  ink:     "#1A1410"
  paper:   "#F5EFE6"
status: airing
first_aired: 2000-05-31
tagline: The mother format. Forty-plus seasons of strangers, beaches, and the long argument about the social game.
---
```

Body: short flavor paragraph (used as fallback tagline if the
frontmatter `tagline` is ever dropped; reads as a peer talking).

Four season seeds — Borneo (1), Cagayan (28), New Era I (41),
Mom I Won (45). Each gets a 50–80 word spoiler-free blurb:
format energy, casting feel, what it's like to watch as a
viewer arriving cold. No winners, no twists, no eliminations.
The first-time blurbs ship as content-curator-grade drafts that
phase 5+ may revise once facades land — the bar here is "loader
accepts them, e2e proves they exist."

`content/shows/survivor/canon.md`:

```yaml
---
show: survivor
---

## 1. Cagayan (S28)

[80–120 words of rationale, spoiler-free. Why this season
sits at the top of the canon: brain/brawn/beauty conceit, idol
math, the way the new era's voting chaos descends from this one
specific season's tactical innovations.]

## 2. Borneo (S1)

[Rationale.]

## 3. Mom I Won (S45)

[Rationale.]

## 4. New Era I (S41)

[Rationale.]
```

Four entries is enough to prove the loader; phase 5+ extends
the canon as part of the show's launch.

### 8. Tests (colocated, mocked at module boundary)

- `src/content/__tests__/schemas.test.ts`:
  - Show frontmatter accepts the Survivor sample.
  - Show frontmatter rejects: missing `slug`, malformed
    `palette.primary` (non-hex), unknown `status` enum value.
  - Season frontmatter accepts a valid 60-word blurb body.
  - Season frontmatter rejects: 30-word blurb (too short),
    95-word blurb (too long), missing `number`.
  - Theme schema accepts a 3-entry theme.
  - Theme schema rejects: 16-entry theme (over cap), missing
    `entries`.
  - CanonEntry schema accepts a 95-word rationale.
  - CanonEntry schema rejects: 30-word rationale, 130-word
    rationale.

- `src/content/__tests__/parse.test.ts`:
  - `parseSeasonFile()` round-trips frontmatter + body for a
    Survivor sample.
  - `parseCanonFile()` parses the ATX heading sequence into
    4 entries with correct `rank` + `season` + rationale
    paragraph(s) collected.
  - `parseCanonFile()` ignores body content before the first
    heading (preamble text).
  - `parseShowFile()` uses body as tagline fallback when
    frontmatter lacks `tagline`.

- `src/content/__tests__/loaders.test.ts`:
  - Points `setContentRoot()` at a temp dir populated with two
    fake shows + a 3-entry theme. Asserts `getAllShows()`
    sorts deterministically, `getShow()` returns null on
    unknown slug, `getCanon()` returns null when no canon file,
    `getAllSeasons()` sorts by number.
  - `__resetContentCache()` purges between tests.
  - The legal-doc loader resolves all three slugs and returns
    null for an unknown one.

All tests use Vitest's existing setup. No new test infrastructure.

### 9. Wire into verify, run gate

```pwsh
pnpm install
pnpm verify
```

Expected: all green. The phase 1 home page test still passes
(it doesn't depend on content). The new `content:check` step
prints "validated 1 show, 4 seasons, 0 themes, 3 legal docs."

### 10. Commit + push

Single commit, explicit stage. Subject:
`phase 2: content layer (zod + loaders + survivor seed)`.

Body:
- Zod schemas for Show / Season / Theme / Canon / LegalDoc.
- gray-matter + Zod consumed via `src/content/{schemas,parse,loaders}.ts`.
- Survivor seeded as the first show; 4 season blurbs + 4
  canon entries prove the pipeline end-to-end.
- `content:check` script wired into `pnpm verify` between
  `test:run` and `build`.
- Word-count guardrails enforced: 50–80 word season blurbs,
  80–120 word canon rationales.
- Legal trio (`about`, `terms`, `privacy`) loadable via
  `getLegalDoc()` so phase 3 stubs read through the loader.

Decisions:
- gray-matter chosen over a from-scratch YAML parser — ergonomic
  win + Next.js convention.
- Sync FS reads in RSC accepted (Next 15 RSC tolerates them);
  module-level cache avoids re-reads.
- Canon body uses ATX `## NN. <title>` headings, NOT a
  frontmatter array. Reason: editorial flow — writing 4 ranked
  rationales in prose feels native; YAML arrays would push
  content into frontmatter and obscure the text.
- Themes carry their entries in frontmatter (opposite of canon)
  — themes are short curated rankings of 10 items with one-line
  per-item blurbs, so YAML reads cleanly; canon entries are
  longer-form prose.
- `loadAllContent()` exposed for content:check + future
  warm-up needs.

### 11. Tick the DoD + verify deploy

Flip the phase 2 row to `[x] — <commit-sha>` in
`plan/steps/01_build_plan.md`. Commit:
`plan: phase 2 shipped — <one-liner>`.

`pnpm deploy:check`.

## Decisions made upfront — DO NOT ASK

- **Validation library:** Zod (locked in bearings).
- **Frontmatter parser:** gray-matter. Standard.
- **Cache:** module-level lazy map, no invalidation. Phase 14+
  may need a watcher; not yet.
- **Sort orders:** declared in step 5.
- **Canon parsing:** ATX heading sequence in body, not array
  in frontmatter (see Decisions in commit body).
- **Themed list quota:** phase 14 owns the `/themes` route;
  phase 2 ships the loader + schema only and lands an empty
  `content/themes/.gitkeep` to make the directory git-tracked.
- **Cross-validation:** lives in `content:check`, NOT in
  loaders. Loaders return what's on disk; the script enforces
  referential integrity.
- **No Markdown-to-HTML at load time.** Loaders return raw
  body markdown; phase 6 + 7 add the markdown renderer when
  show pages need it. Avoids pulling `remark` etc. before it's
  earned.
- **Survivor canon size at seed:** 4 entries. Enough to prove
  the parser; phase 5 extends. Lower bar than launch coverage
  on purpose — phase 2 ships the seam, not the editorial.
- **Season blurbs at seed:** drafted by the main agent using
  the content-curator's voice rules from agents.md §6 + spec.md
  §"Visual system". Each blurb is 50–80 words, spoiler-free,
  knowledgeable-peer voice. Phase 5+ may revise post-facade.
- **Schema slugs are lowercase kebab-case.** Enforced by Zod
  regex on `slug`.
- **Legal docs already exist on disk** — phase 1 committed
  `about.md`, `terms.md`, `privacy.md` with frontmatter
  (`title`, `updated`). The loader matches the existing
  frontmatter shape; we do not rewrite the legal copy.

## Verify gate

```
pnpm tokens
pnpm typecheck
pnpm test:run          # unit (incl. new content/* tests)
pnpm content:check     # NEW — validates every content/*.md
pnpm build
pnpm e2e               # home spec still green (no new URL routes yet)
```

A failure in `content:check` is a hard regression. Phase 3
extends e2e coverage to every URL; phase 2 only adds the
content gate.

## DoD

- `pnpm verify` green locally.
- `pnpm deploy:check` green on Vercel after push.
- `plan/steps/01_build_plan.md` shows `[x] Phase 2 — Content
  layer (...) — <sha>`.
- `content/shows/survivor.md` + `content/shows/survivor/canon.md`
  + 4 season files exist.
- `src/content/{index,schemas,parse,loaders,paths}.ts` shipped
  with colocated `__tests__/`.
- `scripts/content-check.ts` script exists, exits non-zero on a
  deliberately malformed fixture (tested ad-hoc; covered
  indirectly by the schema unit tests).

## Follow-ups (out of scope for this phase)

- **Markdown rendering.** Phase 6 (show home) pulls in
  `react-markdown` or equivalent to render `blurb_md` /
  `rationale` bodies.
- **Watch-mode cache invalidation.** Not needed until content
  velocity ramps (phase 20+).
- **Schema → JSON-Schema export.** Bearings calls for this so
  Supabase migrations and content stay aligned. Lands when the
  first migration needs it (phase 11+).
- **Cross-language validation (e.g., theme entry's `(show,
  season)` pair resolves).** Currently in `content:check`;
  may migrate to a build-time codegen step if the count grows.
- **Survivor canon expansion** — phase 5 extends to a real
  ranked list with the full editorial canon (≥ 30 entries).
