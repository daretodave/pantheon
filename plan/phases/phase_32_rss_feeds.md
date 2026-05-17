# Phase 32 — RSS feeds

> Promoted via `/oversight` 2026-05-14 from PHASE_CANDIDATES #01
> (score 5.5; signals: spec drift on `spec.md:281` "RSS +
> newsletter", seed S4 trigger reached at 13 shows + 12 themes +
> 8+ canons). Queued behind phase 26 (season-backfill drain) per
> user direction; phase 26 is now `[x]`, so this is the next
> shipping-queue phase. Brief drafted on-demand by `/ship-a-phase`
> when the loop picked it up (2026-05-17).
>
> Newsletter is explicitly **out of scope** — see Follow-ups. This
> phase ships the read-only RSS surface only; no Resend, no
> subscribe form, no `POST /api/webhooks/resend` (already deferred
> in the URL contract).

## Outcome

tiered.tv publishes a global RSS 2.0 feed at `/feed.xml` and a
per-show feed at `/feed/<show>.xml`. A reader can subscribe in any
feed reader and get new season pages + canon revisions + themed
lists as they ship. Feed-discovery `<link rel="alternate">` tags
make the feeds auto-discoverable from the relevant page heads, and
the feeds appear in the sitemap.

## Routes / API endpoints

New surfaces (the URL contract in `plan/bearings.md` is *added
to*, not changed — "Add new ones via new phases"):

```
GET /feed.xml             global RSS 2.0 — latest items across the site
GET /feed/<show>.xml      per-show RSS 2.0 — that show's seasons + canon
```

- `src/app/feed.xml/route.ts` — App Router route handler (folder
  name is the literal `feed.xml`; `route.ts` GET returns the
  serialized XML with `content-type: application/rss+xml`).
- `src/app/feed/[slug]/route.ts` — dynamic handler. `slug`
  arrives as `<show>.xml`; strip the `.xml` suffix, resolve the
  show via the content loader. Unknown show, or a `slug` not
  ending in `.xml`, → `404` (plain text). This single-segment
  dynamic route is the only way to serve a `.xml`-suffixed
  dynamic path in the App Router (a folder cannot mix `[show]`
  and a literal `.xml`).

Both are `export const dynamic = 'force-static'` + `revalidate`
so they bake at build time and refresh on the standard ISR
window — feeds are derived purely from `content/`, no request
input.

## Content / data reads

| helper | call | use |
|---|---|---|
| `getAllShows()` | `@/content` | enumerate shows for global + per-show |
| `getAllSeasons(slug)` | `@/content` | season feed items |
| `getCanon(slug)` | `@/content` | canon-revision feed item (when `last_revised` present) |
| `getAllThemes()` | `@/content` | themed-list feed items (global only) |

No Supabase. No network. Feeds are a pure projection of the
content layer, exactly like `sitemap.ts` / `routes.ts`.

## Components / handlers

New pure helpers under `src/lib/feed/` (no React — this is a
serializer):

- `src/lib/feed/items.ts` — `buildGlobalFeedItems()` +
  `buildShowFeedItems(showSlug)`. Returns `FeedItem[]` sorted by
  derived publish date desc, capped at `FEED_LIMIT = 50`.
- `src/lib/feed/rss.ts` — `renderRss(channel, items)` →
  RSS 2.0 XML string. `escapeXml()` for text nodes; RFC-822
  `pubDate`/`lastBuildDate`; `<atom:self>` link; `<guid
  isPermaLink="true">` = the canonical URL.
- `src/lib/feed/dates.ts` — `itemDate()` pure helper that derives
  a deterministic timestamp per item (see Decisions §1).
- `src/lib/feed/__tests__/` — colocated unit tests for items,
  rss, dates.

Reused: `canonicalUrl()` (`@/lib/seo`), the content loaders.

## Cross-links

- **In (verify):** none required to reach the feed (it is a
  machine surface). Auto-discovery is the human path.
- **Out (ship):** `<link rel="alternate" type="application/rss+xml">`
  in the document head — global feed site-wide (root layout
  metadata), per-show feed additionally on `/shows/[show]` and
  `/shows/[show]/season/[slug]`.
- **Retro-fit:** extend `buildMetadata()` with an optional
  `feeds` arg → `alternates.types['application/rss+xml']`. Root
  layout metadata gains the global feed alternate. Scoped: no
  page restructure.

## SEO / metadata / output schema

- RSS 2.0. `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`
  → one `<channel>` → `title` / `link` / `description` /
  `language` (`en`) / `lastBuildDate` / `<atom:link rel="self">`
  → `<item>`s (`title`, `link`, `guid isPermaLink="true"`,
  `pubDate`, `description`).
- Feeds added to `app/sitemap.ts` as `<url>` entries (the phase
  row asks for sitemap entries). The e2e sitemap-count test is
  updated in lockstep against a new `feed-urls` fixture.
- `content-type: application/rss+xml; charset=utf-8`.

## Hero / body / sub-section composition

