# Bearings — Pantheon

> Standing context for every command. Read alongside the
> relevant skill file and the matching phase brief. If anything
> here changes, update in the same commit as the change.

## What we're building

`spec.md` at the repo root is the canonical product description.
TL;DR:

> **Pantheon** — a spoiler-free home for ranked TV seasons.
> Every show gets its own pantheon: an Editor's Canon (AI-written,
> blurb-rich) and a Community Rank (vote-driven), side by side.
> Reality genre cluster at launch (~12 shows, ~250 seasons).

The promise (reinforced at every depth — pediment flame, hero
headline, shield pill, vote question, inline comment reminder):
**The seasons, ranked. No spoilers.**

**Live at:** `https://pantheon-coral.vercel.app`

## Surface

**Surface:** `site`

**Auth:** `session-cookie` (per nexus's auth-aware-critique
patterns). Pantheon's read pages are public — meaning
`/critique` runs **two passes per invocation**:

1. **Anonymous pass** — no cookie attached. Walks the URL set
   as a first-time visitor would. Captures: hero copy, sign-in
   CTA visibility, the spoiler shield, vote-pair affordance
   in its un-acted state, comment-area "sign in to comment"
   prompt, public canon + community pages.
2. **Authenticated pass** — cookie attached as the
   `e2e@pantheon.app` user. Walks the URL set as a returning
   member would. Captures: /sign-in's authed-redirect target,
   /u/[handle] for itself, the comment-input affordance in its
   live state, the vote-pair in its post-click state with
   delta animation, the "your account" chrome.

Both passes file findings to `plan/CRITIQUE.md` tagged
`anon:` or `authed:` in the source column so `/iterate` can
distinguish "first-impression cold-search regression" from
"member-only path regression." Coverage is union, not
intersection — a finding present in both passes is still one
finding (the reader sub-agent dedupes by message).

The authed cookie is minted by `scripts/mint-e2e-cookie.mjs`
(password-realm grant against Auth0) and surfaced via the
`CRITIQUE_SESSION_COOKIE` env var (auto-managed in `.env`).
Same cookie powers Playwright storageState for the e2e
harness — one mint, two consumers.

See `setup/04_auth0.md` Section M for the e2e user setup; see
"Hermetic e2e contract" below for the harness wiring.

## Stack (locked — do not re-litigate)

| Layer | Choice | Why |
|---|---|---|
| Repo | single-package Next.js (no monorepo) | small surface; defer pnpm workspaces until justified |
| Framework | Next.js 15 (App Router) | SSG/ISR for SEO pages; server actions for vote/comment/mod |
| Language | TypeScript strict | match Pantheon's editorial precision |
| Styling | Tailwind CSS reading from CSS custom properties | per-show palette swap is the delight moment; CSS vars are the cleanest path |
| Content | Markdown + frontmatter (Zod-validated) under `content/` | nexus's GitHub-as-DB sweet spot for SEO pages |
| Structured data (dynamic) | Supabase Postgres (hybrid-with-managed-postgres) | votes, comments, sessions, mod actions, ai_decisions |
| Schemas | Zod, generated to JSON Schema for migrations | one source of truth for content + Supabase rows |
| Test (unit) | Vitest | fast, ESM-native |
| Test (e2e) | Playwright | hermetic, alt-port `:4173` against `next start`, walks every URL with no live network |
| Lint / format | Biome | one tool, fast |
| Pkg mgr | pnpm | matches keyboard / nexus convention |
| Hosting | Vercel | best Next.js integration, deploy gate API ready |
| Analytics | Vercel Web Analytics (`@vercel/analytics/next`) gated on `DISABLE_ANALYTICS=1` env var (set by Playwright config) — pattern lifted from keyboard's `VercelAnalytics.tsx` | First-party, no script tag, privacy-acceptable; server-side env gate keeps the production dataset clean of bot pageviews |

## External services

Per `nexus/customization/external-services.md`, Pantheon ships
its `setup/` runbooks pre-flighted before phase 1.

