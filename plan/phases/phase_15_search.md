# Phase 15 — Search

> **The cold-search promise extended inward.** Pantheon's SEO
> story is "the seasons, ranked, no spoilers." That brings
> traffic in via Google. On-site search is the second hop —
> once a reader is on the site, can they find the show / season /
> theme they're thinking of in one keystroke?
>
> Phase 15 ships an in-memory search lib, the `/search` page,
> and a header affordance. Three representative-query e2e
> walks anchor the family.

## Goal

By the end of this phase:

- `src/lib/search.ts` exposes `search(query: string,
  opts?: { limit?: number })` returning `SearchHit[]`. A hit is
  one of `{ type: 'show'|'season'|'theme', ...metadata }`.
  Implementation: walk all loaded content via `getAllShows() +
  getAllSeasons() + getAllThemes()` at request time, build an
  inverted index, score each hit by token-match count weighted
  by field (title > tagline/description > blurb > body).
- `src/app/search/page.tsx` is a server component that:
  - Reads `?q=<query>` from URL params (force-dynamic so the
    response varies by query).
  - Renders the search input form pre-filled with the current
    query.
  - When `q` is empty: renders just the input + a "type to find
    a show, season, or theme" hint.
  - When `q` is non-empty: renders results grouped by type
    (shows / seasons / themes). Each result is a link to the
    canonical page with a short snippet showing the matched
    context.
- `src/components/chrome/Header.tsx` gains a Search link
  (text `Search`, links to `/search`). Replaces the
  placeholder comment.
- `apps/e2e/tests/search.spec.ts` covers:
  - Empty `/search` renders the input form, no results.
  - `?q=survivor` → at least one show hit + at least one
    season hit.
  - `?q=fiji` (matches survivor 41/45 location in season
    blurbs) → at least one season hit.
  - `?q=pillars` (matches the "load-bearing seasons" themed
    list title) → at least one theme hit.
  - Mobile 375px reflow.

## Outputs

```
src/lib/search.ts
src/lib/search.test.ts

src/app/search/page.tsx
src/components/search/SearchForm.tsx
src/components/search/SearchResults.tsx
src/components/search/__tests__/SearchResults.test.tsx

src/components/chrome/Header.tsx          # +Search link (scoped edit)

apps/e2e/tests/search.spec.ts
apps/e2e/src/fixtures/canonical-urls.ts   # +/search to the canonical list
apps/e2e/src/fixtures/page-reads.ts       # +/search read
```

## Decisions made upfront — DO NOT ASK

- **In-memory inverted index, NOT Supabase fulltext.** The
  build-plan row says "Supabase fulltext over content," but
  v1 has ~10 content documents and content is the canonical
  source of truth (Supabase has comments + votes — not
  editorial content). Maintaining a build-time push to
  Supabase + a sync invariant is operational machinery the
  payoff doesn't justify yet. The `search()` API contract is
  the abstraction boundary — swap in Supabase later if v2
  content scale demands it. Documented in the commit so the
  future-Supabase migration has a clear seam.
- **Server-side rendering with `?q=` URL param** — search is
  a deep-link surface (shareable, indexable). No client-side
  fetcher; the GET to `/search?q=foo` returns the rendered
  HTML directly. JS-progressively-enhanced search-as-you-type
  is a follow-up.
- **Field weights**: title=10, tagline/description=5, location/
  host=3, blurb=2, body=1. Hand-tuned for the cold-search
  shape; bias toward title matches over body matches.
- **Tokenizer**: lowercase, split on `\W+`, drop tokens of
  length 1, drop the bearings stop-word set `the / a / an /
  and / or / of / in / on / at / to / for / from / by / with`.
- **Scoring**: sum of (field_weight × match_count) across all
  query tokens. Ties broken by `type` ordering (show > season >
  theme) then by name.
- **Default limit is 20 per query** — enough to satisfy
  typical intent without paginating.
- **Snippet is the first occurrence of any query token in the
  matched field**, truncated to ±60 chars. If no field
  contains the literal token (just the inverted index hit),
  show the field value verbatim truncated to 120 chars.
- **No suggestion / autocomplete** in v1 — the cold-search
  page is the target, not an in-page search box. Header link
  routes the user to `/search` where they type.
- **Empty-query response**: render the form + a one-line hint.
  No "popular searches" or "recent searches" — neither has
  data + both add tracking complexity.
- **`/search` is indexable** (`noIndex: false`). The page name +
  description tell search engines what we offer. The query
  shape `?q=` is canonicalized via `<link rel="canonical">`
  pointing to `/search` (no query string) so query-tail URLs
  don't pollute the index.
- **Header `Search` link replaces the placeholder comment** —
  no broader chrome restructuring. The link sits in the
  `<nav aria-label="Primary">` block.

## Out of scope

- Search-as-you-type / typeahead.
- Search analytics ("what are people searching for").
- Search ranking ML / popularity weighting.
- Fuzzy matching / typo correction.
- Per-show search scoping (`?q=survivor cagayan`).
- Supabase-backed index migration.

## Mobile reflow / responsive

`/search` is a single-column layout (form on top, results
stacked). Mobile-safe by default. The new e2e spec asserts
375px reflow.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---|---|
| `src/lib/search.ts` | search.test.ts: tokenize, score, limit, type-grouping | covered via /search in e2e |
| `src/components/search/SearchResults.tsx` | empty + populated + grouped-by-type render paths | covered via /search in e2e |
| `/search` page | covered by e2e | 4 cases (empty / survivor / fiji / pillars) + mobile |

## Verify gate

`pnpm verify` — same composition. /search joins the
canonical-urls + page-reads fixtures, so smoke walker hits
it on every run.

## Commit body template

```
feat: search — phase 15

- src/lib/search.ts: in-memory inverted index over loaded content.
- /search page (force-dynamic, ?q= URL param).
- Header gains a Search link.
- search.spec.ts walks 3 representative queries + empty + mobile.

Decisions:
- In-memory, not Supabase, until content scale justifies the operational overhead.

Closes #<issue>
```

## DoD

- `pnpm verify` green (typecheck + unit + content:check +
  build + e2e).
- `/search` indexable, canonical points to `/search`.
- Header Search link works on every page in the canonical
  walker.
- search.spec.ts: 3 representative queries return ≥1 hit each.
- Vercel deploy ready on the pushed commit.
- Mirror issue closed.

## Follow-ups (out of scope)

- Search-as-you-type / autocomplete.
- Supabase fulltext migration once content count crosses a
  threshold worth indexing.
- Search analytics ("what are people not finding").
- Fuzzy matching.
- Per-show search scoping.