N/A — non-visual machine surface. No HTML page, no chrome, no
H1. (This is why feeds do NOT enter `canonical-urls.ts` /
`page-reads.ts` — those drive the HTML smoke walker, which
asserts H1 / no-console / mobile reflow. Feeds are a non-HTML
surface like `sitemap.xml`, `robots.txt`, `opengraph-image` —
none of which are in `canonical-urls.ts` either. They get a
dedicated `apps/e2e/tests/feeds.spec.ts` per agents.md §5a "new
page family → dedicated spec".)

## Empty / loading / error states

- **No items** (theoretically impossible post-phase-26, but
  handled): a valid empty `<channel>` with no `<item>`s. Never a
  500.
- **Unknown show** on `/feed/<x>.xml`: `404` plain text
  `"feed not found"`.
- **Slug without `.xml`** (`/feed/survivor`): `404` — the
  contract is the `.xml` form only.

## Decisions made upfront — DO NOT ASK

1. **Publish-date signal = frontmatter, not mtime.** The phase
   row says "sorted by mtime or a `published` frontmatter field".
   There is no `published` field, and **file mtime is the git
   checkout time in CI** (every build = "now"), so mtime yields a
   non-deterministic, useless ordering. Decision: derive a
   stable per-item date from existing frontmatter, newest first:
   - theme → `last_revised` (required ISO).
   - canon revision → `canon.last_revised` (item emitted only
     when present; pre-31b canons without it contribute no
     canon-revision item — their seasons still do).
   - season → `premiere_date` ?? `${aired_year}-01-01` ??
     `${show.est_year}-01-01` (always resolvable; show always
     has `est_year`).
   No schema change — `published` is explicitly *not* added (the
   show contract is frozen at twelve fields per `CLAUDE.md`;
   adding a feed-only field is rejected, consistent with the
   "reject graphical/extra fields" posture).
2. **Item set.** Global feed = every season (titled
   `<Show> — <Season title>`) + every theme + every canon
   revision, merged, date-desc, capped 50. Per-show feed = that
   show's seasons + its canon revision, capped 50. Themes are
   cross-show so they live in the global feed only.
3. **guid = canonical URL, `isPermaLink="true"`.** Stable,
   dereferenceable, no synthetic id store needed. A canon
   revision's guid is the show page URL with a `#canon` fragment
   so it is distinct from the show's other items.
4. **Caps + sort.** `FEED_LIMIT = 50`. Sort by derived date
   desc; tiebreak by guid asc for total determinism (CI feeds
   must be byte-stable across builds given identical content).
5. **`force-static` + ISR.** Feeds are pure content projections;
   no per-request input. Bake at build, refresh on the standard
   revalidate window. Matches `sitemap.ts`.
6. **Sitemap inclusion.** Honor the phase row literally: feeds
   are added as sitemap `<url>` entries. Kept consistent by
   updating the e2e count test against a new `feed-urls.ts`
   fixture that derives feed URLs from the content dir (same
   pattern as `canonical-urls.ts`; no `src/` import).
7. **Description text.** Plain-text, XML-escaped (no CDATA, no
   HTML body) — the season blurb / theme description / canon
   editor line, spoiler-safe by construction (already P0-clean
   content). One sentence; readers render it as the item summary.

## Mobile reflow / responsive / paginate / output limits

Non-visual; no reflow. Output bounded by `FEED_LIMIT = 50`
items. Deterministic byte output for identical content.

## Pages × tests matrix

| surface | unit | e2e |
|---|---|---|
| `src/lib/feed/dates.ts` | `__tests__/dates.test.ts` — premiere/aired/est fallbacks, bad ISO | — |
| `src/lib/feed/rss.ts` | `__tests__/rss.test.ts` — escaping, RFC-822, channel/item shape, atom:self | — |
| `src/lib/feed/items.ts` | `__tests__/items.test.ts` — global vs per-show set, sort, cap, canon-when-revised | — |
| `/feed.xml` | — | `feeds.spec.ts` — 200 + content-type + `<rss><channel><item>` + canonical self link |
| `/feed/<show>.xml` | — | `feeds.spec.ts` — 200 for a real show; 404 for unknown + for non-`.xml` |
| sitemap | — | `seo.spec.ts` count test updated to include `feedUrls.length` |

## Verify gate

`pnpm verify` (cloud: the three foreground legs). All hard.

## Commit body template

```
feat: RSS feeds — phase 32

- /feed.xml global RSS 2.0 (seasons + themes + canon revisions, date-desc, cap 50)
- /feed/<show>.xml per-show RSS 2.0 (seasons + canon revision)
- src/lib/feed/{dates,items,rss}.ts pure serializer + colocated tests
- feed-discovery <link rel=alternate> site-wide + per-show; sitemap entries
- apps/e2e/tests/feeds.spec.ts + feed-urls fixture; sitemap-count test updated

Decisions:
- publish date from frontmatter (mtime is CI-checkout time, useless); no schema field added
- guid = canonical URL isPermaLink=true; canon revision uses #canon fragment
- feeds are a non-HTML surface → dedicated spec, NOT canonical-urls/page-reads

Closes #<phase-issue>
```

## DoD

- `/feed.xml` + `/feed/<show>.xml` serve valid RSS 2.0,
  `application/rss+xml`, deterministic for fixed content.
- Auto-discovery link present site-wide (global) + per-show.
- Sitemap includes the feeds; e2e count test green.
- Unit + e2e green; `pnpm verify` green; deploy green.
- `01_build_plan.md` Phase 32 row flipped to `[x]` + hash.

## Follow-ups (out of scope)

- **Newsletter** (`spec.md:281` "RSS + newsletter"): Resend
  integration, subscribe form, `POST /api/webhooks/resend`.
  Separate future phase — needs a paid-tier decision + the
  deferred webhook contract.
- A human-readable `/feed` landing page listing available feeds.
- WebSub / PubSubHubbub push.