| # | Service | Runbook | Status | Last verified | Dashboard |
|---|---|---|---|---|---|
| 01 | GitHub | `setup/01_github.md` | ✅ | 2026-05-12 | github.com/daretodave/pantheon |
| 02 | Vercel | `setup/02_vercel.md` | 🟡 | 2026-05-12 | vercel.com/<team>/pantheon |
| 03 | Supabase | `setup/03_supabase.md` | 🟡 | 2026-05-12 | supabase.com/dashboard/project/dvdzfugmmivjxzvmpiiq |
| 04 | Auth0 | `setup/04_auth0.md` | 🟡 | 2026-05-12 | manage.auth0.com (tenant: pantheon-app.us.auth0.com) |
| 05 | Email (Resend) | `setup/05_email.md` | ⏸️ | n/a | deferred until domain owned |
| 06 | OpenAI | `setup/06_openai.md` | 🟡 | 2026-05-12 | platform.openai.com |

`/oversight` reads `setup/00_files.md` every tick and surfaces
drift before it stalls a `/march` run.

## Auth provider

**Auth provider:** Auth0

Tenant: `pantheon-app.us.auth0.com`. API audience:
`https://api.pantheon.app` (logical identifier — does not
require domain ownership). Magic-link passwordless only; no
social, no password DB. RBAC enabled for the `mod` role gate.

Full runbook: `setup/04_auth0.md`.

## Identity tiers

- **Anonymous** (no Auth0 round-trip): can read everything. Can
  vote — Next.js middleware sets an HttpOnly UUID-v4 cookie on
  first request, mapped to a row in `sessions`. IP-rate-limited;
  vote weight 0.1×. Hard daily cap on guest votes.
- **Authenticated** (magic-link via Auth0): can comment, can
  flag, can edit/delete own comments. Vote weight 1.0× after
  account is 7 days old; 0.25× during the new-account ramp.
- **Mod** (Auth0 `mod` role granted manually in dashboard):
  drains the `/mod` queue. Permissions checked via the
  `permissions` claim in the Auth0 access token (RBAC enabled
  on the API).
- **Account-age requirement for write:** 7 days for full vote
  weight; comments allowed immediately but first 5 are pre-mod
  hold.
- **Email verification:** required for the comment tier (magic
  link IS the verification).

## Anti-abuse posture

- **Vote weighting:**
  - Logged-in user, account ≥ 7 days old → weight `1.0`.
  - Logged-in user, account < 7 days → weight `0.25`.
  - Anonymous-guest session → weight `0.1`.
- **Vote rate-limit:** 1 vote per (target, voter) — DB unique
  constraint enforces. Plus IP-level rate-limit on guest
  sessions: 100 votes/IP/day.
- **Comment rate-limit:** 5 comments/user/hour, 30/day. 20
  comments/IP/hour for guest-attempted writes (rejected
  pre-DB; comments require auth).
- **Submission rate-limit:** N/A — Pantheon doesn't accept user
  submissions in v1.
- **IP-hash retention:** SHA-256 of `(ip + monthly_salt)`,
  retained 30 days.
- **CAPTCHA threshold:** never in v1 (Auth0's bot detection
  handles signup flow). Add in v2 if needed.
- **Account-age gate before write:** comments allowed
  immediately but pre-mod for first 5 (see Moderation flow).

## Moderation flow

- **Mod flow:** `ai-pre-filter`
- **Mod queue location:** Supabase `comments` table where
  `status = 'pending' | 'hidden'`
- **AI pre-filter model:** `openai:gpt-5-mini-2025-08-07`
  (pinned date; bump explicitly via a phase, not silently)
- **`/oversight` escalation thresholds:**
  - Flagged spike: ≥ 5 flags in 1 hour on the same target
  - New-account hold queue ageing: any held comment >24h
    awaiting human review
  - Repeat-flag pattern: ≥ 3 flags on the same `user_id` in
    7 days
- **Mod audit log:** Supabase `mod_actions` table (immutable
  rows, every action logged with mod_id + target + reason)
- **Mod role membership:** Auth0 `mod` role granted manually
  in Auth0 dashboard → User Management → Users → Roles. The
  Auth0 Action `Add Pantheon claims` ships the `permissions`
  claim that includes `mod:read`, `mod:approve`, etc.

