# Phase 19b — Chrome + brand mark + bounded layout

> **Context.** With 19a's scorched earth done, the system has a
> `<Bullet>` primitive and a shared brand mark at
> `public/sigil.svg`. This phase rebuilds the visible chrome —
> header, footer, page-width contract — and regenerates the
> favicon set from the new brand mark. Spec sources:
> `design/Pantheon · Brand.html` and the `TopNav` / `Footer`
> components in `design/compositions/screens.jsx`.

## 1. The brand mark, inline

Create `src/components/chrome/BrandMark.tsx`:

```tsx
type BrandMarkProps = {
  size?: number;       // 16 | 22 | 28 | 48 | 96 | 240 only
  className?: string;
};

const ALLOWED_SIZES = [16, 22, 28, 48, 96, 240] as const;

export function BrandMark({ size = 22, className }: BrandMarkProps) {
  // dev-time guard; pruned in prod
  if (process.env.NODE_ENV !== 'production' && !ALLOWED_SIZES.includes(size as any)) {
    console.warn(`<BrandMark> size must be one of ${ALLOWED_SIZES.join(', ')}; got ${size}`);
  }
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      data-testid="brand-mark"
    >
      <path d="M2 11 L14 3 L26 11 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5"  y1="14" x2="5"  y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="14" y1="14" x2="14" y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="23" y1="14" x2="23" y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2"  y1="26" x2="26" y2="26" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
```

Unit test `src/components/chrome/__tests__/BrandMark.test.tsx`:
- renders at default 22px
- respects each of the six allowed sizes
- always sets `aria-hidden="true"`
- uses `currentColor` for stroke (assert via attribute)
- viewBox is exactly `0 0 28 28`

## 2. The header — `src/components/chrome/Header.tsx`

Spec: `design/Pantheon · Brand.html` §04 + `screens.jsx`
`TopNav`. Structure:

```
[BrandMark] [Pantheon (serif 18px white)]   [Shows]  [Lists]  [About]   [⌕ Search]  [Sign in]
```

Tokens:
- Padding: `18px 32px` desktop / `14px 16px` mobile
- Background (default, non-show pages): `color-mix(in oklab, var(--paper-0) 92%, transparent)`; `border-bottom: 1px solid var(--line-soft)`
- Background (tinted, on show / season pages — accept a
  `tinted` boolean prop): `color-mix(in oklab, var(--show-paper) 90%, var(--paper-0))`; border `color-mix(in oklab, var(--show-ink) 14%, transparent)`; color `var(--show-ink)`
- Brand text: Source Serif 4, weight 600, 18px, color `inherit`
  (white on dark default, show-ink on tinted) — gap 10px
  between mark and word
- Nav links: Inter 14px, opacity 0.78, hover opacity 1, gap
  28px between links
- Search: JetBrains Mono 12px, letter-spacing 0.06em, opacity
  0.7. Renders the `⌕` glyph + the word "Search". For 19b it
  is a `<Link href="/search">`. (Inline-takeover search is a
  deferred candidate — see `PHASE_CANDIDATES.md` S7.)
- Sign-in pill: Inter 500 12px, padding `9px 16px`, radius
  999px; background `var(--ink-0)` on default, `var(--show-ink)`
  on tinted; color is the opposite paper

On mobile (max-width 720px):
- Hide `.topnav-links` and `.topnav-search`. Brand + Sign in
  only.
- Sign in stays visible.

Props:
```ts
type HeaderProps = { tinted?: boolean };
```

Behavior:
- Sticky top — `position: sticky; top: 0; z-index: 30;`
- `backdrop-filter: blur(8px)` (skip on `prefers-reduced-motion`
  by reading a token + a `@media` rule; the design does not
  require a per-component opt-out beyond the global one)

Unit test `src/components/chrome/__tests__/Header.test.tsx`:
- renders BrandMark + "Pantheon" wordmark
- shows the three nav links on desktop
- hides nav links + search at viewport 360px (use a mocked
  matchMedia or assert by CSS class presence)
- when `tinted={true}`, root element carries class `tinted`
- "Search" link points to `/search`
- "Sign in" link points to `/sign-in`

## 3. The footer — `src/components/chrome/Footer.tsx`

Spec: `design/Pantheon · Brand.html` §05.

Structure (desktop, 3 columns + meta strip):

```
[BrandMark] Pantheon                Pantheons              Pantheon
the seasons, ranked. no spoilers.   ● Survivor             About the canon
                                    ● Top Chef             How voting works
                                    ● Drag Race            Spoilers policy
                                    All shows →            Become an editor

© 2026 Pantheon · est. as a quiet rebellion         v<package.version> · canon last revised <YYYY-MM>     [theme toggle]
against ranked lists that ruin the show
```

Important contract from the user (2026-05-13):
- **Keep the dark/light theme toggle** in the footer. The May
  2026 redesign removes a lot of footer chrome, but the theme
  toggle stays — it's a good signal-to-noise win and lives in
  the meta strip.

