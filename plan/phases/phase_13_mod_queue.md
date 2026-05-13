# Phase 13 — Moderation queue `/mod`

> **The first RBAC-gated surface.** `/mod` is the only page in
> v1 that requires the Auth0 `mod` role. It drains the comment
> queue (`status in ('pending','hidden')`) and the flag queue
> (`flags` rows joined back to their comments), and every mod
> action writes an immutable row to `mod_actions`.
>
> **Data-steward owns** the `mod_actions` migration + the
> `mod_action()` SECURITY DEFINER RPC. Main agent wires the page,
> the RBAC gate, the action route, and the e2e.

## Goal

By the end of this phase:

- `supabase/migrations/<ts>_mod_actions.sql` adds an append-only
  `mod_actions` table: `id bigint identity, mod_session_id uuid
  fk -> sessions, target_type text check ('comment'),
  target_id uuid, action text check ('approve','hide','remove',
  'unhide','dismiss_flag'), note text null, created_at timestamptz`.
  RLS denies all non-service-role writes; public can SELECT for
  audit visibility on `/mod/audit` (out of scope but the table
  shape supports it).
- `mod_action()` RPC — SECURITY DEFINER. Inputs:
  `(p_session_id uuid, p_comment_id uuid, p_action text, p_note text)`.
  Resolves the session's `auth0_sub`. Checks that the user has
  the mod claim (a NEW `users.is_mod` boolean column added in
  the same migration — populated by a separate migration grant
  for the e2e user; production grants come from Auth0). Maps
  action to a comment status update:
    - `approve` → status='published'
    - `hide` → status='hidden'
    - `remove` → status='removed'
    - `unhide` → status='published'
    - `dismiss_flag` → no status change, just an audit row
  Writes the mod_actions row in the same transaction. Returns
  `(new_status text, action_id bigint)`.
- `src/app/mod/page.tsx` rewrite — server component that:
    - Reads the Auth0 session; if missing → redirect `/sign-in`.
    - Reads the permissions claim. If the `mod:read` permission
      isn't present → 403 `<NotAuthorized>` component.
    - If the user passes the gate: queries Supabase for queue
      items (pending + hidden + most-flagged), renders them in
      a list with action buttons that POST to `/api/mod/action`.
- `src/app/api/mod/action/route.ts` — Zod body validation
  (`commentId`, `action`, `note?`), RBAC gate (same permissions
  check), calls `mod_action()` RPC, returns the new status. 
  Error mapping: 403 on missing role, 400 on validation, 500
  otherwise.
- `apps/e2e/tests/mod-gate.spec.ts` — two cases:
    - anon (no cookie) → /mod redirects to /sign-in (302) or
      shows the "sign in" affordance.
    - authed-but-not-mod (the e2e user) → /mod returns 403
      `not_a_mod`.
  We don't ship a "mod user" e2e cookie this phase. The spec
  documents the gate; queue-drain happy-path tests are deferred
  until we have a mod-fixture grant pipeline (follow-up).

## Outputs

```
supabase/migrations/<ts>_mod_actions.sql
supabase/migrations/<ts>_mod_action_rpc.sql
supabase/migrations/<ts>_users_is_mod.sql           # adds is_mod column

src/app/mod/page.tsx                                # rewrite
src/app/api/mod/action/route.ts                     # new
src/components/mod/ModQueue.tsx                     # new
src/components/mod/ModQueue.client.tsx              # client-side action buttons
src/components/mod/__tests__/ModQueue.test.tsx

src/lib/supabase/mod.ts                             # queue queries + modAction helper
src/lib/supabase/mod.test.ts

src/lib/auth0/permissions.ts                        # claim extraction + check
src/lib/auth0/permissions.test.ts

apps/e2e/tests/mod-gate.spec.ts
apps/e2e/src/fixtures/canonical-urls.ts              # +/mod already present
apps/e2e/src/fixtures/page-reads.ts                  # +/mod reads
```

## Decisions made upfront — DO NOT ASK

- **RBAC source of truth is the Auth0 `permissions` claim**
  (bearings line 116, line 162). The Auth0 Action `Add Pantheon
  claims` injects this claim. The page + route both read it
  via `auth0.getSession()` → `session.user['https://pantheon.app/permissions']`.
  We do NOT consult `users.is_mod` from the page — that column
  is for the RPC's defense in depth only.
- **The mod_action() RPC double-checks `users.is_mod`** even
  though the route handler already gated on the JWT claim. This
  is defense in depth: a leaked service-role key could otherwise
  let an external caller bypass the route handler. The RPC
  refuses the write if `users.is_mod` is false (RAISE 42501).
- **`users.is_mod` is set manually for production** via the
  Supabase SQL editor (matches bearings line 161 "granted
  manually in Auth0 dashboard" — symmetrical operational
  workflow). The e2e user is NOT granted is_mod by default; the
  gate test asserts they're rejected.