See `nexus/customization/moderation-loop.md` for queue-drain
mechanics.

## Database posture

**Pantheon v1 is an experiment.** The agent has full destructive
authority on Supabase: drop tables, drop the database, truncate,
rewrite migrations, replay schemas. No confirmation required.

The audit trail is git (every migration is a committed file in
`supabase/migrations/`) plus Supabase's built-in daily backups
(7-day retention on free tier).

This rule tightens when:
1. Real users have non-recoverable data (e.g. genuine comments
   the user wants to preserve)
2. We graduate from `experiment` posture (will be marked here)

For now: the agent is comfortable destroying state if a clean
rebuild is the simplest path forward. Phase briefs that touch
schemas should normalize this — they note "drop existing schema
and re-migrate from current state" as a valid step rather than
a last resort.

## AI usage map

| Surface | AI's role | Human gate | Model |
|---|---|---|---|
| Editor's Canon ranking + blurbs | generated by `/iterate` | post-edit by `/oversight` reads + `/critique` flags | Claude Code agent itself (the loop) |
| Show page hero blurb | generated by `/iterate` | post-edit on critique signal | Claude Code agent |
| Themed list curation | generated by `/iterate` / `/ship-content` | post-edit on critique signal | Claude Code agent |
| Shared brand mark + favicons + OG + wordmark | rendered by `brander` from spec | re-rendered by `brander` if critique flags | Claude Code agent |
| Per-show palette | hand-picked when the show is added (color + typography is the brand) | manual override always available | Claude Code agent |
| Comment moderation pre-filter | filter (verdict in / out) | mod review on hold queue | `openai:gpt-5-mini-2025-08-07` |
| Mod actions (remove, ban, approve) | none — human only | — | — |
| Spec writing | none — human only | — | — |
| Build plan changes | proposed by `/expand` | promoted by `/oversight` | Claude Code agent |

The trustworthiness contract: every AI moderation decision is
logged to `ai_decisions`. Editorial AI prose is reviewed by
`/critique` (fresh-eyes) periodically. No AI decision is
irreversible.

## URL contract (locked)

Permanent surfaces. Add new ones via new phases; don't change
existing shapes.

```
GET  /                              home (featured show + featured rankings)
GET  /shows                         index of all shows
GET  /shows/[show]                  show home (facade hero, season grid)
GET  /shows/[show]/canon            Editor's Canon
GET  /shows/[show]/community        Community Rank
GET  /shows/[show]/season/[n]       single season page (vote + comments)
GET  /themes                        index of themed lists
GET  /themes/[theme]                single themed ranking
GET  /about                         about + methodology + spoiler policy
GET  /terms                         terms of service (minimal, no contact)
GET  /privacy                       privacy policy (minimal, no contact)
GET  /sign-in                       magic-link entry
GET  /u/[handle]                    public user profile
GET  /mod                           moderation queue (mod role only)
GET  /api/auth/[...auth0]           Auth0 SDK routes
POST /api/vote                      { season_id, value: +1|-1 }
POST /api/comment                   { target_id, target_type, body }
POST /api/flag                      { comment_id, reason }
GET  /api/ranking/[show]            cached aggregate, served via ISR
POST /api/webhooks/resend           bounce/complaint webhook (deferred)
```

## Repository shape

```
pantheon/
├── spec.md
├── agents.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── biome.json
├── playwright.config.ts
├── vitest.config.ts
├── public/                                 # generated assets + static
│   ├── favicon.ico                         # shared brand mark — generated by brander
│   ├── favicon.svg
│   ├── icon-{16,32,48,180,192,256,512}.png
│   └── apple-touch-icon.png
│                                           # NO per-show SVGs — color + type only
├── src/
│   ├── app/                                # Next.js App Router
│   ├── components/
│   ├── lib/
│   └── content/                            # markdown loaders + Zod schemas
├── content/                                # show + season + theme markdown
│   ├── shows/<slug>.md
│   ├── shows/<slug>/seasons/NN-<title>.md
│   ├── shows/<slug>/canon.md
│   └── themes/<slug>.md
├── supabase/
│   ├── config.toml
│   ├── migrations/*.sql
│   └── seed.sql
├── scripts/
│   ├── deploy-check.mjs
│   ├── build-icons.mjs
│   └── content/manifest.mjs
├── plan/, skills/, .claude/, .github/, design/, setup/
└── .env, .env.example, .gitignore
```

