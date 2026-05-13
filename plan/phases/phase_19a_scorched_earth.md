# Phase 19a — Scorched earth: rip out the per-show SVG art system

> **Context.** The May 2026 facade grammar (column / pediment /
> frieze / ornament on a 1200×800 frame + derived per-show
> sigil) was prototyped and **rejected** — the output reads as
> AI-generated and does not meet the bar. The new visual law
> (`design/CLAUDE.md`) is **color + typography only**, with a
> single shared brand mark. This phase removes every trace of
> the old system from code, content, assets, and tests, and
> introduces the one new primitive that replaces it: a colored
> `<Bullet>`.
>
> **This phase is destructive.** Files will be deleted. The
> verify gate must pass at the end. Subsequent phases (19b–19e)
> rebuild the chrome and pages.

## 1. Scope

### 1a. Delete from `src/`

| Path | Action |
|---|---|
| `src/components/facade/Facade.tsx` | delete |
| `src/components/facade/Pediment.tsx` | delete |
| `src/components/facade/Column.tsx` | delete |
| `src/components/facade/Frieze.tsx` | delete |
| `src/components/facade/Ornament.tsx` | delete |
| `src/components/facade/Sigil.tsx` | delete |
| `src/components/facade/PaletteScope.tsx` | delete |
| `src/components/facade/ShowFacadeArt.tsx` | delete |
| `src/components/facade/index.ts` | delete |
| `src/components/facade/__tests__/*.test.tsx` | delete |
| `src/app/shows/[show]/ShowSigilArt.tsx` | delete |
| `src/app/shows/[show]/__tests__/ShowFacadeArt.test.tsx` | delete |
| `src/app/shows/[show]/__tests__/ShowSigilArt.test.tsx` | delete |
| `src/app/internal/facade-demo/` (whole folder) | delete |
| `src/app/internal/composition-demo/` (whole folder) | delete — composition-demo is rebuilt in 19c |
| `src/lib/facade/slots.ts` | delete |
| `src/lib/facade/crop.ts` | delete |
| `src/lib/facade/palette.ts` | delete |
| `src/lib/facade/index.ts` | delete |
| `src/lib/facade/__tests__/*.test.ts` (if any) | delete |

### 1b. Delete from `public/`

| Path | Action |
|---|---|
| `public/shows/survivor/facade.svg` | delete |
| `public/shows/survivor/sigil.svg` | delete |
| `public/shows/survivor/ornament-{1,2,3}.svg` | delete |
| `public/shows/survivor/.brander.json` | delete |
| `public/shows/top-chef/*` | delete folder contents |
| `public/shows/dragrace/*` | delete folder contents |
| `public/shows/` (empty parent) | delete the directory once empty |
| `public/sigil.svg` | **keep** but replace contents — see §3 below |

### 1c. Delete from `apps/e2e/tests/`

| Path | Action |
|---|---|
| `apps/e2e/tests/facade-demo.spec.ts` | delete |
| `apps/e2e/tests/composition-demo.spec.ts` | delete |
| `apps/e2e/tests/show-facades.spec.ts` | delete |

### 1d. Delete from `apps/e2e/src/fixtures/`

Remove rows referencing `/internal/facade-demo`,
`/internal/composition-demo`, and per-show `facade.svg` /
`sigil.svg` asserts from both `canonical-urls.ts` and
`page-reads.ts`.

## 2. The `<Bullet>` primitive (new — the only show-specific graphic)

Create `src/components/atoms/Bullet.tsx`:

