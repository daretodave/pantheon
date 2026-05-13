# Phase 9 — Single season page (canonical sibling for season pages)

> **Canonical sibling for `/shows/[show]/season/[n]`.** Every
> per-season page that ships in any later phase mirrors this
> one's structure. The vote pair, comment shell, and 72-hour
> rank pill are working components — not mocks.

## Goal

`/shows/[show]/season/[n]` ships as a single-column page that:
- Inherits the show's palette via the same wrapper pattern as
  phase 6 — `[data-show=<slug>]` with CSS vars.
- Renders the season metadata (number, title, premiere date,
  ep count, location, host, format changes) above a 50-80
  word blurb.
- Renders the **vote pair** as a working component:
  `[+]` `[−]` flanking a live count, animated on click,
  sentiment-colored flash, 800ms lock to prevent double-tap.
  No backend yet (phase 11 wires it) — the click handler
  posts to a stub `/api/vote` that returns 200 with the
  current count.
- Renders the **comment thread shell** — input affordance
  with "sign in to comment" prompt for anon viewers, full
  textarea + submit for authed viewers (still no backend —
  phase 12 wires it). Existing comments render as a margin
  column on desktop, stacked below on mobile.
- Renders the **72-hour rank pill** — `↑3` or `↓2` with the
  appropriate sentiment color, visible only if
  `season.canonical_position` shifted within the last 72
  hours (computed from a `canonical_history.md` field — phase
  17's responsibility to implement; phase 9 ships the
  component skeleton).
- Carries the spoiler-shield pill in the hero corner.
- Ships with full e2e + unit test coverage.

## URL pattern

`/shows/[show]/season/[n]` for every (show slug, season number)
combination present in content.

## Outputs

```
src/app/shows/[show]/season/[n]/
├── page.tsx                                # server component
├── SeasonShell.tsx                         # client wrapper, palette + spoiler shield
├── SeasonHeader.tsx                        # number, title, metadata strip
├── SeasonBlurb.tsx                         # the 50-80 word blurb, MDX-rendered
├── VotePair.tsx                            # working component — animated, locked, no backend yet
├── CommentThread.tsx                       # input shell + existing-comments display
├── CommentInput.tsx                        # split for unauthed vs authed
├── RankPill.tsx                            # 72h delta pill
└── __tests__/
    ├── VotePair.test.tsx                   # click → animation → lock → unlock cycle
    ├── CommentInput.test.tsx               # auth-state branching
    ├── RankPill.test.tsx                   # delta math + sentiment color picking
    └── SeasonHeader.test.tsx

src/components/chrome/ShieldPill.tsx        # already exists from phase 6
src/lib/votePair.ts                         # the click → optimistic-update → lock state machine, pure
src/lib/votePair.test.ts                    # exhaustive state-machine coverage

apps/e2e/tests/season-page.spec.ts          # walks every seeded season, asserts vote pair, comment shell, rank pill conditional
```

## Detailed steps

### 1. Server component

```tsx
import { notFound } from 'next/navigation'
import { getShowBySlug, getSeasonByNumber } from '@/content/loaders'
import { SeasonShell } from './SeasonShell'
import { buildMetadata, buildJsonLd, canonicalUrl } from '@/lib/seo'

type Params = { show: string; n: string }

export async function generateStaticParams() {
  const { getAllShows } = await import('@/content/loaders')
  return getAllShows().flatMap(show =>
    show.seasons.map(s => ({ show: show.slug, n: String(s.number) }))
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { show: slug, n } = await params
  const show = getShowBySlug(slug)
  const season = show && getSeasonByNumber(show, Number(n))
  if (!show || !season) return { title: 'Not found' }
  return buildMetadata({
    title: `${show.name} ${season.number}: ${season.title}`,
    description: season.blurb_excerpt,
    path: `/shows/${slug}/season/${n}`,
  })
}

export default async function SeasonPage({ params }: { params: Promise<Params> }) {
  const { show: slug, n } = await params
  const show = getShowBySlug(slug)
  const season = show && getSeasonByNumber(show, Number(n))
  if (!show || !season) notFound()

  const jsonLd = buildJsonLd('Article', {
    headline: `${show.name} ${season.number}: ${season.title}`,
    url: canonicalUrl(`/shows/${slug}/season/${n}`),
    isPartOf: { '@type': 'CreativeWorkSeries', name: show.name },
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeasonShell show={show} season={season} />
    </>
  )
}
```

