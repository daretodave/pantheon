-- ABOUT:
--   Creates `public.flag_comment(p_session_id, p_comment_id,
--   p_reason)` — the sole write path into the flags ledger.
--   Phase 12 (comment backend) substrate.
--
--   Contract (the route handler at /api/flag depends on this
--   verbatim — change with care):
--     call:   flag_comment(uuid, uuid, text)
--     return: table (flag_count bigint, auto_hidden boolean)
--             - flag_count  — total flags on this comment
--                             (lifetime, not just last 60m)
--             - auto_hidden — true iff this call's insert tripped
--                             the 5-in-1h auto-hide threshold AND
--                             the comment was still 'published'
--
--   Behaviour:
--     1. Validates reason length (1..200). 22023 on bad input.
--     2. Lazy session insert.
--     3. Auth gate: sessions.auth0_sub IS NULL → 42501. Anon
--        callers cannot flag (bearings §Identity tiers — flag
--        reports come with an account, so we can detect reporter
--        abuse).
--     4. Inserts the flag row. ON CONFLICT (comment_id, session_id)
--        DO NOTHING — a session flagging the same comment twice
--        is silently no-op'd; the function still returns the
--        current count and auto_hidden=false.
--     5. Counts flags on this comment in the last 60 minutes.
--        If count >= 5 AND the comment is still status='published',
--        UPDATE the comment to status='hidden' and return
--        auto_hidden=true.
--     6. Returns the lifetime flag count + auto_hidden flag.
--
--   Why SECURITY DEFINER:
--     Same reasoning as post_comment — flags is locked down via
--     RLS default-deny; this RPC is the only path in. GRANT
--     EXECUTE to service_role only.

create or replace function public.flag_comment(
  p_session_id uuid,
  p_comment_id uuid,
  p_reason     text
)
returns table (flag_count bigint, auto_hidden boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sub          text;
  v_recent_count int;
  v_total_count  bigint;
  v_auto_hidden  boolean := false;
  v_was_published boolean;
begin
  -- 1. Validate reason.
  if p_reason is null or char_length(p_reason) < 1 or char_length(p_reason) > 200 then
    raise exception 'invalid_reason'
      using errcode = '22023';
  end if;

  if p_comment_id is null then
    raise exception 'invalid_comment_id'
      using errcode = '22023';
  end if;

  -- 2. Lazy session insert (parity with post_comment / cast_vote).
  insert into public.sessions (id)
  values (p_session_id)
  on conflict (id) do nothing;

  -- 3. Auth gate.
  select s.auth0_sub
    into v_sub
    from public.sessions s
   where s.id = p_session_id;

  if v_sub is null then
    raise exception 'auth_required'
      using errcode = '42501';
  end if;

  -- 4. Insert the flag row. Unique constraint on
  --    (comment_id, session_id) means a duplicate is silently
  --    no-op'd; we still return the live state below.
  insert into public.flags (comment_id, session_id, reason)
  values (p_comment_id, p_session_id, p_reason)
  on conflict (comment_id, session_id) do nothing;

  -- 5. Sliding-window count: flags on this comment in the last
  --    60 minutes. The bearings auto-hide threshold is 5/1h.
  select count(*)
    into v_recent_count
    from public.flags f
   where f.comment_id = p_comment_id
     and f.created_at > now() - interval '60 minutes';

  if v_recent_count >= 5 then
    -- Only auto-hide if the comment is currently 'published'.
    --   Already-hidden (by AI verdict='block' or a prior auto-hide
    --   from this same threshold) doesn't double-fire, and we
    --   never re-hide a 'removed' row (mod action wins).
    update public.comments
       set status = 'hidden'
     where id = p_comment_id
       and status = 'published'
    returning true into v_was_published;

    if found then
      v_auto_hidden := true;
    end if;
  end if;

  -- 6. Lifetime flag count for the response.
  select count(*)
    into v_total_count
    from public.flags f
   where f.comment_id = p_comment_id;

  return query select v_total_count, v_auto_hidden;
end;
$$;

-- Tighten EXECUTE privileges. service_role is the only caller.
revoke all on function public.flag_comment(uuid, uuid, text) from public;
revoke all on function public.flag_comment(uuid, uuid, text) from anon;
revoke all on function public.flag_comment(uuid, uuid, text) from authenticated;
grant execute on function public.flag_comment(uuid, uuid, text) to service_role;