```tsx
type BulletProps = {
  color: string;            // hex; usually var(--show-primary) resolved upstream
  size?: number;            // default 12; spec range 8–16
  className?: string;
  'aria-hidden'?: boolean;  // defaults to true
};

export function Bullet({
  color,
  size = 12,
  className,
  'aria-hidden': ariaHidden = true,
}: BulletProps) {
  return (
    <span
      data-testid="bullet"
      className={`bullet${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, background: color }}
      aria-hidden={ariaHidden}
    />
  );
}
```

CSS contract (added to `src/styles/screens.css` or a new
`src/styles/atoms.css`):

```css
.bullet {
  display: inline-block;
  border-radius: 999px;
  flex-shrink: 0;
  vertical-align: baseline;
}
```

Unit test `src/components/atoms/__tests__/Bullet.test.tsx`:
- renders with width/height matching `size` prop
- renders with `background` matching `color` prop
- defaults `aria-hidden="true"`
- accepts a custom `className`

## 3. Replace `public/sigil.svg` with the shared brand mark

The single shared brand mark lives at `public/sigil.svg` so
existing references continue to resolve. Content (per
`design/Pantheon · Brand.html` §01):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
  <path d="M2 11 L14 3 L26 11 Z" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <line x1="5"  y1="14" x2="5"  y2="25" stroke="currentColor" stroke-width="1.4"/>
  <line x1="14" y1="14" x2="14" y2="25" stroke="currentColor" stroke-width="1.4"/>
  <line x1="23" y1="14" x2="23" y2="25" stroke="currentColor" stroke-width="1.4"/>
  <line x1="2"  y1="26" x2="26" y2="26" stroke="currentColor" stroke-width="1.4"/>
</svg>
```

(The favicon set is fully regenerated in phase 19b. This is the
SVG source the regeneration reads.)

## 4. Update the show frontmatter schema (Zod) and migrate content

### 4a. Schema — `src/content/schemas.ts`

Replace the current `showFrontmatterSchema` with the seven-field
contract per `design/CLAUDE.md`:

```ts
export const showFrontmatterSchema = z.object({
  slug:    z.string().regex(/^[a-z0-9-]+$/),
  name:    z.string().min(1),
  palette: z.object({
    paper:   z.string().regex(/^#[0-9a-fA-F]{6}$/),
    ink:     z.string().regex(/^#[0-9a-fA-F]{6}$/),
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  seasons: z.number().int().nonnegative(),
  status:  z.enum(['airing', 'ended', 'hiatus']),
  blurb:   z.string().min(1).max(120),
  tagline: z.string().min(1).max(280),
  body_md: z.string().optional(),
});
```

Drop: `network`, `format`, `hero_motifs`, `first_aired`.

Unit test `src/content/__tests__/schemas.test.ts`:
- parses a valid Survivor frontmatter
- rejects missing `seasons`
- rejects missing `blurb`
- rejects extra `hero_motifs` (strict mode if not already)
- rejects palette without all three hex values
- rejects `seasons` < 0

### 4b. Migrate `content/shows/survivor.md`

```yaml
---
slug: survivor
name: Survivor
palette:
  paper:   "#0E2A2A"
  ink:     "#EFE2BD"
  primary: "#D55E36"
seasons: 47
status: airing
blurb: "47 seasons. One torch at a time."
tagline: "47 seasons of strangers on a beach. The genre that invented itself in episode one, and has spent twenty-five years rediscovering what it is. We've ranked every single one."
---
```

(The user's brief calls out the Survivor tagline copy
explicitly — use the one above verbatim.)

### 4c. Migrate `content/shows/top-chef.md`

```yaml
---
slug: top-chef
name: Top Chef
palette:
  paper:   "#1B2418"
  ink:     "#ECDFC6"
  primary: "#B86A2E"
seasons: 22
status: airing
blurb: "22 seasons. Knives drawn, herbs fresh."
tagline: "22 seasons of professional cooks in unfamiliar kitchens. Ranked by people who actually liked the food."
---
```

### 4d. Migrate `content/shows/dragrace.md`

```yaml
---
slug: dragrace
name: RuPaul's Drag Race
palette:
  paper:   "#2D0B2A"
  ink:     "#F2E1D2"
  primary: "#E64B86"
seasons: 17
status: airing
blurb: "17 seasons. Quiet velvet, loud pink."
tagline: "17 seasons of queens, runways, and Snatch Game. Ranked without spoiling a single crowning."
---
```