## The `design/` folder

The user emits design exports asynchronously. The folder is the
**single source of truth** for anything visible — chrome, page
composition, brand mark, interactions, type, color. Read order:

1. `design/CLAUDE.md` — visual law. Supreme on conflict with
   any older guidance in this file or elsewhere.
2. `design/Pantheon · Brand.html` — brand mark, header, footer
   spec.
3. `design/Pantheon · Survivor.html` — canonical production
   show page.
4. `design/Pantheon · Heroes vs. Villains.html` — canonical
   production season page.
5. `design/Pantheon · {Show Identity, Compositions, Tokens}.html`
   — supporting reference.
6. `design/compositions/screens.jsx` + `screens.css` — React +
   CSS source of truth for chrome and page shells.
7. `design/compositions/interactions.jsx` — VotePair,
   CommentInput, RankShiftPill. Production ports, not
   re-interpretations.
8. `design/tokens.json` — design tokens (Tailwind + CSS vars
   derive from this).

The reading order is also mirrored in the repo root `CLAUDE.md`.

**The loop does not wait for design.** Ship from sibling +
bearings if a piece is missing; integrate when it lands.
**Design's own brief wins over bearings on conflict.**

## Visual & tonal defaults

Pantheon's identity rests on **color + typography**. Each show
has a three-color palette (paper / ink / primary) and a serif
wordmark. **There is no per-show illustration**: no facades, no
per-show sigils, no mascots, no ornaments. The only SVG in the
product is the **shared Pantheon brand mark** (pediment + three
columns, monochromatic, `0 0 28 28` viewBox, 1.4-unit strokes
in `currentColor`) which appears in every header and footer.

Where a show needs a marker — in a list, beside a wordmark, in
a crumb — use a 12–16px filled circle in `var(--show-primary)`,
class `.bullet`. That is the only show-specific graphic
permitted in the entire system.

The May 2026 facade grammar (column / pediment / frieze /
ornament on a 1200×800 frame) was **prototyped and rejected**.
Do not retry; do not "improve;" do not add "just one small
icon." `design/CLAUDE.md` carries the binding statement.

Locked specifics:
- **Mode:** dark default + light opt-in. Toggle lives in the
  footer. Persisted in `localStorage.pantheon_theme`. Ships in
  phase 1.
- **Palette tokens:** `design/tokens.json` is canonical. Dark
  primary `#E8B65A` (ceremonial gold); light primary `#8B5A1F`
  (warm clay). Never override paper / ink / line colors
  per-show — those are the Pantheon defaults; per-show tinting
  uses `--show-paper / --show-ink / --show-primary` CSS vars
  on a page wrapper, not token overrides.
- **Per-show chrome tinting:** on a show page (show home,
  canon, community, season), the **page body AND the topnav +
  footer chrome** read `--show-paper / --show-ink /
  --show-primary`. The brand mark uses `currentColor` so it
  picks up the show ink automatically. On non-show pages
  (home, themes, search, about, terms, privacy, sign-in,
  /u/[handle], /mod) the chrome reads the neutral Pantheon
  paper. Implementation: CSS custom properties scoped to
  `[data-show=<slug>]` on the page wrapper, or to the page
  layout file directly.
- **Page width:** show + season pages are **full-bleed** (the
  whole viewport tints to the show palette); home, themes,
  search, and editorial routes are **bounded** by a max-width
  1240px wrap with 32px x-padding (20px on mobile). The wrap
  pattern is `class="wrap"` in design/. See `Pantheon · Brand.html`
  for the header/footer wrap usage.
- **The brand mark:** a single inline SVG, shared across every
  show. Rendered at six standard sizes only: **16 / 22 / 28 /
  48 / 96 / 240**. Never recolor with a gradient; never crop or
  rotate; never invent per-show variants.
