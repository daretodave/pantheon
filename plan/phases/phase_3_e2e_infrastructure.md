# Phase 3 — URL contract + hermetic e2e infrastructure

> **Substrate this phase ships once and every later phase
> reuses.** The harness here is the load-bearing piece for the
> verify gate. After this phase ships, every new URL or page
> family pays the "contribute to canonical-urls + page-reads"
> tax automatically — and the smoke walker keeps regressions
> from sliding past.

## Goal

By the end of this phase:
- Every URL in `plan/bearings.md` "URL contract" returns 200
  with at minimum a stub page (real content lands in later
  phases).
- `apps/e2e/src/fixtures/canonical-urls.ts` enumerates every
  URL programmatically from the content loaders (so adding a
  show or theme auto-extends e2e coverage).
- `apps/e2e/src/fixtures/page-reads.ts` declares per-URL-family
  assertions (H1 present, expected element(s), no console
  errors, no horizontal scroll at 375px).
- A smoke walker spec walks every canonical URL and applies
  the relevant `page-reads` rules.
- A mobile spec template runs the same walk at 375px viewport.
- `scripts/mint-e2e-cookie.mjs` mints an Auth0 session cookie
  via password-realm grant for the e2e test user
  (`E2E_USER_EMAIL` / `E2E_USER_PASSWORD`) and caches it at
  `.cache/e2e-cookie.json`. Same script upserts
  `CRITIQUE_SESSION_COOKIE=__session=<value>` into `.env`.
- `apps/e2e/src/auth.ts` reads the cache and builds Playwright
  storageState for authed specs.
- One example authed spec exists, demonstrating the pattern.
- `pnpm verify`'s e2e leg runs against `next start -p 4173`
  hermetically, with `DISABLE_ANALYTICS=1` set.
- A local Supabase instance (via `supabase start`) is the
  e2e DB; migrations apply before the test run.
- The `/critique` skill (when invoked in phase 19) is wired
  to make TWO passes: anonymous (no cookie), then authenticated
  (with `CRITIQUE_SESSION_COOKIE`).

## Outputs

```
src/lib/seo.ts                              # buildMetadata, buildJsonLd, canonicalUrl, siteConfig
src/lib/seo.test.ts
src/app/sitemap.ts                          # enumerates URL contract from canonical-urls fixture
src/app/robots.ts
src/app/opengraph-image.tsx                 # site-default OG (real per-route OG lands phase 17)

# Stubs for every route in the URL contract (real implementations come later)
src/app/shows/page.tsx                      # /shows index — stub
src/app/shows/[show]/page.tsx               # show home — stub
src/app/shows/[show]/canon/page.tsx         # canon — stub
src/app/shows/[show]/community/page.tsx     # community — stub
src/app/shows/[show]/season/[n]/page.tsx    # season — stub
src/app/themes/page.tsx                     # /themes index — stub
src/app/themes/[theme]/page.tsx             # theme — stub
src/app/about/page.tsx                      # about — stub
src/app/sign-in/page.tsx                    # sign-in — stub
src/app/u/[handle]/page.tsx                 # user profile — stub
src/app/mod/page.tsx                        # mod queue — stub (phase 13 fills it)

# Hermetic e2e harness
apps/e2e/src/fixtures/
├── canonical-urls.ts                       # programmatic URL list
└── page-reads.ts                           # per-URL-family assertions
apps/e2e/src/auth.ts                        # storageState loader
apps/e2e/tests/
├── smoke.spec.ts                           # walks every URL, applies page-reads, desktop
├── smoke-mobile.spec.ts                    # same, 375px viewport
├── seo.spec.ts                             # sitemap + robots + opengraph-image walks
└── authed-example.spec.ts                  # demonstrates auth.ts use

# Mint script
scripts/mint-e2e-cookie.mjs                 # password-realm grant → JWE cookie → cache + .env upsert
scripts/__tests__/mint-e2e-cookie.test.mjs  # vitest covers cache freshness, env upsert, error paths

# Local Supabase wiring
supabase/config.toml                        # supabase CLI config
supabase/seed.sql                           # minimal seed (one user, one session)
playwright.config.ts                        # webServer chains supabase start + next start
```