## 5. Stub the show + season pages so the verify gate passes

19a is destruction + the new schema. The rich page rebuild
happens in 19c. For this phase:

- `src/app/shows/[show]/page.tsx` — strip every `ShowFacadeArt`
  import and reference. Render a minimal placeholder: tinted
  body via `[data-show=<slug>]`, `<h1>{show.name}</h1>` in
  serif, `{show.blurb}`, a `<p>` linking to canon + community.
  No facade. No sigil.
- `src/app/page.tsx` — same treatment. Strip `ShowFacadeArt`
  and `ShowTile` artSrc usage. Render a minimal placeholder
  hero + a list of show names. The rich home rebuild is 19e.
- `src/components/home/ShowTile.tsx` — drop the `artSrc` prop
  and the `<Image />` element. Render a placeholder with name
  + blurb + bullet only. Rebuilt in 19e.
- `src/components/home/HomeHero.tsx` — drop the `art` prop and
  the `.home-hero-art` container. Render copy-only hero.
  Rebuilt in 19e.
- `src/components/composition/ShowHero.tsx` — drop the `art`
  prop. Rebuilt in 19c.

Unit tests for these placeholders: render the show name; render
the blurb; assert no `<svg>` matching the facade viewBox
`0 0 1200 800` appears anywhere.

## 6. e2e contract for this phase

- `apps/e2e/src/fixtures/page-reads.ts` updated: the show
  page's `expects` list **must not** contain `data-testid="show-facade-art"`
  or `data-testid="show-sigil-art"`. Add a new positive
  assertion: every show page contains exactly one element
  matching `[data-testid="bullet"]` (the show-primary marker in
  a crumb or wordmark lockup), and **zero** SVGs with a
  per-show viewBox.
- New e2e check in `apps/e2e/tests/no-per-show-svg.spec.ts`:
  walks `/`, `/shows`, `/shows/survivor`, `/shows/top-chef`,
  `/shows/dragrace`, `/shows/survivor/season/1`. Asserts:
  - No `<svg>` element has `viewBox="0 0 1200 800"`
  - No `<img>` element has `src` matching
    `/shows/[a-z-]+/(facade|sigil|ornament).*\.svg`
  - No request is made for any URL matching the above pattern
    (Playwright `page.on('request')` recorder)
- Remove the rows referenced in §1d above.

## 7. Decisions log

Document in the commit body:

- **Why we delete instead of keeping facade code "just in
  case":** `design/CLAUDE.md` Hard Rule 1 explicitly forbids
  retry. Dead-coding the modules invites a future loop to
  resurrect them. Delete cleanly.
- **Why we replace `public/sigil.svg` with the shared brand
  mark and not delete it outright:** existing favicon and OG
  paths reference it. Replacing in place is the safer move.
- **Why we leave the rich page rebuild to 19c, not 19a:** 19a
  is the destructive step; isolating it keeps the diff
  readable and the verify gate honest. 19b through 19e then
  build forward.

## 8. Verify

```
pnpm verify    # typecheck → test:run → build → e2e
```

Acceptance:
- All four legs green.
- No file under `public/shows/` survives.
- No file under `src/components/facade/` or `src/lib/facade/`
  survives.
- Three migrated `content/shows/*.md` files parse against the
  new Zod schema.
- The `no-per-show-svg.spec.ts` e2e is green.
- The smoke walker covers every URL with no console errors.

## 9. Commit + push

```
git add -A
git commit -m "feat: phase 19a — scorched earth, rip out per-show SVG art system"
git push origin main
pnpm deploy:check
```

(Per `agents.md` §2 — no `Co-Authored-By:`. Local commit, no
`Cloud-Run:` trailer.)

Tick `[x]` for 19a in `plan/steps/01_build_plan.md` with the
commit hash in the same commit, or a follow-up `plan:` commit.
