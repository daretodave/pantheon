-- ABOUT:
--   Creates `public.comments` — the comment ledger.
--   Phase 12 (comment backend) substrate.
--
--   Every comment is one row. A reply is a comment whose
--   target is another comment (`target_type='comment'`,
--   `target_id` = parent comment uuid as text). This mirrors
--   the votes vocabulary deliberately: one opaque text key
--   space across both ledgers (`<show>:<season>` for season
--   targets, the comment uuid for comment targets), so the
--   /api/comment + /api/vote routes share validation shape.
--
--   `parent_id` is the convenience pointer for thread display
--   (top-level comments have NULL parent_id; a reply has the
--   parent uuid). It's redundant with (target_type='comment',
--   target_id=<parent uuid>) but cheap and lets the read path
--   render a tree without re-parsing target_id text.
--
--   `body_hash` is a generated column over `md5(lower(trim(body)))`,
--   used solely for the dedup unique constraint. It's never
--   read by the app. The intent (per bearings §Anti-abuse) is
--   to swallow accidental double-submits — the same session
--   posting the same body to the same target within a short
--   window is almost certainly a network retry, not deliberate.
--
--   status state machine:
--     'published'  — visible publicly
--     'pending'    — held by AI verdict='flag' OR new-account
--                    hold OR autohide=false flag count
--     'hidden'     — AI verdict='block' OR flag count >= 5 in 1h
--                    OR mod action
--     'removed'    — mod action (soft-deleted; row kept for
--                    audit + the parent thread shape)
--
--   spoiler_score is reserved for a future ML pass that scores
--   how-spoiler-y a body is (0..1); v1 leaves it NULL.
--
--   RLS posture:
--     - select: public, but only `status = 'published'` rows
--       are visible to anon/authenticated. Mod queue reads
--       (pending/hidden/removed) flow via service_role.
--     - insert / update / delete: no policies. All writes flow
--       through `post_comment()` (SECURITY DEFINER, service_role
--       only). RLS therefore denies every direct write attempt
--       by anon / authenticated roles.

create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.comments(id) on delete set null,
  session_id    uuid not null references public.sessions(id) on delete cascade,
  target_type   text not null check (target_type in ('season', 'comment')),
  target_id     text not null check (length(target_id) between 1 and 128),
  body          text not null check (char_length(body) between 1 and 4000),
  body_hash     text generated always as (md5(lower(trim(body)))) stored,
  status        text not null default 'published'
                  check (status in ('published', 'pending', 'hidden', 'removed')),
  spoiler_score numeric(4, 3),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (session_id, target_type, target_id, body_hash)
);

-- Composite index for the public read path
--   (list comments WHERE target_type=? AND target_id=? AND
--    status='published' ORDER BY created_at). The status column
--   is third so the index also serves the mod queue's
--   (target_type, target_id, status=<any non-published>) scans.
create index if not exists comments_target_status_idx
  on public.comments (target_type, target_id, status);

-- Per-session listing — "comments I posted" plus the rate-limit
--   sliding window (count by session within last 1h / 24h).
create index if not exists comments_session_created_idx
  on public.comments (session_id, created_at desc);

-- Thread-tree traversal: descend from a parent into its replies.
--   Partial index because most rows are top-level (parent_id NULL).
create index if not exists comments_parent_id_idx
  on public.comments (parent_id)
  where parent_id is not null;

alter table public.comments enable row level security;

-- Idempotency on `db reset`.
drop policy if exists comments_select_published on public.comments;

-- SELECT: only published comments are visible to anon /
--   authenticated. The mod queue page reads pending/hidden/removed
--   via the service-role Supabase client (bypasses RLS).
create policy comments_select_published
  on public.comments
  for select
  using (status = 'published');

-- No INSERT / UPDATE / DELETE policies. `post_comment()` runs as
--   service_role (via SECURITY DEFINER + GRANT EXECUTE) and so
--   bypasses RLS for the write path. Any direct write attempt
--   from anon / authenticated roles is denied by RLS default.

-- Trigger: bump updated_at on every UPDATE. Mod actions
--   (status='hidden'|'removed') and edits (future phase) both
--   need a fresh updated_at without the route handler having
--   to remember to set it.
create or replace function public.comments_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists comments_updated_at on public.comments;

create trigger comments_updated_at
  before update on public.comments
  for each row
  execute function public.comments_set_updated_at();
