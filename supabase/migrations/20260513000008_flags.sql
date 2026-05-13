-- ABOUT:
--   Creates `public.flags` — the user-reports-comment ledger.
--   Phase 12 (comment backend) substrate.
--
--   One row per (comment, reporting session). A session may
--   flag a given comment at most once — the unique constraint
--   below enforces that, and `flag_comment()` swallows the
--   conflict and returns the current count rather than raising.
--
--   The 5-flags-in-1h auto-hide threshold (per bearings
--   §Moderation flow) is evaluated inside `flag_comment()` at
--   write time. Older flags don't cascade — the counter is a
--   sliding window measured against `created_at`.
--
--   PII posture: `reason` is free user text capped at 200 chars.
--   It's surfaced to mods in the queue UI but never to the
--   reported user.
--
--   RLS posture:
--     - flags are internal. No public SELECT policy. anon /
--       authenticated roles cannot read flags directly; the
--       mod queue page reads via the service-role client.
--     - insert / update / delete: no policies. `flag_comment()`
--       runs as service_role and is the sole writer.

create table if not exists public.flags (
  id          bigint primary key generated always as identity,
  comment_id  uuid not null references public.comments(id) on delete cascade,
  session_id  uuid not null references public.sessions(id) on delete cascade,
  reason      text not null check (char_length(reason) between 1 and 200),
  created_at  timestamptz not null default now(),
  unique (comment_id, session_id)
);

-- Per-comment listing — mod queue reads flags for a target
--   comment in reverse-chronological order. Also serves the
--   sliding-window count inside `flag_comment()` (count where
--   comment_id=? AND created_at > now() - 1h).
create index if not exists flags_comment_created_idx
  on public.flags (comment_id, created_at desc);

-- Per-session listing — "flags I've filed" + reporter abuse
--   detection (a session filing N flags / minute is suspect).
create index if not exists flags_session_id_idx
  on public.flags (session_id);

alter table public.flags enable row level security;

-- No policies whatsoever. RLS default-denies SELECT / INSERT /
--   UPDATE / DELETE for anon + authenticated roles. service_role
--   bypasses RLS, which is how `flag_comment()` (SECURITY
--   DEFINER) and the mod queue page reach this table.