- **Wordmark:** the serif word "Pantheon" in Source Serif 4
  weight 600, sized to context, sitting 10px right of the
  brand mark in the header and footer lockup.
- **Type families:** Source Serif 4 (headlines / blurbs / body
  prose), Inter (UI chrome), JetBrains Mono (rank numbers,
  meta, eyebrows).
- **Type scale:** as in `tokens.json` `type.scale`.
- **Spacing scale:** 8px base, full ramp in `tokens.json`.
- **Shadow contract:** single 1px offset, opacity varies. Never
  geometry. (See `tokens.json` `shadow._note`.)
- **Motion:** durations 120ms / 240ms / 480ms; named eases
  rise / settle / linear / dwell. `prefers-reduced-motion`
  replaces transforms with opacity fades at duration.base.
- **Voice:** knowledgeable peer — confident, warm, plain-spoken,
  never pretentious. No exclamation points unless quoted. Plain
  sentences over clever ones.

## Show identity (the seven-field contract)

Every show in `content/shows/<slug>.md` carries exactly seven
frontmatter fields. No more, no less.

```yaml
slug: survivor
name: Survivor
palette:
  paper:   "#0E2A2A"
  ink:     "#EFE2BD"
  primary: "#D55E36"
seasons: 47
status: airing                    # airing | ended | hiatus
blurb:   "47 seasons. One torch at a time."
tagline: "47 seasons of strangers on a beach. We've ranked every single one. No spoilers, no exceptions."
```

Notes:
- **`seasons`** is an int — the count of aired/airing seasons.
- **`blurb`** is the short hero subtitle (one sentence,
  preferably two short lines as printed).
- **`tagline`** is the longer editorial line readers quote to
  friends — appears in the show page hero meta column.
- **No `hero_motifs`. No `format`. No `network`. No
  illustration field of any kind.** The May 2026 facade
  grammar that needed those fields is retired; if a contributor
  proposes an eighth field that is graphical in nature, reject
  it.

## Plan expansion posture

**Mode: bold** (default).

`/expand` runs at standard cadence and files candidates to
`plan/PHASE_CANDIDATES.md`. `/oversight` promotes them to the
build plan. This balances autonomous growth (the loop notices
gaps and proposes work) with human curation (only promoted
candidates ship).

Switch to `autonomous` once Pantheon has shipped 15+ phases
cleanly and the user trusts `/expand`'s judgment.

## Content velocity & editorial cadence

Pantheon's `/iterate` and `/ship-content` skills enforce four
content rules. The loop dispatches to `/ship-content` when any
of these surface in `plan/AUDIT.md` with score ≥ 3.0:

### Rule 1 — show coverage quota
Launch covers 12 shows: Survivor, The Amazing Race, Big Brother
(US), The Bachelor, The Bachelorette, Top Chef, RuPaul's Drag
Race, The Traitors (US), Love Island (US), Love Island (UK),
The Great British Bake Off, Project Runway, The Challenge.

If `count(content/shows/*.md) < 12`, file a Pending audit row
per missing show. `/ship-content` ships one full show per tick
(metadata + canon + 3 initial season blurbs + facade
commissioned via brander).

### Rule 2 — canon completeness
Every aired season of every covered show must have a 50–80
word blurb in `content/shows/<slug>/seasons/NN-<title>.md`,
**and** a `canonical_position` entry in
`content/shows/<slug>/canon.md`.

If either is missing, file a row. `/ship-content` ships a
batch (3-5 season blurbs per tick to amortize show context).

### Rule 3 — themed list quota
Launch ships ≥ 10 themed lists (best premieres, best finales,
best post-merge, etc. — see `plan/PHASE_CANDIDATES.md` for
seed themes). If `count(content/themes/*.md) < 10`, file a row;
`/ship-content` ships one themed list per tick.

### Rule 4 — retired (was: facade completeness)

The May 2026 facade grammar was prototyped and rejected. There
is no per-show illustration in Pantheon. The visual identity
is **color + typography** with a shared brand mark — see the
Visual & tonal defaults section above and `design/CLAUDE.md`.

