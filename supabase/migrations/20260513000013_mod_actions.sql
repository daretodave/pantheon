-- ABOUT:
--   Creates `public.mod_actions` — the append-only moderator
--   audit ledger.
--   Phase 13 (moderation queue) substrate.
--
--   One row per moderator decision. Each row records who
--   (mod_session_id), what (action), on which target
--   (target_type, target_id), and the optional note. The table
--   is append-only by design — no UPDATE / DELETE policies, no
--   ON CONFLICT recovery, no soft-delete shape. A mod's action
--   history is immutable for accountability.
--
--   `target_id` is a bare uuid with NO foreign-key to
--   `public.comments(id)`. This is intentional: comments may
--   eventually be hard-deleted (GDPR / right-to-be-forgotten),
--   but the audit row must survive that deletion. The audit log
--   is the receipt — it outlives the artifact.
--
--   `target_type` is constrained to 'comment' today; the
--   single-value CHECK leaves room for future target types
--   (votes? users?) without a wide-open text column.
--
--   `action` is constrained to the v1 vocabulary:
--     - approve       → comment status published
--     - hide          → comment status hidden
--     - remove        → comment status removed
--     - unhide        → comment status published (from hidden)
--     - dismiss_flag  → no status change, audit-only
--
--   `note` is an optional free-text moderator comment (e.g.,
--   "obvious spoiler — S2E3 finale reveal"), capped at 500 chars.
--
--   RLS posture:
--     - SELECT: public (bearings — audit visibility on /mod/audit
--       is a future feature; the table shape supports it now,
--       and there's no PII in the rows themselves — session ids
--       and target ids are opaque uuids).
--     - INSERT / UPDATE / DELETE: no policies. The `mod_action()`
--       RPC (SECURITY DEFINER, granted to service_role only) is
--       the sole writer. Direct write attempts from anon /
--       authenticated roles are denied by RLS default.

create table if not exists public.mod_actions (
  id              bigint primary key generated always as identity,
  mod_session_id  uuid not null references public.sessions(id) on delete cascade,
  target_type     text not null check (target_type = 'comment'),
  target_id       uuid not null,
  action          text not null
                    check (action in ('approve', 'hide', 'remove', 'unhide', 'dismiss_flag')),
  note            text check (note is null or char_length(note) <= 500),
  created_at      timestamptz not null default now()
);

-- Per-comment audit — "show me every mod action on this comment,
--   newest first". Drives the per-comment audit panel + the
--   "has any mod touched this?" lookup.
create index if not exists mod_actions_target_created_idx
  on public.mod_actions (target_id, created_at desc);

-- Per-mod activity — "show me this mod's recent actions, newest
--   first". Drives the mod-activity audit view and per-mod
--   rate-of-action metrics.
create index if not exists mod_actions_mod_created_idx
  on public.mod_actions (mod_session_id, created_at desc);

alter table public.mod_actions enable row level security;

-- Idempotency on `db reset`.
drop policy if exists mod_actions_select_public on public.mod_actions;

-- SELECT: public. Audit visibility is a transparency feature —
--   future /mod/audit page reads these rows directly without
--   needing service-role. The columns themselves are opaque
--   (uuids + bounded enums + an optional short note); no PII.
create policy mod_actions_select_public
  on public.mod_actions
  for select
  using (true);

-- No INSERT / UPDATE / DELETE policies. The `mod_action()` RPC
--   (SECURITY DEFINER, GRANT EXECUTE service_role only) is the
--   sole writer; RLS default denies every direct write attempt
--   from anon / authenticated roles. Append-only by construction.