Tokens:
- Background (default, non-show pages): `var(--paper-0)`,
  `border-top: 1px solid var(--line-soft)`
- Background (tinted, on show / season pages): tinted to show
  palette using the same `color-mix(...)` recipe as the header
- Grid: 3 columns, 32px gutter, 48px x-padding
  (`padding: 36px 32px 32px`); single column on mobile
- Brand row: BrandMark (22px) + serif "Pantheon" 18px weight
  600 (white on default, show-ink on tinted), with the promise
  underneath: italic Source Serif 4, 14px, color
  `var(--ink-2)` on default — `the seasons, ranked. <em>no spoilers.</em>` (the em is gold `var(--primary)` on
  default; `var(--show-primary)` on tinted)
- Column headers: JetBrains Mono 500 11px, letter-spacing
  0.14em, uppercase, color `var(--ink-3)` (or show-ink @55%
  on tinted)
- Column links: Inter 13px, color `var(--ink-1)`, hover
  `var(--ink-0)`
- Bullet next to show names: 8px circle in that show's
  primary, vertical-align 1px (use `<Bullet>` primitive)
- Meta strip: JetBrains Mono 400 11px, color `var(--ink-3)`,
  letter-spacing 0.04em. Spans full width with
  `border-top: 1px solid var(--line-soft)`. Theme toggle sits
  to the right.
- **Drop "an experiment"** — the previous footer line
  `© {year} — pantheon. an experiment.` is replaced with the
  longer copy above (`est. as a quiet rebellion against ranked
  lists that ruin the show`). Use the literal copy from
  `design/Pantheon · Brand.html` line 443.

Props:
```ts
type FooterProps = { tinted?: boolean };
```

Sub-components (each in its own file under
`src/components/chrome/footer/`):
- `FooterBrand.tsx` — mark + wordmark + promise
- `FooterPantheonsCol.tsx` — server component; reads all shows
  via the content loader and renders bullet + name + link.
  Shows the first 3 + an "All shows →" link.
- `FooterAboutCol.tsx` — static links: About / How voting
  works / Spoilers policy / Become an editor (the last is a
  `/about#editors` anchor placeholder)
- `FooterMeta.tsx` — copyright + version + theme toggle. Reads
  `package.json` `version` at build time via a small helper.

Unit tests under `__tests__/`:
- Footer renders BrandMark + wordmark
- Footer renders the italic promise with "no spoilers" in the
  primary color
- Footer renders three columns on desktop, stacks on mobile
- Footer does NOT render the string "an experiment"
- Footer renders the existing `<ThemeToggle>` (from phase 1)
- Tinted variant applies the show palette to text + border
- Pantheons column renders a `<Bullet>` for each linked show

## 4. The page-width contract

Add `src/components/chrome/Wrap.tsx`:

```tsx
export function Wrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`wrap${className ? ` ${className}` : ''}`}
      style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}
    >
      {children}
    </div>
  );
}
```

With a mobile rule via CSS:

```css
@media (max-width: 720px) { .wrap { padding: 0 20px; } }
```

Usage rules:

- **Bounded routes** (use `<Wrap>` at the page-level shell):
  `/`, `/shows`, `/themes`, `/themes/[theme]`, `/search`,
  `/about`, `/terms`, `/privacy`, `/sign-in`, `/u/[handle]`,
  `/mod`.
- **Full-bleed routes** (no `<Wrap>` — page tints to show
  paper edge-to-edge): `/shows/[show]`, `/shows/[show]/canon`,
  `/shows/[show]/community`, `/shows/[show]/season/[n]`.

The header and footer chrome is **always rendered outside the
Wrap** because they have their own internal padding and tint
to the page color. On full-bleed show routes, they receive
`tinted={true}` and the body color comes from the
`[data-show=<slug>]` wrapper that the route layout supplies.

Unit test `src/components/chrome/__tests__/Wrap.test.tsx`:
- max-width is 1240px
- mobile padding rule applies (test via computed CSS variable
  or class membership)

## 5. Update `src/app/layout.tsx`

Root layout no longer wraps anything in `<Wrap>`. Page-level
components opt in. Layout structure:

```tsx
<html><body>
  <ThemeBootstrap />
  <a className="skip-link" href="#main">Skip to main content</a>
  {/* Header is RSC; reads no per-show context here. Per-show
      tinting on show routes is delegated to the route's
      segment layout. */}
  <Header />
  <main id="main">{children}</main>
  <Footer />
</body></html>
```

For show + season routes, add a segment layout at
`src/app/shows/[show]/layout.tsx`:

```tsx
import { getShow } from '@/content/loaders';
import { Header } from '@/components/chrome/Header';
import { Footer } from '@/components/chrome/Footer';

export default async function ShowSegmentLayout({ params, children }) {
  const show = await getShow(params.show);
  return (
    <div
      data-show={show.slug}
      style={{
        '--show-paper':   show.palette.paper,
        '--show-ink':     show.palette.ink,
        '--show-primary': show.palette.primary,
      } as React.CSSProperties}
    >
      <Header tinted />
      <main id="main">{children}</main>
      <Footer tinted />
    </div>
  );
}
```

This requires moving the global `<Header>` + `<Footer>` out of
the root `<body>` for the show segment. Use Next.js route
groups (`(default)/layout.tsx` + the segment layout) if needed
to avoid double-rendering — the simplest approach is to render
Header + Footer at the route level, not in the root layout.

If route groups are cleaner: create `src/app/(default)/layout.tsx`
that renders Header + Footer + `<Wrap>` for bounded routes, and
leave the root `layout.tsx` with only the html / body shell.

Decide in the moment based on what touches fewest files.
Document the call in the commit body.

## 6. Regenerate the favicon set via `brander`

Brief shape:

```json
{
  "kind": "favicon",
  "target": "public/",
  "source": "public/sigil.svg",
  "tokens": "design/tokens.json",
  "fonts": []
}
```

Outputs: `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`,
`icon-{16,32,48,64,96,128,180,192,256,512,1024}.png`. One
provenance JSON `public/favicon.json` covers the set.

Also regenerate the **root** OG image template via the new
brander spec:

```json
{
  "kind": "og",
  "target": "src/app/opengraph-image.tsx",
  "source": "public/sigil.svg",
  "title": "Pantheon",
  "subtitle": "the seasons, ranked. no spoilers.",
  "tokens": "design/tokens.json",
  "fonts": ["Source Serif 4", "Inter"]
}
```

### OG card composition rules (binding for every route)

- **No per-show illustration.** Ever. No facades, no
  ornaments, no per-show glyphs. The May 2026 rejection
  applies to OG images too.
- The shared brand mark renders at 28px (or 22px on smaller
  routes) in the corner, picking up `currentColor` from the
  card's `color` token.
- The card composition is **clean text + clear color blocks**.
  On the root OG, paper is `var(--paper-0)`; on a show OG, the
  card paper is `show.palette.paper`; on a season OG, same
  show paper.
- Type does the work. Title in Source Serif 4 weight 500 at
  60–80px. Subtitle / promise in serif italic at 24px. Meta
  (rank, season number, "Pantheons / Survivor") in JetBrains
  Mono 14px uppercase.
- One `<Bullet>` accent allowed — same primary-color circle
  the product uses. No other graphic elements.
- The phase 17 OG infrastructure is preserved but the brander
  hand-off **never** receives a `kind: "facade"` or
  motif-bearing brief. If a calling skill is tempted to pass
  one, it stops and files an audit row.

Per-show + per-season OG templates are not added in 19b —
they ship in 19c (where the new show and season routes land).
This phase only re-bakes the root OG template against the new
composition rules.

## 7. e2e

Add `apps/e2e/tests/chrome.spec.ts`:

- For every canonical URL, assert:
  - exactly one `<header>` and one `<footer>` rendered
  - the header contains a `<BrandMark>` (data-testid)
  - the header contains the literal serif text "Pantheon"
  - the footer contains the literal serif text "Pantheon"
  - the footer **does not** contain the string "an experiment"
  - the footer contains the theme toggle
  - on show routes (`/shows/<slug>` + sub-routes), the header
    background color matches the show paper (read computed
    style or check `data-show` attr is present on a parent)
- For bounded routes, assert `<main>` is inside a `.wrap`
  container with max-width 1240px (measure bounding-box width
  at a 1600px viewport — it should be ≤ 1240 + 64px scrollbar
  slack)
- For full-bleed routes, assert `<main>` is NOT inside a
  `.wrap` container

Update `apps/e2e/src/fixtures/page-reads.ts` with the chrome
asserts.

## 8. Accessibility floor (no regressions)

- Skip-to-main link remains
- Reduced-motion: header `backdrop-filter` does not collapse;
  the design ships a single rule disabling all transforms but
  not the blur. Verify with the axe spec.
- Theme toggle keeps its `aria-label` from phase 1
- The bullet next to a footer link is decorative
  (`aria-hidden=true`); the show name is the linked label

## 9. Verify + commit + push

```
pnpm verify
git add -A
git commit -m "feat: phase 19b — chrome + brand mark + bounded layout"
git push origin main
pnpm deploy:check
```

Tick `[x]` for 19b with the commit hash.

## 10. Decisions log

Document in commit body:
- Route-group vs segment-layout choice (whichever you picked)
- Why we kept `public/sigil.svg` as the brand-mark source even
  though "sigil" is a charged word post-19a (consistency with
  existing href references; favicon set reads from it)
- Theme toggle is preserved (per user instruction
  2026-05-13)