## Detailed steps

### 1. Build the URL contract scaffolding

For every route in `plan/bearings.md` "URL contract", create a
stub file that returns 200 with a minimal page. Use `notFound()`
for dynamic routes when the slug isn't in content (e.g.,
`/shows/[show]` when `show !== 'survivor'` returns 404; only
`survivor` resolves at this phase since phase 2 seeded it).

Each stub:
- Has a `<h1>` matching the route's name.
- Includes `<Wordmark />` from chrome.
- Sets metadata via `buildMetadata({ title, description })`.

### 2. SEO primitives in `src/lib/seo.ts`

Pure functions, fully unit-tested:
- `siteConfig` — baseURL, brand name, default OG image path,
  ISO 639-1 locale.
- `canonicalUrl(path: string): string` — normalizes a path to
  a fully-qualified URL using `siteConfig.baseUrl`. Strips
  trailing slashes (except root). Test for: paths with
  trailing slash, paths with query, paths with fragments.
- `buildMetadata({ title, description, path, image? })` —
  returns Next.js `Metadata` object with title, description,
  openGraph, twitter card, alternates.canonical.
- `buildJsonLd(...)` — schema.org JSON-LD for ItemList,
  CollectionPage, Article, BreadcrumbList. One overload per
  schema type.

### 3. `apps/e2e/src/fixtures/canonical-urls.ts`

Imports the content loaders from `src/content/loaders` (which
phase 2 shipped). For every route family, expand to concrete
URLs:

```ts
import { getAllShows } from '@/content/loaders'
import { getAllThemes } from '@/content/loaders'

export type CanonicalUrl = {
  pattern: string             // e.g. '/shows/[show]'
  path: string                // e.g. '/shows/survivor'
  slug?: string
  show?: string
  season?: number
  theme?: string
}

export const canonicalUrls: CanonicalUrl[] = (() => {
  const out: CanonicalUrl[] = [
    { pattern: '/',           path: '/' },
    { pattern: '/shows',      path: '/shows' },
    { pattern: '/themes',     path: '/themes' },
    { pattern: '/about',      path: '/about' },
    { pattern: '/sign-in',    path: '/sign-in' },
    { pattern: '/mod',        path: '/mod' },
  ]
  for (const show of getAllShows()) {
    out.push({ pattern: '/shows/[show]',           path: `/shows/${show.slug}`, show: show.slug })
    out.push({ pattern: '/shows/[show]/canon',     path: `/shows/${show.slug}/canon`, show: show.slug })
    out.push({ pattern: '/shows/[show]/community', path: `/shows/${show.slug}/community`, show: show.slug })
    for (const season of show.seasons) {
      out.push({
        pattern: '/shows/[show]/season/[n]',
        path: `/shows/${show.slug}/season/${season.number}`,
        show: show.slug,
        season: season.number,
      })
    }
  }
  for (const theme of getAllThemes()) {
    out.push({ pattern: '/themes/[theme]', path: `/themes/${theme.slug}`, theme: theme.slug })
  }
  // /u/[handle] — only one e2e user; populated from .env at runtime
  if (process.env['E2E_USER_HANDLE']) {
    out.push({ pattern: '/u/[handle]', path: `/u/${process.env['E2E_USER_HANDLE']}` })
  }
  return out
})()
```

`sitemap.ts` consumes the same fixture. One source of truth.

### 4. `apps/e2e/src/fixtures/page-reads.ts`

Typed map keyed by URL pattern declaring assertions:

