# Phase 12 — Comment backend

> **The second writeable backend phase.** Phase 11 made votes
> durable; phase 12 makes comments durable behind an AI
> pre-filter + an account-age hold + a flag queue. Comments
> require auth (spec §Identity tiers). The mod queue page
> (phase 13) drains the rows this phase writes.
>
> **Data-steward owns the migrations + RPCs + RLS.** Main agent
> wires the OpenAI client, the route handlers, the deterministic
> e2e stub, and the spec.

## Goal

By the end of this phase:

- Supabase migrations land four new tables and two RPCs:
  - `comments` — id, parent_id, session_id, target_type
    (`season|comment` — a reply is a comment whose target is a
    comment), target_id (the same opaque text key used by votes:
    `<show>:<season>` or a comment uuid), body, status
    (`published|pending|hidden|removed`), spoiler_score, created_at,
    updated_at. Unique constraint on
    `(session_id, target_type, target_id, body_hash)` to swallow
    accidental double-submits.
  - `flags` — id, comment_id, session_id (the reporter), reason
    (free text, ≤200 chars), created_at. Unique on
    `(comment_id, session_id)` so a session can only flag once.
  - `ai_decisions` — id, comment_id, model, verdict
    (`allow|flag|block`), categories text[], confidence numeric,
    reason text, redacted_phrase text, created_at. Append-only.
  - `post_comment(p_session_id uuid, p_target_type text,
    p_target_id text, p_parent_id uuid|null, p_body text,
    p_verdict text, p_categories text[], p_confidence numeric,
    p_ai_reason text, p_redacted_phrase text|null)` — SECURITY
    DEFINER, enforces:
    - Auth required: rejects with `42501` if the resolved session
      has no `auth0_sub` (anon callers).
    - Rate limit: 5 comments/user/hour, 30/24h. Overflow raises
      `23505` with hint `rate_limited`.
    - New-account hold: if `users.created_at` is < 7 days OR
      the user has < 5 published comments, force status='pending'
      regardless of AI verdict (unless verdict='block', which
      always wins).
    - Verdict-to-status mapping: `block→hidden`, `flag→pending`,
      `allow→published` (subject to new-account override above).
    - Inserts the matching `ai_decisions` row in the same
      transaction.
    - Returns `(id, status, count)` — count is the live
      published-comment count for the target_id.
  - `flag_comment(p_session_id uuid, p_comment_id uuid,
    p_reason text)` — SECURITY DEFINER, enforces:
    - Auth required (rejects 42501 if anon).
    - Inserts row; if total flag count ≥ 5 within 1h on the same
      target, also auto-hides the comment (status='hidden') —
      matches bearings §Moderation flow escalation threshold.
    - Returns `(flag_count, auto_hidden)`.

- `src/lib/openai/preFilter.ts` — wraps the structured-output
  call against `openai:gpt-5-mini-2025-08-07`. The system prompt
  is taken verbatim from `setup/06_openai.md` §F. Returns the
  verdict object typed via zod:
  `{ verdict: 'allow'|'flag'|'block', categories: string[],
    confidence: number, reason: string, redacted_phrase: string|null }`.
  Hard fallback: if the API errors / 3-strike threshold, returns
  `verdict='flag'` with reason 'fallback' so the comment lands in
  the mod queue. Reads `OPENAI_API_KEY` server-side only.

- `src/lib/openai/preFilter.ts` is short-circuited by
  `OPENAI_FAKE='1'`. The deterministic stub:
  - body containing the word `WINNER` (case-insensitive) →
    verdict='block', categories=['spoiler_winner'].
  - body containing the word `SPOILER` (case-insensitive) →
    verdict='flag', categories=['spoiler_plot'].
  - everything else → verdict='allow', categories=[].
  Confidence=1.0, reason='fake stub', redacted_phrase=null.

- `POST /api/comment` — Zod body validation
  (`{ targetType, targetId, parentId?, body }`), resolves the
  session id via the same cookie + Auth0 pattern as /api/vote,
  upserts the users row, runs the pre-filter, calls
  `post_comment()`. Error mapping: `42501→401 auth_required`,
  `23505→429 rate_limited`, `22023→400 invalid_body`. Returns
  `{ ok, id, status, count, verdict }`.

- `POST /api/flag` — Zod body (`{ commentId, reason }`),
  same session resolution, calls `flag_comment()`. Same error
  mapping.

- `apps/e2e/playwright.config.ts` sets `OPENAI_FAKE=1` so the
  e2e harness never talks to OpenAI.

- E2e tests:
  - `apps/e2e/tests/comment-backend.spec.ts` — uses the minted
    e2e cookie (authed) so post_comment doesn't reject:
    - happy path: post a benign body, expect 200 + status
      'published' (account age in seed is well past 7d).
    - spoiler-blocked: post a body containing "WINNER" → 200 +
      status='hidden', verdict='block'.
    - mod-queue path: post a body containing "SPOILER" → 200 +
      status='pending', verdict='flag'.
    - anon rejection: clear cookies, post any body → 401
      auth_required.
    - flag: post a benign comment, then POST /api/flag with the
      returned id → 200 + flag_count=1, auto_hidden=false.
    - malformed body: missing targetId → 400 invalid_body.

## Outputs

```
supabase/migrations/<ts>_comments.sql
supabase/migrations/<ts>_flags.sql
supabase/migrations/<ts>_ai_decisions.sql
supabase/migrations/<ts>_post_comment_rpc.sql
supabase/migrations/<ts>_flag_comment_rpc.sql

src/lib/openai/preFilter.ts
src/lib/openai/preFilter.test.ts
src/lib/openai/index.ts                   # re-exports for terseness

src/app/api/comment/route.ts              # rewrite
src/app/api/flag/route.ts                 # new

apps/e2e/tests/comment-backend.spec.ts
apps/e2e/playwright.config.ts             # +OPENAI_FAKE=1
```