### 2. Client wrapper

`SeasonShell.tsx` mirrors `ShowHomeShell.tsx`'s palette
injection. Uses the same `injectShowPalette` helper. Layout is
single-column on mobile (every section stacked), two-column on
desktop (blurb + vote pair on the left, comment thread on the
right margin).

### 3. The vote pair — working component

This is the centerpiece. State machine:

```
idle → click → optimistic +1/-1 → lock 800ms → unlock → idle
```

`src/lib/votePair.ts`:

```ts
export type VoteState = 'idle' | 'voting' | 'locked'
export type VoteValue = 1 | -1 | 0

export type VotePairState = {
  state: VoteState
  value: VoteValue       // current voter's vote
  count: number          // aggregate display count
  lockedUntil?: number   // epoch ms; while now < lockedUntil, state is 'locked'
}

export function reduceVote(s: VotePairState, action: 'up' | 'down', now = Date.now()): VotePairState {
  if (s.state === 'locked' && (s.lockedUntil ?? 0) > now) return s
  const delta = action === 'up' ? 1 : -1
  // toggle: if voter already cast same direction, retract
  const newValue: VoteValue = s.value === delta ? 0 : (delta as VoteValue)
  const newCount = s.count + (newValue - s.value)
  return {
    state: 'locked',
    value: newValue,
    count: newCount,
    lockedUntil: now + 800,
  }
}

export function tickUnlock(s: VotePairState, now = Date.now()): VotePairState {
  if (s.state === 'locked' && (s.lockedUntil ?? 0) <= now) {
    return { ...s, state: 'idle', lockedUntil: undefined }
  }
  return s
}
```

Pure, exhaustively unit-tested. The component layer subscribes
via `useReducer`.

`VotePair.tsx`:

```tsx
'use client'
import { useReducer, useEffect } from 'react'
import { reduceVote, tickUnlock } from '@/lib/votePair'

export function VotePair({ initialCount, initialValue, targetId, targetType }) {
  const [state, dispatch] = useReducer(/* wrap reduceVote/tickUnlock */)

  useEffect(() => {
    if (state.state !== 'locked') return
    const timeout = state.lockedUntil! - Date.now()
    const t = setTimeout(() => dispatch({ type: 'unlock' }), timeout)
    return () => clearTimeout(t)
  }, [state])

  const onUp   = () => { fetch('/api/vote', { method: 'POST', body: JSON.stringify({ targetType, targetId, value: 1 }) }); dispatch({ type: 'up' }) }
  const onDown = () => { fetch('/api/vote', { method: 'POST', body: JSON.stringify({ targetType, targetId, value: -1 }) }); dispatch({ type: 'down' }) }

  return (
    <div className="vote-pair" data-testid="vote-pair">
      <button onClick={onUp} disabled={state.state === 'locked'} aria-label="Vote up">+</button>
      <span className="vote-count" data-flash={state.state === 'locked' ? state.value : undefined}>{state.count}</span>
      <button onClick={onDown} disabled={state.state === 'locked'} aria-label="Vote down">−</button>
    </div>
  )
}
```

CSS handles the flash via `data-flash` attribute → sentiment
color via `prefers-reduced-motion` aware transition.

Phase 9 ships the working component AND the stub `/api/vote`
that just returns 200. Phase 11 swaps the stub for real
Supabase writes — no component change needed.

### 4. Comment thread shell

`CommentInput.tsx` reads `useSession()` (Auth0 SDK) and renders
either:
- Anon: a small "sign in to comment" link to `/sign-in?return=<here>`.
- Authed: a `<textarea>` + submit button, with an inline
  spoiler-reminder ("no plot, no winners, no twists") below
  the input. On submit POSTs to stub `/api/comment` returning
  200; phase 12 swaps for real backend.

`CommentThread.tsx` renders existing comments (none yet —
phase 12 hydrates from DB). Empty state shows the standard
empty-state copy template.

### 5. RankPill

```tsx
import type { Sentiment } from '@/styles/sentiment'

export function RankPill({ delta, sentiment }: { delta: number; sentiment: Sentiment }) {
  if (delta === 0) return null
  const sign = delta > 0 ? '↑' : '↓'
  return (
    <span className="rank-pill" data-sentiment={sentiment} aria-label={`Rank changed by ${delta}`}>
      {sign}{Math.abs(delta)}
    </span>
  )
}
```

