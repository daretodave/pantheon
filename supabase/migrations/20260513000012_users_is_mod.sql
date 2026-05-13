-- ABOUT:
--   Adds `is_mod boolean` to `public.users` — the moderator flag
--   read by the `mod_action()` RPC for defense-in-depth.
--   Phase 13 (moderation queue) substrate.
--
--   The page + route gate on the Auth0 `permissions` claim (bearings
--   line 116 / 162). The RPC additionally double-checks
--   `users.is_mod = true` so that a leaked service-role key can't
--   bypass the route handler. Production grants happen in the
--   Supabase SQL editor (bearings line 161 — manual ops symmetry
--   with Auth0 role grants). The e2e user is deliberately NOT
--   granted is_mod; the gate spec asserts the rejection.
--
--   No new RLS policy is needed:
--     - existing `users_select_public` already covers SELECT.
--     - existing `users_update_own` covers user-self UPDATE; the
--       `is_mod` column is server-only (production grants are
--       manual via service-role). A user attempting to flip their
--       own is_mod via the self-update path would still be
--       constrained by application-level column allow-listing
--       (handle / display_name only). Service-role bypasses RLS.
--
--   The partial index keeps the moderator lookup hot — the row
--   count is expected to be tiny (a handful of mods across the
--   site), so a partial `where is_mod = true` is the optimal
--   shape.

alter table public.users
  add column if not exists is_mod boolean not null default false;

-- Partial index — the only meaningful query is
--   "is this auth0_sub a mod?" or "list mods". Both hit
--   is_mod = true; the index excludes the overwhelming majority
--   of non-mod rows.
create index if not exists users_is_mod_idx
  on public.users (auth0_sub)
  where is_mod = true;
