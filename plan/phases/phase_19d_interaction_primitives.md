# Phase 19d — Interaction primitives to spec

> **Context.** The production app's `<VotePair>`,
> `<CommentInputStub>`, and `<RankShiftPill>` exist but don't
> match the design. This phase rewrites them as **exact ports**
> of `design/compositions/interactions.jsx` and the matching
> CSS in `design/compositions/screens.css`. The vote and
> comment APIs already exist (phases 11 and 12); this phase
> only changes the components and their wiring.
>
> `<RankShiftPill>` is built but **not yet rendered in the
> product** — it's a component + tests + demo, ready for a
> future phase to wire to a 72-hour shift signal.

## 1. `<VotePair>` — rewrite

Source: `design/compositions/interactions.jsx` lines 14–73 +
`screens.css` lines 432–471.

### Structure

```
[ vote-down button | vote-count (num + "net votes" label) | vote-up button ]
```

- Pill-shaped container: `display: inline-grid; grid-template-columns: auto auto auto; border-radius: 999px; border: 1px solid color-mix(in oklab, var(--show-ink) 18%, transparent); background: var(--show-paper); overflow: hidden`
- Each button: 64–72px square (use 72px on season vote block,
  64px on default), centered glyph
- Down button glyph: down-arrow SVG (line + arrow, 2.4px
  stroke, currentColor) — matches the design
- Up button glyph: same up-pointing
- Count: min-width 160px, padding `0 24px`, mono 500 32px,
  show-ink, letter-spacing -0.01em; label below is mono 10px
  uppercase, letter-spacing 0.18em, show-ink @50%

### Behavior

State machine — useReducer, four fields:
```ts
type State = {
  count: number;
  last: 'up' | 'down' | null;     // drives flash class
  bump: -1 | 0 | 1;               // drives count slide
  locked: boolean;                // disable buttons during animation
};
```

On click:
1. `setLocked(true)`
2. `setLast(dir)` → adds `.flash` class to the clicked button
3. `setBump(dir === 'up' ? 1 : -1)` → translates `.vote-num`
   by `-8px * bump` for the slide effect
4. `setCount(c => c + (dir === 'up' ? 1 : -1))`
5. POST to `/api/vote` with `{ targetType, targetId, value: ±1 }`
6. After 800ms: clear `locked`, `last`, `bump`

`prefers-reduced-motion`: replace the transform with an opacity
fade. Read once via `useEffect` + `window.matchMedia` and
store in a ref (the design's pattern).

If the API call fails, roll back the optimistic count and show
a brief toast — or just revert silently and log. The design
doesn't specify; pick the silent rollback to keep the demo
crisp and document the decision in the commit.

### Flash classes

`.vote-btn.vote-down.flash`:
```css
background: color-mix(in oklab, var(--s-warm-down) 32%, transparent);
color: var(--s-warm-down);
```

`.vote-btn.vote-up.flash`:
```css
background: color-mix(in oklab, var(--s-warm-up) 32%, transparent);
color: var(--s-warm-up);
```

### Props

```ts
type VotePairProps = {
  initialCount?: number;
  targetType: 'season' | 'comment';
  targetId: string;
  label?: string;            // for aria-label; default derived from targetType
};
```

`data-testid="vote-pair"`. Each button has its own
`aria-label` (`Vote {label} up` / `Vote {label} down`).

### Unit tests

- Renders with `initialCount`, count visible
- Clicking up increments count and applies `.flash` to up
  button
- Clicking down decrements and applies `.flash` to down button
- After 800ms, `.flash` clears and buttons are enabled again
- API is called with the right body
- `prefers-reduced-motion`: assert `transform: none` on the
  count element after a click
- aria-labels present

## 2. `<CommentInput>` — rewrite (replaces `<CommentInputStub>`)

Source: `design/compositions/interactions.jsx` lines 76–143 +
`screens.css` lines 472–532.

### Two states

**Collapsed** (default): a single button that reads
`"Add a thought · no spoilers, please."` on the left + `⏎`
on the right. Click expands.

**Open**: a textarea + reminder banner + spoiler-detection
+ post/cancel actions.

### Open structure

1. **Reminder banner** (`.comment-reminder`):
   - small green dot + "No spoilers — past or future. Talk
     about the season, not the result."
   - Mono 11px uppercase, letter-spacing 0.06em, color
     `var(--s-hold)`
   - Padding-bottom 12px
2. **Textarea** — Source Serif 4 16px / 1.55 line-height,
   transparent bg, no border, placeholder "Say what you
   actually think." (serif italic feels right; design uses
   regular weight — match the design exactly)