If a `/ship-content` queue has any historical row tagged
`category: facade-gap` or referencing `hero_motifs`, mark it
`[x]` with the note `superseded by 19a` and move on. New
content-gap findings of this kind should not be filed.

### Bias mechanism
`/oversight` can write a `> Bias: content-gaps` line in
`plan/AUDIT.md` to multiply content-gap scores by 1.5x for the
next N ticks. Use after substrate is solid (phases 1–18) to
direct the loop into content velocity.

## Standing decisions (the loop will not ask)

- **Pagination:** none until N > 50 items in any list (after
  which, fetch-as-you-scroll, no page numbers).
- **Sort default for rankings:** highest-ranked at top; ties
  broken by `canonical_position` then alphabetical.
- **Sort default for comments:** weighted vote score desc,
  then newest first.
- **Empty state copy template:** `"<noun> haven't been added
  yet — this page populates as the loop ships them."` Tone:
  matter-of-fact, not apologetic.
- **Loading state:** skeleton screens via Tailwind `animate-pulse`,
  no spinners, no `Loading…` text.
- **Error state:** `text-warm-down` color, 14px, with a
  `Retry` link below.
- **Top-N count for "trending" or "featured":** 5.
- **Comments default visibility threshold:** weighted score
  ≥ −2 (auto-collapse below).
- **Season blurb word count:** 50–80 words. Strict.
- **Canon rationale word count:** 80–120 words per ranked
  position.
- **Themed list size:** 10 entries default; 15 max.
- **Mobile breakpoint:** 768px (Tailwind `md`).
- **Theme toggle:** lives in the footer. Reads/writes
  `localStorage.pantheon_theme` (`'dark' | 'light'`). On
  mount, falls back to `'dark'` if absent. Sets
  `<html data-theme="...">` so the token sheets switch
  cleanly. Ships in phase 1.
- **Spoiler ambiguity:** when in doubt, redact. The `spoiler`
  label always exists in GitHub; `/triage` opens issues for
  review when uncertain.
- **Pre-launch sign-in:** Auth0 dev SMTP is the v1 sender
  (per `setup/04_auth0.md` Section F). Magic links arrive from
  `no-reply@auth0.com`-flavored addresses until domain is owned.
- **Custom domain:** deferred. All references stay at
  `pantheon-coral.vercel.app`. When the domain lands, swap
  refs via a single `chore: custom domain` commit.

## Hard rules

(Mirrors `agents.md` Standing Rules. Update there first;
this echoes.)

1. **Commit and push as a single atomic act.**
2. **No `Co-Authored-By:` trailers, no emojis.** One carve-out:
   `Cloud-Run:` trailer for cloud-loop commits.
3. **Verify gate non-negotiable. Deploy gate non-negotiable.**
4. **No `--no-verify`, no force-push, no destructive resets.**
5. **Every commit ships unit tests AND contributions to the
   e2e harness** (canonical-urls + page-reads if new URL).
   See agents.md §5a for the discipline.
6. **Pantheon is lowercase in body prose.**
7. **Spoilers are P0.**
8. **DB mutations are autonomous in v1 experiment posture.**
9. **Content stays in `content/`; data stays in Supabase.**
10. **Never commit secrets.**
11. **Vercel Analytics is gated on `DISABLE_ANALYTICS=1`.**
    Playwright config sets it; the production beacon never
    sees bot traffic.

## Verify gate (composition)

```bash
pnpm typecheck      # tsc --noEmit
pnpm test:run       # vitest run (unit tests; required on every commit)
pnpm content:check  # zod-validate every content/*.md (lands phase 2)
pnpm build          # next build
pnpm e2e            # playwright against `next start` on :4173, hermetic
```

Single command:
```bash
pnpm verify
```

## Hermetic e2e contract

Adopted from keyboard, ships as **phase 3** (not late polish).
Every later phase inherits the harness; new URLs pay the
"contribute to the harness" tax automatically.

The three load-bearing fixtures:

