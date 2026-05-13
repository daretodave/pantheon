-- ABOUT:
--   Creates `public.ai_decisions` — the AI pre-filter audit log.
--   Phase 12 (comment backend) substrate.
--
--   One row per AI verdict, inserted in the same transaction as
--   the comment it scored. Append-only: there is no UPDATE or
--   DELETE path, by design. This table is the answer to "why
--   did this comment land in the mod queue / get blocked?"
--
--   Schema notes:
--     - `model` is the OpenAI model identifier (e.g.
--       'gpt-5-mini-2025-08-07'). Recorded so a future audit
--       can correlate verdict shifts with model changes.
--     - `verdict` is the action — allow / flag / block. The
--       comment's effective status is derived in post_comment()
--       (with the new-account hold overlay).
--     - `categories` is a free text[] from the model's
--       structured-output schema (e.g. {'spoiler_winner'}).
--     - `confidence` is the model's 0..1 self-reported
--       confidence. Recorded but not currently consumed.
--     - `reason` is the model's free-text justification. Surfaced
--       to mods in the queue UI to help them audit decisions.
--     - `redacted_phrase` is the spoiler phrase the model wants
--       redacted from a quoted preview — NULL for verdict='allow'
--       and most flag/block cases.
--
--   RLS posture:
--     - select / insert / update / delete: no policies. The mod
--       queue reads ai_decisions via the service-role client.
--     - service_role bypass means `post_comment()` (SECURITY
--       DEFINER) can write here; nothing else can.

create table if not exists public.ai_decisions (
  id              bigint primary key generated always as identity,
  comment_id      uuid not null references public.comments(id) on delete cascade,
  model           text not null,
  verdict         text not null check (verdict in ('allow', 'flag', 'block')),
  categories      text[] not null default '{}',
  confidence      numeric(4, 3) not null,
  reason          text not null,
  redacted_phrase text,
  created_at      timestamptz not null default now()
);

-- Per-comment listing — mod queue shows the verdict that
--   gated each comment in the queue header. Always at most a
--   handful of rows per comment, but the index makes the lookup
--   index-only.
create index if not exists ai_decisions_comment_id_idx
  on public.ai_decisions (comment_id);

alter table public.ai_decisions enable row level security;

-- No policies. RLS default-denies all client access. service_role
--   bypasses RLS, so `post_comment()` (SECURITY DEFINER + EXECUTE
--   granted to service_role) is the sole writer, and the mod
--   queue page reads via the service-role Supabase client.
--   Append-only is enforced by the absence of an UPDATE / DELETE
--   policy (no anon/authenticated path) AND by convention — the
--   service-role caller must never issue UPDATE / DELETE here.
