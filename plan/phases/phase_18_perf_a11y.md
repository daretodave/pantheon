# Phase 18 — Performance + a11y polish

> **The hard-gate phase.** Every prior phase has shipped its own
> e2e tier. Phase 18 adds the cross-cutting hard gates that
> every future phase must pass: WCAG 2.1 AA critical/serious
> rules via axe-core, a 250 KB gzipped JS budget on `/`, and a
> raw-`<img>` discipline gate. Plus the small but load-bearing
> a11y primitive: a skip-to-main-content link.

## Goal

By the end of this phase:

- `@axe-core/playwright` is installed and wired via
  `apps/e2e/src/fixtures/a11y.ts` (helper that runs an
  AxeBuilder pass with WCAG 2.1 AA tags + filters to
  `critical` / `serious` only).
- `apps/e2e/tests/a11y.spec.ts` walks 10 canonical surfaces (7
  desktop + 3 mobile) and fails on any critical/serious
  violation. The exact set is the bearings critical-path: `/`,
  `/shows`, `/shows/[show]`, `/shows/[show]/canon`,
  `/shows/[show]/season/[n]`, `/themes`, `/about` (desktop);
  `/`, `/shows/[show]`, `/shows/[show]/season/[n]` (mobile at
  375px).
- `src/components/chrome/SkipToMain.tsx` renders a
  visually-hidden link that becomes visible on focus, jumps to
  `#main` (already set on layout's `<main>`). Mounted FIRST in
  `<body>` so keyboard users hit it before the header.
- `src/components/home/ShowTile.tsx` migrates from raw `<img>`
  to `next/image`. The sigil dimensions are fixed (96×96) so
  the `Image` component gets the static `width/height` props.
- `scripts/check-no-raw-img.mjs` walks `src/` for `<img`
  tokens in `.tsx` / `.ts` files and fails the build if it
  finds any outside of approved exceptions (today: none —
  the only raw img was in ShowTile, and that's gone).
- `scripts/size.mjs` builds the production app, sums the
  gzipped JS chunks served on `/`, fails if the total exceeds
  250 KB. Wired as `pnpm size`; **not** added to the default
  `verify` chain (size lives on a wider clock — flaky from
  upstream package bumps; runs in CI only, not on every
  local commit).

## Outputs

```
apps/e2e/src/fixtures/a11y.ts
apps/e2e/tests/a11y.spec.ts
apps/e2e/src/fixtures/a11y.test.ts                  # helper unit test

src/components/chrome/SkipToMain.tsx
src/components/chrome/__tests__/SkipToMain.test.tsx
src/components/chrome/Header.tsx                    # no change (skip is its own primitive in layout)
src/app/layout.tsx                                  # mount <SkipToMain /> as first body child

src/components/home/ShowTile.tsx                    # raw <img> -> next/image
src/components/home/__tests__/ShowTile.test.tsx     # update import + assertions

scripts/check-no-raw-img.mjs
scripts/size.mjs

package.json                                        # +size script + +@axe-core/playwright
```

## Decisions made upfront — DO NOT ASK

- **axe rules filtered to `critical` + `serious` only**. WCAG
  2.1 AA has 50+ rules; many are sub-critical contrast warnings
  that block content velocity without proportional value at v1.
  Critical + serious catches keyboard traps, missing labels,
  missing landmarks, contrast at thresholds, etc.
- **a11y matrix is fixed in `a11y.spec.ts`** — not a parameterized
  loop over `canonicalUrls`. Reason: axe runs are slow (~1.5s
  per page); covering every season + theme would 5x the e2e
  runtime. The 10-surface matrix is the bearings page-family
  representative set.
- **Mobile a11y at 375px viewport only** — not 320px. Bearings
  line 457 says mobile breakpoint is 768px; below that we
  target 375px (iPhone SE).
- **Skip link styling**: `position: fixed; top: -40px;` until
  focused, then `top: 0`. Background = paper-1, color = ink-0,
  outline = focus-visible 2px solid primary. Uses CSS only
  (no JS).
- **Skip link target is `#main`** (the layout's `<main>` already
  has `id="main"` since phase 1). No change needed there.
- **`next/image` import for ShowTile** uses `priority={false}`
  (lazy by default) + `width=96 height=96`. Sigils live at
  `/shows/<slug>/sigil.svg` — Next handles SVG via the
  `unoptimized` flag or by treating them as static assets.
  Decision: pass `unoptimized` since the sigils are already
  hand-tuned SVG; the optimizer would re-encode + balloon.
- **No-raw-img check is a build-time grep, not a TypeScript
  rule**. Lighter than an ESLint plugin; one short Node
  script. Runs as part of `pnpm verify` between typecheck and
  test:run. Exception list is hardcoded (currently empty;
  add OG image template if a content-img exception arises).
- **`pnpm size` lives outside `pnpm verify`**. Size budgets are
  by nature flaky against upstream package bumps. We run it
  manually + in CI but don't fail every local commit on a
  3% chunk growth from a Next.js minor.
- **Size budget = 250 KB gzipped for `/`** (per build-plan row).
  The check measures the FIRST-LOAD JS chunks for `/` from
  `.next/build-manifest.json`, sums their `.next/static/`
  file sizes (gzipped via `node:zlib`), fails if total >
  250 * 1024 bytes.
- **Skip link content**: "Skip to main content" — verbatim from
  WAI-ARIA Authoring Practices.
- **No `id="main"` audit step** — every page renders inside
  `layout.tsx`'s `<main id="main">`, so the assertion is
  implicit. axe-core's `landmark-one-main` rule covers it
  anyway.

## Out of scope

- Per-route Lighthouse CI gates (separate phase if signal
  warrants).
- Image optimization at content-author time (e.g., resizing OG
  PNGs to 100KB).
- Color-contrast tightening on non-AA hits.
- Bundle-analyzer-style chunk-by-chunk reporting (size script
  just emits the total + pass/fail).
- A `prefers-reduced-motion` audit (no motion in v1 outside
  Tailwind's animate-pulse skeleton, which already respects
  the preference via Tailwind defaults).
- Comprehensive screen-reader testing pass — that's `/critique`
  reader sub-agent's job (phase 19).
- Lighthouse CI gates.

## Mobile reflow / responsive

The a11y spec covers 375px mobile reflow for the 3
critical-path pages. Other surfaces already covered by
`smoke-mobile.spec.ts`.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---|---|
| `apps/e2e/src/fixtures/a11y.ts` | helper-shape test | covered via a11y.spec.ts |
| `<SkipToMain>` | renders link with correct href + label | covered by a11y.spec.ts |
| `<ShowTile>` | `<Image>` import shape change | covered by home.spec.ts smoke |
| `scripts/check-no-raw-img.mjs` | runs against fixtures | runs in `pnpm verify` |
| `scripts/size.mjs` | runs against `.next/` | runs in `pnpm size` |
| 10-surface a11y matrix | — | a11y.spec.ts |

## Verify gate

`pnpm verify` extended to include `pnpm check:no-raw-img` between
typecheck and test:run. `pnpm size` is a separate command
(documented; not in verify).

## Commit body template

```
feat: performance + a11y polish — phase 18

- axe-core/playwright wired; a11y.spec.ts walks 10 canonical surfaces.
- Skip-to-main-content link mounted in layout.
- ShowTile migrated from raw <img> to next/image.
- scripts/check-no-raw-img.mjs gates the build.
- scripts/size.mjs measures /'s first-load JS (250 KB gzipped budget).

Decisions:
- axe filtered to critical+serious (WCAG 2.1 AA).
- size script not in verify chain (lives on a wider clock).

Closes #<issue>
```

## DoD

- `pnpm verify` green (including no-raw-img check).
- `a11y.spec.ts` green on all 10 surfaces.
- `pnpm size` returns under 250 KB.
- Skip link visible on focus; hidden otherwise.
- Vercel deploy ready.
- Mirror issue closed.

## Follow-ups (out of scope)

- Per-route Lighthouse CI gates.
- prefers-reduced-motion audit + skeleton tweaks.
- Color contrast tightening beyond AA critical/serious.
- Bundle-analyzer-style chunk-by-chunk reporting.
- Image optimization at content-author time.
- Comprehensive screen-reader pass (deferred to /critique
  reader sub-agent, phase 19).