The `delta` source comes from a `canonical_history` field on
the season record (frontmatter array of position changes with
timestamps). Compute helper picks the most recent shift in the
last 72h. If no shift in window → return null. Phase 9 ships
the helper + component; the field gets populated in phase 17
(canon completeness) when canon shifts start happening.

### 6. e2e coverage

`apps/e2e/tests/season-page.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { canonicalUrls } from '../src/fixtures/canonical-urls'

const seasonUrls = canonicalUrls.filter(u => u.pattern === '/shows/[show]/season/[n]')

for (const url of seasonUrls) {
  test(`season page: ${url.path}`, async ({ page }) => {
    await page.goto(url.path)

    // Vote pair is interactive
    const upBtn = page.getByRole('button', { name: 'Vote up' })
    const count = page.getByTestId('vote-pair').locator('.vote-count')
    const before = await count.innerText()
    await upBtn.click()
    await expect(count).not.toHaveText(before)
    await expect(upBtn).toBeDisabled()
    await page.waitForTimeout(900)
    await expect(upBtn).toBeEnabled()

    // Comment shell present (anon or authed branch)
    const commentSection = page.getByTestId('comment-thread')
    await expect(commentSection).toBeVisible()

    // Spoiler shield
    await expect(page.getByTestId('shield-pill')).toBeVisible()
  })
}
```

### 7. Update fixtures

Extend `apps/e2e/src/fixtures/page-reads.ts`:

```ts
'/shows/[show]/season/[n]': {
  expectVisible: ['[data-testid=vote-pair]', '[data-testid=comment-thread]', '[data-testid=shield-pill]'],
  expectJsonLdType: 'Article',
},
```

### 8. Verify + commit + push

`pnpm verify` → green. Commit with message:

```
phase 9: single season page (canonical sibling)

- /shows/[show]/season/[n] ships single-column composition
- VotePair: pure state machine in src/lib/votePair + animated
  component with 800ms lock; stub /api/vote responds 200
- CommentThread + CommentInput: anon/authed branching, inline
  spoiler-reminder; stub /api/comment responds 200
- RankPill: 72h delta with sentiment color; renders only when
  canonical_history shows a recent shift
- Per-show palette inherited via the same wrapper as phase 6
- generateStaticParams over every seeded (show, season)
- Article JSON-LD
- e2e walks all seeded season URLs; asserts vote pair
  interaction cycle, comment shell, shield pill
- Unit tests cover the vote state machine exhaustively

Phase 9 of build plan ticked. Canonical sibling for season
pages established — phases 12+ wire real backends without
component changes.
```

## Decisions made upfront — DO NOT ASK

- **Vote count display:** raw integer, no formatting (e.g.,
  `27`, not `27 votes`). The `+`/`−` buttons make it
  unambiguous.
- **Lock duration:** 800ms — enough to prevent double-tap,
  short enough not to feel sluggish.
- **Vote retraction:** click same direction again → retract
  (vote becomes 0). This is the standard Reddit-like
  behavior.
- **Vote pair size:** 44×44 minimum touch target (WCAG AA).
- **Comment input:** below the blurb desktop, below the vote
  pair mobile.
- **Spoiler reminder copy:** "no plot, no winners, no twists"
  — exact phrase. Inline grey text below the textarea.
- **RankPill display window:** 72 hours from
  `canonical_history[0].timestamp`. Anything older returns
  null.
- **No reactions, no emojis on comments:** plain text only
  in v1.
- **No threading depth limit:** but UI defers nested replies
  to phase 12's full implementation.
- **Stub APIs return 200 + no-op:** so the e2e can exercise
  the click → optimistic-update path without a backend.
  Phase 11 + 12 wire real persistence.

## Failure modes — when to stop

1. State machine bug surfaces in tests → `votePair.ts`
   exhaustive cases; trust the unit tests, debug there.
2. The flash animation triggers on initial render
   (hydration mismatch) → `data-flash` should only set on
   `state.lockedUntil` truthiness; check the reducer.
3. CSS var inheritance breaks (palette doesn't reach buttons)
   → confirm `[data-show]` wrapper is the parent. If not,
   the layout shipped wrong in phase 6.
4. Stub `/api/vote` returns 404 → routes need to ship in
   phase 9 too — add `src/app/api/vote/route.ts` with a
   minimal POST handler that just echoes `{ ok: true }`.
   Same for `/api/comment`.