```ts
export type PageReadAssertion = {
  expectStatus?: number          // default 200
  expectH1Pattern?: RegExp       // assert page H1 matches
  expectVisible?: string[]       // CSS selectors that must be visible
  expectNotVisible?: string[]    // selectors that must be absent
  expectNoConsoleErrors?: boolean // default true
  expectNoHorizontalScroll?: boolean // default true at mobile spec
  expectMetaDescription?: RegExp
  expectJsonLdType?: string      // assert at least one JSON-LD with @type matches
}

export const pageReads: Record<string, PageReadAssertion> = {
  '/':                              { expectH1Pattern: /Pantheon/, expectVisible: ['[data-testid=hero]'] },
  '/shows':                         { expectH1Pattern: /shows/i, expectJsonLdType: 'CollectionPage' },
  '/shows/[show]':                  { expectVisible: ['[data-testid=facade]', '[data-testid=season-grid]'], expectJsonLdType: 'CollectionPage' },
  '/shows/[show]/canon':            { expectH1Pattern: /Editor['']s Canon/i, expectJsonLdType: 'ItemList' },
  '/shows/[show]/community':        { expectH1Pattern: /Community Rank/i, expectJsonLdType: 'ItemList' },
  '/shows/[show]/season/[n]':       { expectVisible: ['[data-testid=vote-pair]'], expectJsonLdType: 'Article' },
  '/themes':                        { expectH1Pattern: /themes/i },
  '/themes/[theme]':                { expectJsonLdType: 'ItemList' },
  '/about':                         { expectH1Pattern: /about/i },
  '/sign-in':                       { expectVisible: ['form[action*=auth]'] },
  '/u/[handle]':                    { expectH1Pattern: /@/ },
  '/mod':                           {}, // requires authed spec; smoke pass expects 200 or auth-redirect
}
```

### 5. Smoke walker

`apps/e2e/tests/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'
import { pageReads } from '../src/fixtures/page-reads'

for (const url of canonicalUrls) {
  test(`smoke: ${url.path}`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', m => m.type() === 'error' && errors.push(m.text()))

    const response = await page.goto(url.path)
    const reads = pageReads[url.pattern] ?? {}
    expect(response?.status()).toBe(reads.expectStatus ?? 200)

    if (reads.expectH1Pattern) {
      await expect(page.locator('h1')).toContainText(reads.expectH1Pattern)
    }
    for (const sel of reads.expectVisible ?? []) {
      await expect(page.locator(sel)).toBeVisible()
    }
    for (const sel of reads.expectNotVisible ?? []) {
      await expect(page.locator(sel)).toHaveCount(0)
    }
    if (reads.expectJsonLdType) {
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
      const types = jsonLd.flatMap(s => {
        try { return [JSON.parse(s)['@type']] } catch { return [] }
      })
      expect(types).toContain(reads.expectJsonLdType)
    }

    if (reads.expectNoConsoleErrors !== false) {
      expect(errors).toEqual([])
    }
  })
}
```

`smoke-mobile.spec.ts` is a copy with `viewport: { width: 375, height: 812 }` and an extra `expectNoHorizontalScroll` assertion checking `document.documentElement.scrollWidth <= 375`.

### 6. `scripts/mint-e2e-cookie.mjs`

Port the fibered pattern verbatim. One adaptation: replace
`fibered` references in the docstring with `pantheon`. Imports
`jose` and `@panva/hkdf` (already in package.json from phase 1).

Key entry points:
- `passwordGrant({ domain, clientId, clientSecret, audience, username, password })` — POSTs to `/oauth/token` with `grant_type: http://auth0.com/oauth/grant-type/password-realm`, `realm: Username-Password-Authentication`. Returns OIDC tokens.
- `decodeJwtPayload(jwt)` — base64url decode of the id_token claims.
- `buildSessionPayload({ tokens, nowSec })` — shapes claims into the `@auth0/nextjs-auth0` v4 SDK's `SessionData`.
- `encryptSessionCookie(session, secret, expiresAtSec)` — HKDF SHA-256 → 32 bytes → JWE A256GCM dir alg, info `"JWE CEK"`. The encrypted JWT is the cookie value.
- `mint()` — top-level: read cache → if fresh, return → else password-grant → encrypt → write cache → return.
- CLI entry point: also calls `upsertEnvLine(.env, 'CRITIQUE_SESSION_COOKIE', '__session=<value>')`.

Vitest covers:
- `isFresh()` boundary cases (>5min, ≤5min, malformed)
- `upsertEnvLine()` insert vs update, idempotency
- `passwordGrant()` happy path + 403 (Password grant disabled)
  + 401 (bad creds) — uses a `fetchFn` injection for stubs
- `encryptSessionCookie()` round-trip with `jose.jwtDecrypt`

### 7. `apps/e2e/src/auth.ts`

