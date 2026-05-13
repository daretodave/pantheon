-- Pantheon seed.sql — applied after `supabase db reset` on every
-- e2e run. Intentionally minimal: the migrations are the source of
-- truth for schema; seed only carries values needed for local boot.
--
-- Phase 10 added the `sessions` table (anon-first cookie sessions).
-- Phase 11 added `users` + `votes` + the `cast_vote` RPC.
-- Phase 12 added `comments` + `flags` + `ai_decisions` + the
--   `post_comment` / `flag_comment` RPCs.
-- No pre-seeded rows — every visitor mints their own session, every
-- user is upserted on first sign-in — but we probe each table here
-- so a missing/broken migration trips this seed step rather than
-- the first runtime query.

-- Sanity check: Postgres is responding.
select now();

-- Sanity probe: phase-10 sessions table exists and is queryable.
select count(*) as sessions_row_count from public.sessions;

-- Sanity probe: phase-11 users + votes tables exist and queryable.
select count(*) as users_row_count from public.users;
select count(*) as votes_row_count from public.votes;

-- Sanity probe: phase-12 comments + flags + ai_decisions exist.
select count(*) as comments_row_count from public.comments;
select count(*) as flags_row_count from public.flags;
select count(*) as ai_decisions_row_count from public.ai_decisions;
