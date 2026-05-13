-- ABOUT:
--   Creates `public.post_comment(p_session_id, p_target_type,
--   p_target_id, p_parent_id, p_body, p_verdict, p_categories,
--   p_confidence, p_ai_reason, p_redacted_phrase)` — the sole
--   write path into the comments ledger.
--   Phase 12 (comment backend) substrate.
--
--   Contract (the route handler at /api/comment depends on this
--   verbatim — change with care):
--     call:   post_comment(uuid, text, text, uuid|null, text,
--                          text, text[], numeric, text, text|null)
--     return: table (id uuid, status text, count bigint)
--             - id     — the new comment's uuid
--             - status — effective status after AI verdict +
--                        new-account hold overlay
--             - count  — fresh published-comment count for the
--                        target_id
--
--   Behaviour:
--     1. Validates verdict in ('allow','flag','block'). 22023 on
--        bad input. Also validates target_type + non-empty
--        target_id + body length (mirrors the table CHECK
--        constraints so the route handler gets clean errors).
--     2. Lazy session insert (parity with cast_vote — middleware
--        is supposed to have minted but a cookie-less call should
--        still get a deterministic row rather than a FK violation).
--     3. Reads sessions.auth0_sub. If NULL → 42501 'auth_required'.
--        Anon callers cannot comment (bearings §Identity tiers).
--     4. Rate-limit on the resolved auth0_sub:
--          - >= 5 published+pending comments in last 1h  → 23505
--          - >= 30 in last 24h                            → 23505
--        Counts join comments→sessions on session_id and filter
--        sessions.auth0_sub = the resolved sub, so a user can't
--        sidestep the limit by rotating sessions.
--     5. Look up users row by auth0_sub. New-account hold:
--          - users.created_at > now() - 7 days  OR
--          - fewer than 5 published comments from this sub
--        forces effective_status = 'pending', UNLESS the verdict
--        is 'block' (block always wins so spoilers don't slip
--        through via the new-account path).
--     6. Verdict-to-status mapping (after hold overlay):
--          - block  → hidden
--          - flag   → pending
--          - allow  → published (or pending under hold)
--     7. INSERT the comment row with effective_status. INSERT the
--        ai_decisions row in the same transaction so the audit
--        log is consistent.
--     8. Count published comments for the target_id and return.
--
--   Why SECURITY DEFINER:
--     The comments + ai_decisions tables deny client writes. This
--     RPC + flag_comment are the only paths in. SECURITY DEFINER
--     + GRANT EXECUTE to service_role only means the route handler
--     is the sole caller; anon and authenticated roles can't
--     invoke it directly, so the auth/rate-limit/hold logic
--     above can't be bypassed by hammering PostgREST.

