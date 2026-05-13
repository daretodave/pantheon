-- ABOUT:
--   Creates `public.mod_action(p_session_id, p_comment_id,
--   p_action, p_note)` — the sole write path into the
--   mod_actions ledger AND the only sanctioned way to change a
--   comment's status from a moderator decision.
--   Phase 13 (moderation queue) substrate.
--
--   Contract (the route handler at /api/mod/action depends on
--   this verbatim — change with care):
--     call:   mod_action(uuid, uuid, text, text|null)
--     return: table (new_status text, action_id bigint)
--             - new_status — the comment's effective status after
--                            the action (unchanged for
--                            'dismiss_flag')
--             - action_id  — the mod_actions row primary key
--
--   Behaviour:
--     1. Validate p_action in ('approve','hide','remove','unhide',
--        'dismiss_flag'). 22023 on bad input.
--     2. Lazy session insert (parity with post_comment /
--        cast_vote / flag_comment).
--     3. Resolve sessions.auth0_sub. NULL → 42501 'auth_required'.
--     4. Look up users by auth0_sub. is_mod = false (or row
--        missing) → 42501 'not_a_mod'. This is defense in depth:
--        even with the table's service-role bypass, the RPC
--        refuses if the actor lacks is_mod. A leaked service-role
--        key calling mod_action() directly still can't moderate.
--     5. Confirm the comment exists. NOT FOUND → 22023
--        'comment_not_found'.
--     6. Map action → status update:
--          - approve       → status='published'
--          - hide          → status='hidden'
--          - remove        → status='removed'
--          - unhide        → status='published'
--          - dismiss_flag  → no UPDATE (audit-only)
--        Use RETURNING to capture the post-update status in a
--        single round-trip. For dismiss_flag, re-select the
--        current status.
--     7. INSERT the mod_actions row with target_type='comment'
--        in the same transaction. RETURNING id → action_id.
--     8. RETURN (new_status, action_id).
--
--   Why SECURITY DEFINER:
--     mod_actions denies all non-service-role writes (RLS default
--     deny + no INSERT policy). This RPC + GRANT EXECUTE to
--     service_role only means the route handler is the sole
--     caller. The double-check on users.is_mod (step 4) layers
--     application-level enforcement on top of RBAC.

create or replace function public.mod_action(
  p_session_id uuid,
  p_comment_id uuid,
  p_action     text,
  p_note       text
)
returns table (new_status text, action_id bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_sub          text;
  v_is_mod       boolean;
  v_exists       boolean;
  v_new_status   text;
  v_action_id    bigint;
begin
  -- 1. Validate action vocabulary.
  if p_action is null
     or p_action not in ('approve', 'hide', 'remove', 'unhide', 'dismiss_flag')
  then
    raise exception 'invalid_action: % (expected approve, hide, remove, unhide, or dismiss_flag)', p_action
      using errcode = '22023';
  end if;

  if p_comment_id is null then
    raise exception 'invalid_comment_id'
      using errcode = '22023';
  end if;

  -- 2. Lazy session insert (parity with post_comment / cast_vote
  --    / flag_comment).
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

  -- 4. Defense in depth: refuse if users.is_mod is not true.
  --    Missing user row is treated the same as is_mod=false —
  --    we only moderate as an upserted, mod-flagged user.
  select u.is_mod
    into v_is_mod
    from public.users u
   where u.auth0_sub = v_sub;

  if v_is_mod is null or v_is_mod = false then
    raise exception 'not_a_mod'
      using errcode = '42501';
  end if;

  -- 5. Confirm the comment exists. We don't need the row data;
  --    a thin existence check is enough, and the UPDATE in
  --    step 6 will also key on id.
  select true
    into v_exists
    from public.comments c
   where c.id = p_comment_id;

  if not found then
    raise exception 'comment_not_found'
      using errcode = '22023';
  end if;

  -- 6. Action → status mapping. Use RETURNING to capture the
  --    post-update status in a single round-trip for the
  --    state-changing actions; re-select for dismiss_flag.
  if p_action = 'approve' then
    update public.comments
       set status = 'published'
     where id = p_comment_id
    returning public.comments.status into v_new_status;
  elsif p_action = 'hide' then
    update public.comments
       set status = 'hidden'
     where id = p_comment_id
    returning public.comments.status into v_new_status;
  elsif p_action = 'remove' then
    update public.comments
       set status = 'removed'
     where id = p_comment_id
    returning public.comments.status into v_new_status;
  elsif p_action = 'unhide' then
    update public.comments
       set status = 'published'
     where id = p_comment_id
    returning public.comments.status into v_new_status;
  else
    -- dismiss_flag — no status change, just record the audit.
    select c.status
      into v_new_status
      from public.comments c
     where c.id = p_comment_id;
  end if;

  -- 7. Append the audit row in the same transaction.
  insert into public.mod_actions (
    mod_session_id, target_type, target_id, action, note
  )
  values (
    p_session_id, 'comment', p_comment_id, p_action, p_note
  )
  returning public.mod_actions.id into v_action_id;

  -- 8. Return the post-action status + audit id.
  return query select v_new_status, v_action_id;
end;
$$;

-- Tighten EXECUTE privileges. The route handler is the only
--   caller; it reaches this via the service-role Supabase client.
revoke all on function public.mod_action(uuid, uuid, text, text) from public;
revoke all on function public.mod_action(uuid, uuid, text, text) from anon;
revoke all on function public.mod_action(uuid, uuid, text, text) from authenticated;
grant execute on function public.mod_action(uuid, uuid, text, text) to service_role;