Reads the cache file. Returns Playwright `StorageState` shape
or `null` if the cache is missing/expired. Authed specs gate on
`test.beforeAll` with `test.skip(!state, 'run mint-e2e-cookie first')`.

### 8. Wire local Supabase into the e2e webServer chain

`playwright.config.ts` `webServer` becomes a chain:
1. `supabase start --workdir .` → spins up local Postgres + GoTrue + REST on port :54321.
2. `supabase db reset --no-seed` → applies all migrations + `seed.sql`. (Phase 11 lands the real migrations.)
3. `node scripts/mint-e2e-cookie.mjs` → ensures cookie cache fresh before tests.
4. `next start -p 4173` (with `DISABLE_ANALYTICS=1` and the local Supabase URL pointed via `NEXT_PUBLIC_SUPABASE_URL`).

For ticks where `supabase start` is unavailable (no Docker on
the runner), fall back to skipping authed specs and surfacing
a `[needs-supabase-local]` warning. Cloud workflow on GH
Actions uses `supabase/setup-cli` action + the official
service container.

### 9. Example authed spec

`apps/e2e/tests/authed-example.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { loadAuthedStorageState } from '../src/auth'

test.use({ storageState: async ({}, use) => {
  const state = await loadAuthedStorageState()
  test.skip(!state, 'authed cookie cache empty — run mint-e2e-cookie first')
  await use(state!)
}})

test('signed-in viewer sees their handle in chrome', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('chrome-handle')).toContainText('@e2e')
})
```

### 10. Critique skill wiring (forward-declared, lands phase 19)

Add a note to `skills/critique.md` (lands phase 19) for the
two-pass walk:

1. Pass 1 — anonymous: `WebFetch` with no Cookie header.
2. Pass 2 — authenticated: `WebFetch` with
   `Cookie: $CRITIQUE_SESSION_COOKIE` (the env var the mint
   script auto-manages).

Phase 19 ships the actual skill text and the `reader` sub-agent
update. Phase 3 just records the contract.

### 11. Verify + commit + push

```pwsh
pnpm verify
```

Expected: all smoke specs green (every URL stub returns 200 +
expected H1 + no console errors + no horizontal scroll at
375px). Authed spec skipped if cookie cache empty (you'll
need to mint once locally first: `node scripts/mint-e2e-cookie.mjs`).

Commit + push. Phase 3 ticked.

## Decisions made upfront — DO NOT ASK

- **Supabase locally via `supabase start`** (not via Docker
  Compose). Requires the Supabase CLI installed.
- **Cookie cache lives at `.cache/e2e-cookie.json`** —
  gitignored.
- **`CRITIQUE_SESSION_COOKIE` upserted into `.env`** so the
  reader sub-agent can read it via `process.env`.
- **Mint cache freshness window: 5 minutes pre-expiry.**
- **Smoke spec runs in a single chromium project** at
  desktop viewport. Mobile is a separate file (project) at
  375px.
- **JSON-LD assertions are "at least one matches"** not
  "first must match" — pages can carry multiple types.
- **404 on dynamic-route slugs not yet seeded:** `notFound()`
  in the route handler. Smoke walker only walks slugs that
  exist (canonical-urls fixture handles this by enumerating
  from loaders).
- **The mod queue page (`/mod`)** at smoke time returns 200
  with an "auth required" stub. Authed spec for the gate
  lands phase 13.

## Failure modes — when to stop

1. `supabase start` fails → Docker not installed, Docker daemon
   not running, or port :54321 in use. Stop and report;
   require Docker.
2. `mint-e2e-cookie.mjs` returns 403 from Auth0 → Password
   grant not enabled. Re-do `setup/04_auth0.md` Section B
   Advanced Settings.
3. `mint-e2e-cookie.mjs` returns 401 → wrong password.
   Update `E2E_USER_PASSWORD` in `.env` and Auth0 user.
4. Smoke walker fails because a route returns 500 → root-cause
   the route's stub.
5. JSON-LD assertion fails → stub doesn't ship the expected
   schema; fix the stub.
6. `pnpm verify` fails 3+ times on the same root cause →
   stop, file a GitHub issue.