3. **Spoiler flag** (`.comment-flag`) — shows when text
   matches a spoiler phrase from `SPOILER_PHRASES`. Margin-top
   8px, padding `10px 12px`, bg
   `color-mix(in oklab, var(--s-warm-down) 14%, transparent)`,
   color `var(--s-warm-down)`, border-radius 6px.
   Content: `✱ "<phrase>" reads like a spoiler. Reword
   before posting.` (Per the design, the phrase is shown in
   bold inside the message — use the exact substring matched.)
4. **Foot** (`.comment-foot`) — flex-end, gap 10px:
   - Cancel: transparent, show-ink @60%, hover show-ink
   - Post: filled pill, show-ink bg, show-paper text; disabled
     when textarea empty OR a spoiler is detected
5. **Container** (`.comment`):
   - Border-radius 12px, border show-ink @18%, bg
     `color-mix(in oklab, var(--show-ink) 4%, var(--show-paper))`
   - **`.warn`** modifier (when spoiler detected): border
     becomes `var(--s-warm-down)`

### Spoiler detection — local pre-filter

Local-only, **not** a replacement for the OpenAI moderation
pre-filter on the server. This is a fast UX hint that nudges
the author before they post. The server is still the truth
gate.

`src/lib/spoiler/local.ts`:

```ts
const SPOILER_PHRASES = [
  'wins', 'winner', 'wins it', 'gets eliminated', 'votes out',
  'final tribal', 'season finale', 'eliminated in the final',
];

export type SpoilerMatch = { phrase: string; at: number };
export function detectSpoiler(text: string): SpoilerMatch | null { ... }
```

Unit test the helper:
- returns `null` for clean text
- catches each phrase
- case-insensitive
- returns the substring at the matched position (not the
  lowercased version) so the UI can show the user's original
  casing

