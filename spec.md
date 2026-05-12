# Pantheon

> A spoiler-free home for ranked TV seasons. Every show gets its
> own pantheon — an editorial canon and a community rank, side
> by side. Reality first, scripted later.
>
> Tagline: **The seasons, ranked. No spoilers.**

---

## Who it's for

Three concentric audiences:

1. **Search arrivers** — someone Googles `ranked survivor seasons no spoilers` and lands on a page that's *actually* spoiler-safe and *actually* ranked. This is the SEO bullseye.
2. **Show binge-prep** — someone about to start a show, wants to know which seasons are worth watching and in what order, without learning any plot.
3. **Returning fans** — someone who has watched, wants to argue rankings, vote, comment, defend their favorite season. This is the social loop.

Pantheon serves all three from the same page surface. The editorial canon is the search-magnet; the community rank + comments is the engagement engine.

---

## What it is (v1)

For each covered show, Pantheon publishes:

- **A show home** — a hero illustration (the show's "facade"), a one-liner, a season grid, links to the two rankings.
- **An Editor's Canon** — `/[show]/canon`. AI-generated ranked list. Each season has a 50–80 word "knowledgeable peer" blurb explaining why it lands where it does, with zero plot, winners, deaths, or twists.
- **A Community Rank** — `/[show]/community`. Vote-driven order. Users [+]/[−] each season; weighted aggregate sets the order.
- **Per-season pages** — `/[show]/season/[n]`. Metadata, blurb, vote widget, comment thread.

Plus cross-show **themed lists** (`/themes/best-finales`, `/themes/best-premieres`) that pull individual seasons across shows into curated collections.

---

## Scope (v1)

**In scope — reality genre cluster:**

- Survivor, The Amazing Race, Big Brother (US), The Bachelor / Bachelorette, Top Chef, RuPaul's Drag Race, The Traitors, Love Island (US/UK), MasterChef, The Great British Bake Off, Project Runway, The Challenge.
- ~12 shows at launch, ~250 seasons total.
- Two rankings per show + season pages → ~525 SEO-able URLs.
- Themed lists: ~10 at launch.

**Out of scope (v1):**

- Scripted television (deferred — needs a tagged-spoiler system).
- Anime, sports, late-night, news.
- Per-episode rankings (only seasons).
- User-submitted rankings (community is a ±1 vote, not a personal ranked list).
- Trailers, video, image galleries.
- Show-team interviews, cast quotes (IP minefield).

**Out of scope forever:**

- Show logos, network branding, official cast photos. Names are used editorially as plain text only. All visuals are bespoke SVG.

---

## URL contract

```
/                            home (featured show + featured rankings)
/shows                       index of all shows
/shows/[show]                show home (facade hero, season grid)
/shows/[show]/canon          Editor's Canon
/shows/[show]/community      Community Rank
/shows/[show]/season/[n]     single season (vote + comments)
/themes                      index of themed lists
/themes/[theme]              single themed ranking
/about                       about, methodology, no-spoilers policy
/sign-in                     magic-link entry
/u/[handle]                  public user profile
/mod                         moderation queue (mod role only)
```

API:

```
POST /api/vote               { season_id, value: +1|-1 }
POST /api/comment            { target_id, target_type, body }
POST /api/flag               { comment_id, reason }
GET  /api/ranking/[show]     cached aggregate, served via ISR
```

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript strict |
| Styling | Tailwind CSS + CSS-only motion |
| Hosting | Vercel |
| Static content | Markdown + frontmatter in `content/` |
| Dynamic data | Supabase (Postgres + Auth helpers + RLS) |
| Auth | Auth0 (magic-link passwordless) for verified users; HttpOnly cookie + Supabase `sessions` row for anonymous guests (no Auth0 round-trip). Tenant: `pantheon-app.us.auth0.com`. Audience: `https://api.pantheon.app`. Full setup runbook in `setup/04_auth0.md`. |
| Search | Supabase full-text (Algolia later if needed) |
| AI — editorial (build-time) | Claude Code agent itself (Pro/Max subscription). Blurbs, canon rationales, post-finale pieces are written by /iterate and committed as markdown. No external API. |
| AI — moderation (runtime) | OpenAI (`gpt-4o-mini` or equivalent fast model) called from Next.js server actions. Pre-filters comments for spoilers + abuse at submit. |
| Test runner | Vitest |
| E2E | Playwright (hermetic, alt-port, no live network) |
| Lint/format | Biome |
| Package manager | pnpm |

---

## Data model

**Static (in repo, the loop edits these):**

```
content/
  shows/
    survivor.md                    # show metadata
    survivor/
      seasons/
        01-borneo.md               # season blurb + metadata
        02-australian-outback.md
        ...
      canon.md                     # Editor's Canon ordered list + per-rank rationale
  themes/
    best-finales.md                # cross-show themed list
```

Show frontmatter:
```yaml
slug: survivor
name: Survivor
network: CBS
format: outwit-outplay-outlast
hero_motifs: [palm-column, torch-pediment, woven-frieze]
palette: { primary: "#c9551a", ink: "#1a1410", paper: "#f5efe6" }
sigil: ./sigil.svg
status: airing
```

Season frontmatter:
```yaml
show: survivor
number: 41
title: New Era I
premiere_date: 2021-09-22
ep_count: 13
location: Mamanuca Islands, Fiji
host: Jeff Probst
format_changes: [shorter-season, hourglass-twist, shot-in-the-dark]
canonical_position: 18
blurb_md: |
  ... (no plot, no winners, no twists. Vibes, format, casting energy.)
```

**Dynamic (in Supabase):**

```sql
users          (auth0_sub, handle, display_name, role, joined_at, weight_multiplier)
sessions       (id, auth0_sub_or_null, ip_hash, created_at)  -- anon-guest tracking
votes          (id, target_type, target_id, user_id_or_session_id, value, weight, created_at)
comments       (id, target_type, target_id, user_id, body_md, status, parent_id, created_at)
flags          (id, comment_id, reporter_id, reason, created_at)
mod_actions    (id, mod_id, target_type, target_id, action, note, created_at)
ai_decisions   (id, target_type, target_id, decision, model, reason, created_at)  -- audit
```

Vote weighting (anti-brigade):
- Logged-in user, account ≥ 7 days old: weight `1.0`.
- Logged-in user, account < 7 days: weight `0.25`.
- Anonymous-guest session: weight `0.1`. Hard daily cap.
- Mod can adjust per-user `weight_multiplier` for known-good or sock accounts.

---

## Identity & moderation

**Identity tiers:**
- **Read** — no auth needed.
- **Vote** — HttpOnly cookie session issued by Next.js middleware (UUID-v4 session_id, mapped to Supabase `sessions` row). No Auth0 round-trip for guests. IP-rate-limited. Counts at 0.1×. When the same session later authenticates via magic link, the row is upgraded with the Auth0 sub and prior guest votes follow the user into their account.
- **Comment** — magic-link verified via Auth0 passwordless. Counts at 1.0× after 7-day account age.
- **Mod** — Auth0 `mod` role granted manually in dashboard; gated via the `permissions` claim in the access token (RBAC enabled on the Pantheon API). Drains the queue at `/mod`.

**Comment moderation flow:**
1. AI pre-filter at submit (OpenAI `gpt-4o-mini`, fast, structured-output JSON): blocks slurs, spoilers (winners/deaths/twists/finale outcomes), and obvious abuse.
2. Account-age hold: first 5 comments from new accounts queue for human approval.
3. Live comments are visible immediately after passing 1+2.
4. 3 community flags = auto-hide pending review.
5. Mod queue at `/mod` shows held + flagged items with one-click approve/remove/ban.

Every AI moderation decision is logged in `ai_decisions` for audit.

---

## Visual system (the agnostic theme)

**Concept:** every show is a *Pantheon* — a flat-illustrated architectural facade composed of motifs unique to that show. The common theme is the architectural language (column / pediment / frieze / ornament), not the motifs themselves.

Examples:
- **Survivor** — palm-trunk columns, torch-pediment, woven frieze.
- **Top Chef** — knife pediment, salt-cellar columns, herb frieze.
- **The Bachelor** — rose frieze, candle columns, crystal pediment.
- **RuPaul's Drag Race** — pink scallop pediment, sequin frieze, mirror columns.
- **Big Brother** — eye pediment, screen columns, geometric grid frieze.
- **The Amazing Race** — pin-flag pediment, route-line columns, postmark frieze.

Each show ships with:
- A `sigil.svg` — small badge for cards/headers/share previews.
- A `facade.svg` — full hero composition for the show home.
- A 3-color palette (primary, ink, paper).
- Optional ornament SVGs reused on season pages.

**Common UI affordances:**
- `[+] [−]` vote pair next to every ranked item, animated count, color-coded delta.
- Comment threads styled as a margin column to the right of each season blurb.
- A consistent "spoiler-free" shield mark in the corner of every page.

The full visual brief lives in `claude-design.prompt.md`.

---

## SEO posture

The fight is `ranked X seasons no spoilers` for every X in the cluster. Tactics:

- **Two indexable pages per show** (canon + community), each with structured data (`ItemList` schema, every season as a `ListItem`).
- **Per-season pages** indexable, with `Article` schema and FAQ schema for `is X spoiled?` style questions.
- **No-spoilers shield** rendered as on-page text + an explicit `meta` description on every page: "No plot, no winners, no twists."
- **Themed lists** to capture long-tail (`best reality finales`, `best premiere seasons`).
- **Page weight** — under 80KB/page for first paint. Static-rendered + ISR for dynamic ranking changes.
- **Internal linking** — every season links to its show's canon+community, every comparison links season-to-season across shows.

Anti-tactics (deliberate non-goals): no AI-spam landing pages, no doorway pages, no fake-FAQ stuffing, no comparison-bait listicles.

---

## Standing decisions (the loop will not ask)

- Ranking display is always 1-to-N with the highest-ranked at top.
- Season blurb is 50–80 words, never longer.
- "No spoilers" means: no winners, no eliminations, no plot beats, no deaths, no twists, no finale outcomes, no relationship outcomes. Format changes, casting energy, location, tonal shifts, structural innovations — all fair.
- Voice is *knowledgeable peer*: confident, warm, plain-spoken, never pretentious, no exclamation points unless quoted.
- Comments default sort: highest-weighted vote score, then newest.
- New shows must launch with full editorial canon before going live. Community rank starts from canon's order.
- Show name is plain text. Logos are never used. SVG facade is the only branding.
- Empty community rank shows the canon order with a "be the first to vote" prompt.
- Mobile-first; every layout works at 360px.
- Dark mode default, light mode opt-in via toggle.

---

## Hard rules

1. **Spoilers are a P0 incident.** Any merged spoiler is a same-day patch + a postmortem.
2. **Commit and push as a single atomic act.** No unpushed commits.
3. **No emojis, no `Co-Authored-By` trailers** anywhere in code or content.
4. **The verify gate is non-negotiable.** No `--no-verify`. Hermetic e2e walks every URL with no live network.
5. **The deploy gate runs after every push.** Red deploy = blocked tick.
6. **AI moderation decisions are logged.** Always auditable.
7. **No live show logos, no live cast photos, no scraped show content.** Editorial use of names + bespoke SVG only.

---

## Phases (sketch — `plan/steps/01_build_plan.md` will own the canonical list)

1. Bootstrap (Next.js + nexus overlay + Supabase + Auth0 wiring stubs).
2. Static content layer (markdown loader, frontmatter validators, content schemas).
3. URL contract scaffolding (every route returns 200 with stubs).
4. Pantheon facade system (SVG primitives + first 3 shows' facades).
5. Show home page **(canonical sibling — every later show mirrors this)**.
6. Editor's Canon page.
7. Community Rank page.
8. Single season page (vote widget + comment thread shell).
9. Auth integration (Auth0 magic link + anon session).
10. Vote backend (Supabase tables + API + new-account ramp + anti-brigade).
11. Comment backend (Supabase + AI pre-filter + flag queue).
12. Moderation form `/mod` (mod role, drain queue).
13. Themed lists.
14. Search.
15. Home page hero.
16. SEO meta + sitemaps + structured data.
17. Performance + a11y polish.
18. RSS + newsletter.
19. `/critique` + `/triage` wiring.
20–N. `/iterate` runway: backfill remaining shows, more themes, refresh blurbs, new facades.

---

## How "self-sustaining" works here

After phases 1–18 ship, the project enters **/iterate endgame**:

- `/critique` visits live show pages as a stranger every ~12 commits. Findings about voice fidelity, ranking gaps, broken facades land in `plan/CRITIQUE.md`.
- `/triage` reads incoming GitHub issues from users.
- `/iterate` drains both queues, adding new themed lists, refreshing stale blurbs, commissioning new facades, deepening canons.
- Event triggers (a finale air date in `content/calendar.yml`) prompt `/iterate` to write a "post-finale ranking shift" piece spoiler-free, ship it, and bump that show's canon position if warranted.
- Every change goes through verify + deploy gates. Drift is caught by `/oversight` checkpoints.

The loop's job is to keep Pantheon's content fresh, the canons defensible, and the community healthy — without you watching every commit.