## Decisions made upfront — DO NOT ASK

- **Comments require auth.** Anon callers get 401. Bearings line
  111 + §Identity tiers settle this. The /sign-in CTA already
  lives in `<CommentInputStub>`.
- **`target_type` reuses the votes vocabulary** (`season|comment`),
  so a reply is a comment whose target is another comment.
  `target_id` is the same opaque text the votes table uses
  (`<show>:<season>` or a comment UUID). One UNIQUE index handles
  reply uniqueness without a separate `replies` table.
- **`body_hash` is `md5(lower(trim(body)))`** maintained as a
  generated column. Used only for the dedupe constraint — never
  read by the app. Mirrors the bearings §Anti-abuse "don't double
  submit" intent without coupling to message text.
- **Pre-filter timeout is 5 s with one retry** then fallback to
  `flag` so the user never sees a hung request. Bearings §J says
  "better slow than insecure" — 5 s is the soft slow.
- **AI decision logged ONCE per comment**, even if a retry runs.
  The post_comment RPC inserts the ai_decisions row in the same
  transaction as the comment, so the audit row exists for every
  attempt regardless of verdict.
- **Account-age hold uses `users.created_at` as the canonical
  timestamp.** The anon-claim flow (phase 10) preserves it on
  sign-in — new accounts only start their 7-day window once.
- **New-account hold counts published comments, not all comments.**
  Held/blocked don't count toward the 5-comment threshold. Matches
  bearings line 119 reading.
- **Flag auto-hide threshold = 5 flags/1h on the same comment.**
  This is the bearings §Moderation flow escalation threshold,
  applied at write time. Mod ops can still un-hide manually
  (phase 13).
- **`OPENAI_FAKE='1'` ships from this phase forward** (not just
  e2e — also test:run). The deterministic stub lives in
  `preFilter.ts` itself so unit tests don't need to mock the SDK.
  Production never sets the flag.
- **Comment `body` is plain text in v1**, NOT markdown. Spec.md
  line 160 says `body_md` but bearings 484 + §Anti-abuse don't
  require it; rendering markdown adds an XSS surface the mod
  pre-filter doesn't model. Body is stored as-is and rendered as
  text with `\n` honored via CSS `white-space: pre-wrap`. Markdown
  is a follow-up.
- **5-flag auto-hide does NOT cascade to existing flags older
  than the 1h window.** Counter is a sliding window measured on
  flag insertion time; only flags within the last 60 minutes are
  counted. Matches bearings §Mod flow phrasing "5 flags in 1
  hour".
- **No client UI changes this phase.** `<CommentInputStub>` and
  `<CommentThread>` stay as phase 9 shipped them. Phase 13 (mod
  queue) drains the rows; phase 14 / a follow-up wires the
  authed-comment composer.
- **No /community vote-source flip yet** — same reasoning as
  phase 11: there's nothing to display.

## Out of scope

- Authed comment composer (the textarea that becomes available
  once the user signs in). Reuses `<CommentInputStub>` but flips
  to a write form. Tracked as a follow-up phase.
- /mod queue UI (phase 13).
- Markdown rendering for comment body.
- Per-comment vote counts feeding the bearings line 441 "weighted
  vote score" sort — needs phase 11.5 (compute_weighted_rank for
  comments). For now comments sort by created_at desc on display.
- Email notifications on flag (no Resend wiring in v1).

## Mobile reflow / responsive

N/A — backend only. The phase 13 mod queue will own its own
mobile pass.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---|---|
| `src/lib/openai/preFilter.ts` | preFilter.test.ts: fake-stub branches + zod parse + fallback-on-error | covered via /api/comment in comment-backend.spec.ts |
| `src/app/api/comment/route.ts` | none (covered by e2e) | comment-backend.spec.ts cases 1–4, 6 |
| `src/app/api/flag/route.ts` | none (covered by e2e) | comment-backend.spec.ts case 5 |
| RPCs | exercised via /api/* in e2e | — |

## Verify gate

`pnpm verify` — same composition as phase 11. The e2e leg runs
`supabase db reset --no-seed` so the new migrations apply
freshly each run.

## Commit body template

```
feat: comment backend — phase 12

- Migrations: comments + flags + ai_decisions tables, post_comment + flag_comment RPCs.
- preFilter.ts wraps gpt-5-mini structured output; OPENAI_FAKE=1 short-circuit for tests.
- /api/comment rewritten + /api/flag added; auth + rate-limit + new-account hold mapped to status.
- comment-backend.spec.ts walks happy path + spoiler-block + mod-queue + anon rejection + flag + 400 paths.

Decisions:
- <enumerate any further calls made during build>

Closes #<issue>
```

## DoD

- All five migrations apply against a fresh `supabase db reset --no-seed`.
- preFilter.ts: 100% coverage of the fake stub branches; the
  real-call path is mocked.
- `pnpm verify` green (typecheck → unit → content:check → build → e2e).
- Vercel deploy ready on the pushed commit.
- Mirror issue closed via `Closes #<N>` + close-comment.

## Follow-ups (out of scope)

- Phase 13 — Moderation queue page `/mod` (consumes the rows
  this phase writes).
- Markdown rendering for comment body.
- Authed comment composer (textarea wiring; phase 9 shipped only
  the stub).
- compute_weighted_rank() for comments so they sort by weighted
  vote score per bearings line 441.
- Resend email on flag (deferred email path).