- **Permissions claim namespace = `https://pantheon.app/`**
  (bearings line 116, setup/04_auth0.md §H). Permissions value
  is a string array containing entries like `mod:read`,
  `mod:approve`. We check for `mod:read` to enter `/mod`, and
  `mod:approve` / `mod:hide` etc. for individual actions.
  Today both default to "any mod can do any mod thing" — the
  permissions list is just `['mod:read', 'mod:approve',
  'mod:hide', 'mod:remove', 'mod:dismiss_flag']`. Fine-grained
  splits are a follow-up.
- **Queue layout: a single list, ordered by**
  `(coalesce(flag_count, 0) desc, created_at desc)` capped at 50
  rows. Pending + hidden + flagged comments all flow into the
  same view. No pagination — bearings standing decision (no
  pagination under N=50). When/if the queue grows, the
  bearings rule kicks in and we add scroll-fetch in a follow-up.
- **Actions return JSON `{ ok, status }` and the client
  re-fetches the queue.** No optimistic update — mod actions
  are infrequent + low-traffic; a fresh fetch keeps the audit
  view honest.
- **Flagged-but-still-published comments enter the queue.** A
  mod can `dismiss_flag` (audit only, no status change) or take
  the standard hide / remove. This matches bearings §Mod flow
  "drains flag queue" without requiring a separate UI.
- **The `dismiss_flag` action does NOT delete the flag row** —
  it only records an audit row stating the mod looked at the
  flag and decided to leave the comment up. The flag row is
  kept for repeat-flag-pattern analysis.
- **`/mod` SSR; no ISR.** Force-dynamic, no cache. The data is
  per-mod and queue ordering changes every action; ISR is
  inappropriate.
- **noindex remains.** The page is internal — `noIndex: true`
  in metadata, no sitemap entry.
- **No mobile-specific layout this phase.** The queue is a
  rare-use desktop tool. We test the smoke-mobile path doesn't
  break (it currently 200s; that should continue under the new
  page) but no dedicated mobile assertions.
- **e2e mod-fixture-grant pipeline is out of scope.** Granting
  the e2e user temporary mod status (so we could test happy
  paths) would require either a seed-time UPDATE to
  `users.is_mod` + a custom Auth0 claim injection (or a parallel
  fake-session cookie helper). Both are non-trivial. This phase
  validates the GATE (anon rejected + non-mod rejected); queue
  drain happy paths land in a follow-up `mod-drain.spec.ts`
  once we have a fixture helper.

## Out of scope

- `/mod/audit` log view (read-only audit history). Table shape
  supports it; the page is a follow-up.
- Per-permission RBAC splits (today every mod does everything).
- Email notifications on mod action (no Resend wiring in v1).
- Repeat-flag-pattern escalation (≥3 flags on same user_id in
  7 days → /oversight) — that's the `/oversight` skill's job,
  not the mod page.
- Mod-fixture e2e helper that grants the e2e user is_mod for a
  single spec. Follow-up after a /critique pass reveals what
  shape we need.

## Mobile reflow / responsive

The page renders at desktop widths; the only assertion at 375px
is "doesn't horizontal-scroll on the mobile smoke walk" (already
exercised by the existing smoke-mobile.spec.ts catch-all). A
dedicated mod-mobile.spec.ts is deferred — this is a
rare-use-desktop tool.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---|---|
| `src/lib/auth0/permissions.ts` | parses claim variants (string vs array, namespace prefix), returns booleans | covered via mod-gate.spec.ts |
| `src/lib/supabase/mod.ts` | `getQueue()` shape, `modAction()` request mapping | covered via /api/mod/action in e2e (if we add a fixture) |
| `src/components/mod/ModQueue.tsx` | renders empty + populated states; action buttons fire callbacks | none (server component) |
| `src/app/mod/page.tsx` | covered by e2e | mod-gate.spec.ts: anon → 302/sign-in; non-mod → 403 |
| `src/app/api/mod/action/route.ts` | covered by e2e | (deferred — mod-fixture pipeline) |

## Verify gate

`pnpm verify` — same composition. The new `/mod` page is
covered by the existing canonical-urls / smoke walker as well
as the new mod-gate.spec.ts.

## Commit body template

```
feat: moderation queue page /mod — phase 13

- mod_actions migration + mod_action RPC (data-steward).
- /mod server component reads the permissions claim; non-mods get 403, anon redirects to /sign-in.
- /api/mod/action handler with RBAC gate + RPC delegation.
- mod-gate.spec.ts walks anon + non-mod paths.

Decisions:
- <enumerate any further calls made during build>

Closes #<issue>
```

## DoD

- All three migrations apply on a fresh `supabase db reset --no-seed`.
- `/mod` for anon: redirects to /sign-in.
- `/mod` for the authed e2e user (no mod role): 403.
- `pnpm verify` green.
- Vercel deploy ready on the pushed commit.
- Mirror issue closed.

## Follow-ups (out of scope)

- `/mod/audit` history view (immutable log read-only).
- Mod-fixture e2e helper (grants the e2e user temp mod status
  for a single spec) — unblocks queue-drain happy-path tests.
- Repeat-flag-pattern escalation surfaced in `/oversight`.
- Per-permission RBAC splits.
- Email notifications on mod action via Resend.