- `apps/e2e/src/fixtures/canonical-urls.ts` — single source of
  truth listing every URL the site serves, derived
  programmatically from the content loaders (every show slug,
  every season number, every theme slug auto-included). The
  sitemap and the smoke walker both consume this fixture.
- `apps/e2e/src/fixtures/page-reads.ts` — typed map keyed by
  URL pattern (`/shows/[show]`, `/shows/[show]/season/[n]`,
  etc.) declaring what each page family asserts: H1 present,
  N expected elements, no console errors, no horizontal scroll
  at 375px, response status `200`.
- A **mobile spec template** — every page tested at 375px
  viewport. Reflow violations fail the gate.

The harness runs against `next start` on port `:4173` (not the
dev server) — production build, real Server Components, real
ISR cache. With `DISABLE_ANALYTICS=1` set in
`apps/e2e/playwright.config.ts` so the Vercel Analytics beacon
stream stays clean.

**Hermetic** means: the e2e leg makes no live external calls
during the test run itself.
- **Supabase**: a local Supabase instance via `supabase start`
  (Section B of `setup/03_supabase.md`). Migrations + seed run
  before tests. Tests can drop and reset between specs.
- **Auth0**: NOT stubbed — we hit Auth0 once to mint the e2e
  user's session cookie (`scripts/mint-e2e-cookie.mjs` →
  password-realm grant → encrypted session via the v4 SDK
  algorithm). The cookie caches at `.cache/e2e-cookie.json`
  with a freshness window; subsequent runs re-use until ≤5
  min from expiry. The test run itself never talks to Auth0.
- **OpenAI moderation**: faked via a deterministic stub. The
  `/api/comment` route checks `process.env.OPENAI_FAKE === '1'`
  and returns a canned verdict. Set in playwright config.
- **Vercel Analytics**: gated off via `DISABLE_ANALYTICS=1`
  (per agents.md §11).
- **Resend**: not exercised in e2e (deferred email path).

The `/critique` reader sub-agent uses the SAME minted cookie
(via `CRITIQUE_SESSION_COOKIE` env var) when walking the LIVE
site. So critique is automatically authenticated and can see
+ click vote pairs, write comments (against the live mod
queue, which then drains via the mod's own /critique pass),
inspect /u/[handle], etc. This is the auth-aware-critique
pattern from nexus's customization/auth-aware-critique.md.

The minter script is the load-bearing piece. Pattern: Auth0
password-realm grant → mint OIDC tokens → encrypt session
payload with `AUTH0_SECRET` matching the `@auth0/nextjs-auth0`
v4 SDK's exact JWE algorithm (HKDF SHA-256 → A256GCM, info
`"JWE CEK"`, 32-byte length) → cache at
`.cache/e2e-cookie.json` with a 5-minute pre-expiry refresh
window → upsert `CRITIQUE_SESSION_COOKIE=__session=<value>`
in `.env`. Pantheon's port lands as part of phase 3 at
`scripts/mint-e2e-cookie.mjs`.

## Deploy gate

```bash
pnpm deploy:check
```

Polls Vercel for the deploy at HEAD. Exits 0 ready, 1 error,
2 timeout, 3 config/auth.

Implementation: `scripts/deploy-check.mjs`. Provider block
enabled for Vercel. Reads `VERCEL_TOKEN`, `VERCEL_PROJECT`,
`VERCEL_TEAM_ID`.

## Operational notes

- **Auto-deploys:** every push to `main` deploys.
- **Preview deploys:** every PR.
- **A red `main` = a red site.** Verify is pre-flight; deploy
  is post-flight.
- **Cloud loop:** `.github/workflows/march.yml`, manual
  `workflow_dispatch` only for now (per user direction; cron
  re-enables once vetted locally).
- **Operational secrets:** in `.env` (gitignored); mirrored
  to Vercel + GH Actions per `setup/`.

## Useful commands

```bash
pnpm dev              # local dev
pnpm verify           # full pre-commit gate
pnpm deploy:check     # post-push deploy gate
pnpm build:icons      # regenerate favicon set from public/sigil.svg
supabase db push      # apply pending migrations to remote
supabase db reset     # local: drop + replay all migrations + seed
```