create or replace function public.post_comment(
  p_session_id      uuid,
  p_target_type     text,
  p_target_id       text,
  p_parent_id       uuid,
  p_body            text,
  p_verdict         text,
  p_categories      text[],
  p_confidence      numeric,
  p_ai_reason       text,
  p_redacted_phrase text
)
returns table (id uuid, status text, count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_sub               text;
  v_user_created      timestamptz;
  v_published_count   int;
  v_hour_count        int;
  v_day_count         int;
  v_effective_status  text;
  v_comment_id        uuid;
  v_total             bigint;
begin
  -- 1. Validate inputs. Errors here raise 22023 so the route
  --    handler maps cleanly to HTTP 400 invalid_body.
  if p_verdict is null or p_verdict not in ('allow', 'flag', 'block') then
    raise exception 'invalid_verdict: % (expected allow, flag, or block)', p_verdict
      using errcode = '22023';
  end if;

  if p_target_type is null or p_target_type not in ('season', 'comment') then
    raise exception 'invalid_target_type: % (expected season or comment)', p_target_type
      using errcode = '22023';
  end if;

  if p_target_id is null or length(p_target_id) = 0 or length(p_target_id) > 128 then
    raise exception 'invalid_target_id'
      using errcode = '22023';
  end if;

  if p_body is null or char_length(p_body) < 1 or char_length(p_body) > 4000 then
    raise exception 'invalid_body'
      using errcode = '22023';
  end if;

  if p_confidence is null or p_confidence < 0 or p_confidence > 1 then
    raise exception 'invalid_confidence'
      using errcode = '22023';
  end if;

  -- 2. Ensure the session exists (lazy insert — see cast_vote).
  insert into public.sessions (id)
  values (p_session_id)
  on conflict (id) do nothing;

  -- 3. Resolve auth state. Anon → 42501 auth_required.
  select s.auth0_sub
    into v_sub
    from public.sessions s
   where s.id = p_session_id;

  if v_sub is null then
    raise exception 'auth_required'
      using errcode = '42501';
  end if;

  -- 4. Rate-limit on the resolved sub across all of their
  --    sessions. We count published + pending (the two
  --    "successfully accepted" outcomes) but not hidden, so
  --    a spoiler-block doesn't punish the user's future budget.
  with my_comments as (
    select c.created_at
      from public.comments c
      join public.sessions s on s.id = c.session_id
     where s.auth0_sub = v_sub
       and c.status in ('published', 'pending')
  )
  select
    count(*) filter (where created_at > now() - interval '1 hour'),
    count(*) filter (where created_at > now() - interval '24 hours')
    into v_hour_count, v_day_count
    from my_comments;

  if v_hour_count >= 5 then
    raise exception 'rate_limited: comments/hour'
      using errcode = '23505',
            hint    = 'rate_limited';
  end if;

  if v_day_count >= 30 then
    raise exception 'rate_limited: comments/24h'
      using errcode = '23505',
            hint    = 'rate_limited';
  end if;

  -- 5. New-account hold. Read the users row + per-sub published
  --    count. Either branch (< 7d account OR < 5 published) forces
  --    effective_status = 'pending', except when verdict='block'
  --    (block always wins — spoiler protection trumps soft-launch
  --    convenience).
  select u.created_at
    into v_user_created
    from public.users u
   where u.auth0_sub = v_sub;

  select count(*)
    into v_published_count
    from public.comments c
    join public.sessions s on s.id = c.session_id
   where s.auth0_sub = v_sub
     and c.status = 'published';

  -- 6. Verdict-to-status mapping.
  if p_verdict = 'block' then
    v_effective_status := 'hidden';
  elsif p_verdict = 'flag' then
    v_effective_status := 'pending';
  else
    -- p_verdict = 'allow' — apply new-account hold overlay.
    if v_user_created is null
       or v_user_created > now() - interval '7 days'
       or v_published_count < 5
    then
      v_effective_status := 'pending';
    else
      v_effective_status := 'published';
    end if;
  end if;

  -- 7. Insert the comment + ai_decisions row atomically.
  insert into public.comments (
    parent_id, session_id, target_type, target_id, body, status
  )
  values (
    p_parent_id, p_session_id, p_target_type, p_target_id, p_body, v_effective_status
  )
  returning public.comments.id into v_comment_id;

  insert into public.ai_decisions (
    comment_id, model, verdict, categories, confidence, reason, redacted_phrase
  )
  values (
    v_comment_id,
    coalesce(current_setting('pantheon.ai_model', true), 'gpt-5-mini-2025-08-07'),
    p_verdict,
    coalesce(p_categories, '{}'::text[]),
    p_confidence,
    coalesce(p_ai_reason, ''),
    p_redacted_phrase
  );

  -- 8. Fresh published-comment count for the target.
  select count(*)
    into v_total
    from public.comments c
   where c.target_type = p_target_type
     and c.target_id   = p_target_id
     and c.status      = 'published';

  return query select v_comment_id, v_effective_status, v_total;
end;
$$;

-- Tighten EXECUTE privileges. The route handler is the only
--   caller; it reaches this via the service-role Supabase client.
revoke all on function public.post_comment(
  uuid, text, text, uuid, text, text, text[], numeric, text, text
) from public;
revoke all on function public.post_comment(
  uuid, text, text, uuid, text, text, text[], numeric, text, text
) from anon;
revoke all on function public.post_comment(
  uuid, text, text, uuid, text, text, text[], numeric, text, text
) from authenticated;
grant execute on function public.post_comment(
  uuid, text, text, uuid, text, text, text[], numeric, text, text
) to service_role;