The textarea triggers detection on every change after the
first touch (per the design's `touched` ref pattern).

### Posting flow

On Post:
1. POST `/api/comment` with `{ targetType, targetId, body }`
2. Server returns either `accepted`, `pending` (moderation
   hold), or `blocked` (spoiler / hard reject)
3. On `accepted`/`pending`: close the comment input + emit a
   small toast "Posted — pending mod review" if `pending` or
   "Posted." if `accepted`
4. On `blocked`: keep the input open, highlight the reason
   (the API returns a reason; render in `.comment-flag`)
5. The optimistic insert into the visible thread is a phase
   12 concern — for 19d we just close the input and let the
   server-rendered list refresh on next nav. If a real-time
   insert is desired, file as a phase candidate.

### Props

```ts
type CommentInputProps = {
  targetType: 'season' | 'show';
  targetId: string;
  onPosted?: (status: 'accepted' | 'pending') => void;
};
```

`data-testid="comment-input"`. When open,
`data-testid="comment-input-textarea"` on the textarea.

### Auth gating

If the user isn't authed, render a different sub-component:
`<CommentSignInStub>` that links to `/sign-in?return=<current>`.
This preserves the design's "Add a thought · no spoilers,
please" affordance but routes through magic-link. The auth
state comes from a `useSession()` hook (already in the
codebase from phase 10).

### Unit tests

- Closed state shows the stub button
- Clicking stub opens the input
- Typing a clean line enables Post
- Typing "she wins" triggers `.warn` + the flag banner +
  disables Post
- Cancel closes the input and clears the textarea
- Reminder banner always visible in open state
- Auth-stub renders for unauth'd users and routes to /sign-in
  with `return` param

## 3. `<RankShiftPill>` — port to spec

Source: `design/compositions/interactions.jsx` lines 145–195 +
`screens.css` lines 534–558.

```tsx
type Sentiment = 'warm-up' | 'warm-down' | 'neutral' | 'hold' | 'verdict' | 'consensus';

type RankShiftPillProps = {
  delta: number;
  sentiment: Sentiment;
};

export function RankShiftPill({ delta, sentiment }: RankShiftPillProps) {
  const sign = delta > 0 ? '↑' : delta < 0 ? '↓' : '—';
  const num = Math.abs(delta);
  const color = `var(--s-${sentiment})`;
  return (
    <span
      className="rank-pill"
      data-testid="rank-shift-pill"
      data-sentiment={sentiment}
      data-delta={delta}
      style={{ color, background: `color-mix(in oklab, ${color} 16%, transparent)` }}
    >
      <span aria-hidden="true">{sign}</span>
      {num !== 0 && <span>{num}</span>}
    </span>
  );
}
```

CSS:
```css
.rank-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font: 600 11px/1 var(--mono); letter-spacing: 0.08em;
}
```

### Not yet wired into the product

For 19d, do **not** render `<RankShiftPill>` on the production
show home, season page, or anywhere else. The placeholder
"Shifts this week" section in `<ShowHero>` is empty per 19c's
stub strategy. RankShiftPill is component + tests only here.

To prove the component visually, build a tiny demo route at
`/internal/rank-shift-demo` that renders one of each
sentiment. This route is gated behind a build-time flag
(`process.env.NEXT_PUBLIC_INTERNAL_DEMOS === '1'`) so it
doesn't ship to prod by default — same gating pattern as the
older `/internal/composition-demo` had.

### Unit tests

- Renders with all six sentiments
- Positive delta uses `↑`, negative `↓`, zero `—`
- `num` omitted when delta is 0
- `data-sentiment` and `data-delta` attributes populated
- `color-mix` style applied (assert via `style` attribute
  match, since computed-style cross-platform is flaky for
  color-mix())

## 4. Where the new components plug in

- `<VotePair>` — used by `<SeasonVoteBlock>` (phase 19c) inside
  the season page. Existing `/shows/[show]/season/[n]` page
  picks up the new VotePair via component replacement.
- `<CommentInput>` — used by `<SeasonAside>` (phase 19c)
  inside the season thread.
- `<RankShiftPill>` — exported but not yet wired. The
  `<SeasonCard>` (phase 19c) accepts a `shift` prop and
  conditionally renders the pill; passing `null` is the
  19c-stub path.

## 5. Tests + verify

Unit tests as listed above. e2e:

- `apps/e2e/tests/vote-backend.spec.ts` already exists from
  phase 11 — update the selectors to match the new VotePair
  testids and verify the click → flash → API → count flow
  still works.
- `apps/e2e/tests/comment-backend.spec.ts` already exists from
  phase 12 — update for the new open/closed states and the
  local spoiler-flag display.
- New `apps/e2e/tests/rank-shift-pill.spec.ts` (only if the
  internal demos flag is on for the e2e run): assert all six
  sentiments render with correct testid + delta + arrow.

## 6. Verify + commit + push

```
pnpm verify
git add -A
git commit -m "feat: phase 19d — interaction primitives to spec"
git push origin main
pnpm deploy:check
```

Tick `[x]` for 19d.

## 7. Decisions log

- Local spoiler pre-filter exists as a UX hint; the server's
  OpenAI moderation is the truth gate. Document.
- Optimistic vote rollback on API failure is silent (no toast)
  in 19d. If critique flags this, add the toast later.
- `<RankShiftPill>` is built without a production placement.
  When the 72-hour shift signal lands (separate phase
  candidate), wire it into `<SeasonCard>` and the show-home
  "Shifts this week" section.
