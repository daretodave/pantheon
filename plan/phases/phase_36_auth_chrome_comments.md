# Phase 36 — Auth-state chrome + comment read/display

> Same root cause as phase 35, different surface. The **write**
> paths work (sign-in mints a session; `post_comment()` stores
> the comment). The **read/reflect** paths on statically
> rendered pages don't exist, so:
>
> - Signed in (`__session` cookie set, comments post fine) but
>   the header still says "Sign in".
> - A posted comment returns `{"ok":true,"status":"pending",
>   "verdict":"allow"}` but the thread says "No comments yet",
>   and refresh shows nothing.
>
> Phase 36 makes auth state and comments **real on the page**.
> Sits after phase 35 (or pull it ahead — it is the smaller,
> higher-trust fix; user's call. See build-plan note.).

## Mandate (read this first)

**You are the data admin** and **be bold with routes.** Per
`bearings.md` §Database posture (v1 experiment): full authority
over Supabase — RLS, RPCs, a "my own pending" read function,
migrations, all without confirmation. If the cleanest fix is a
new endpoint (`/api/auth/me`, a comments read route), a route
group change, or making a segment dynamic — do it. Only the
standing rules and the **spoiler P0 rule** are hard
constraints (comment display must respect the spoiler/mod
posture — never surface `hidden`/`removed`/blocked content to
the public).

## The bugs this closes (user-reported, live)

1. Logged in (cookie present, commenting works server-side)
   but the header pill still reads "Sign in". → `Header` *does*
   call `auth0.getSession()` (`src/components/chrome/
   Header.tsx`), but the show/season routes are SSG/ISR, so
   the header is rendered once at build with **no request
   cookies** → permanently signed-out chrome.
2. Comment POST succeeds (`status:"pending"`) but the thread
   shows "No comments yet"; refresh shows nothing;
   `/shows/survivor/season/gabon` "has a comment" yet renders
   empty. → Two issues stacked:
   a. **No comment read path.** The season page never queries
      Supabase for the thread (`CommentThread` is fed
      `count=0`, no children — same hole as votes/community).
   b. **RLS hides pending from its own author.** `comments`
      RLS is `select using (status = 'published')`; a
      new-account / AI-flagged comment is `pending`, so even
      the author who just posted it cannot see it →
      "No comments yet" after a *successful* post is a
      trust-killer.

## Scope

Land across as many commits/ticks as needed. Internal
sequence (collapse/split as the work dictates):

### A. Auth-state chrome on static routes

- Make the header reflect the real session everywhere,
  including SSG/ISR show + season pages. Be bold about the
  mechanism — recommended: a tiny client auth-state island in
  the header lockup that hydrates from a lightweight
  **`GET /api/auth/me`** (returns `{ signedIn, handle }` from
  the Auth0 session, `Cache-Control: private, no-store`).
  Server-render best-effort where the route is already
  dynamic; the client island corrects SSG output post-hydration
  so the pill flips to the account state without a full
  dynamic re-render of the show page.
- Confirm the cookie name the chrome reads matches what
  sign-in actually sets (`__session` per
  `scripts/mint-e2e-cookie.mjs` / the v4 SDK). If the user's
  observed "`_session`" is a real mismatch, fix it; if it's
  loose phrasing, document the actual name in the brief
  follow-up. Don't guess — verify against the SDK.
- `/u/[handle]` "your account" affordance reflects the same
  state.

### B. Comment read path

- Season page (`src/app/shows/[show]/season/[slug]/page.tsx`)
  and `/u/[handle]` read `status='published'` comments
  server-side and render them through `CommentThread` with a
  real `count` + children (sorted per `bearings.md` §Standing
  decisions: weighted score desc, then newest; honor the
  `≥ −2` auto-collapse threshold). Choose ISR-with-revalidate
  or a client hydration fetch — your call (data admin / bold);
  refresh must show truth.
- Fix the empty-state: after a successful post the thread
  never reads "No comments yet" (see C).

### C. Author sees their own held comment

- A signed-in author must see the comment they just posted,
  even while `pending`, with an honest **"held for review"**
  affordance (the phase-12 new-account 5-comment hold +
  AI-flag posture — surface it, don't hide it). Public
  viewers still only see `published` (RLS unchanged for the
  public path; spoiler/mod P0 intact).
- Mechanism is yours: a service-role read scoped to
  `requester's session/auth-sub → their own non-published
  rows`, merged into the thread above the published list; or
  an optimistic client append on `{ok:true}` reconciled on
  next load. Whichever you pick, `hidden`/`removed`/AI-`block`
  comments are **never** shown to anyone on the public page
  (mod queue only) — spoiler/abuse P0.
- Copy: a posted-but-held comment reads as held for review
  (matter-of-fact, per the voice), not as failure or as
  "no comments yet".

## Tests (usual rules)

- Unit: header auth-state island (signed-in vs anon render);
  comment sort + collapse-threshold helper; "own pending
  visible to author, invisible to public" access logic.
- e2e (hermetic, both critique passes — the harness already
  mints the authed `__session`):
  - **anon pass:** header shows "Sign in"; published comment
    on the seeded season renders; pending/hidden never appear.
  - **authed pass:** header shows the account chrome (the
    bug); post a comment → it appears immediately as
    *held for review* (the bug); a published comment renders;
    refresh preserves both.
  - Seed `supabase/seed.sql` with one `published` and one
    `pending` comment on a known season so both paths are
    deterministic.
- a11y gate (phase 18) extended to the new header control.

## Acceptance

- Signed-in users see account chrome in the header on
  **every** route incl. SSG show/season pages; anon sees
  "Sign in". No more "signed in but header says sign in".
- A posted comment is visible to its author immediately
  (held-for-review state where applicable); published
  comments render in the thread; refresh shows truth;
  `/shows/survivor/season/gabon` shows its comment.
- Public never sees `pending`/`hidden`/`removed`/blocked
  content (spoiler + mod P0 verified in e2e).
- `pnpm verify` green each commit; `deploy:check` green.
  Build-plan `[x] Phase 36` on completion.

## Out of scope

- Community/vote counters → **phase 35**.
- Comment editing/deletion UI, threaded replies, reactions —
  not reported, separate `/expand` candidates.
- Changing the moderation model (the phase-12/13 AI
  pre-filter + mod queue stays exactly as is; this phase only
  makes the *author's own* held comment visible *to them* and
  publishes the read path for already-`published` rows).
