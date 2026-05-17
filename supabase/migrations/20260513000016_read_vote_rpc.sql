-- ABOUT:
--   Creates `public.read_vote(p_session_id, p_target_type,
--   p_target_id)` — the read sibling of `cast_vote`.
--   Phase 35 stage 3 (VotePair correctness — the read-back path).
--
--   Contract (the GET handler at /api/vote depends on this
--   verbatim — change with care):
--     call:   read_vote(uuid, text, text)
--     return: table (value smallint, count numeric)
--             - value — this session's current vote on the
--                       target (-1/0/1); 0 when the session has
--                       never voted (or p_session_id is null).
--             - count — the fresh aggregate SUM(value*weight)
--                       over the target, identical in shape to
--                       cast_vote's `count`. Independent of the
--                       session, so an anon visitor with no
--                       cookie still sees the true net.
--
--   Why this exists: VotePair previously had no read path. On
--   refresh it always rendered the static `initialCount` (0)
--   with no notion of "my current vote", so the persisted net
--   never came back and a re-click looked like it drove the
--   net the wrong way. This RPC is the single round-trip the
--   client needs on mount.
--
--   Why SECURITY DEFINER: mirrors cast_vote's privilege posture.
--   The votes table grants public SELECT, but routing the
--   read through a service_role-only RPC keeps the read path
--   symmetrical with the write path and lets the route handler
--   stay the sole caller (one client, one privilege story).

create or replace function public.read_vote(
  p_session_id  uuid,
  p_target_type text,
  p_target_id   text
)
returns table (value smallint, count numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_target_type is null or p_target_type not in ('season', 'comment') then
    raise exception 'invalid_target_type: % (expected season or comment)', p_target_type
      using errcode = '22023';
  end if;

  if p_target_id is null or p_target_id = '' then
    raise exception 'invalid_target_id: empty'
      using errcode = '22023';
  end if;

  return query
  select
    coalesce(
      (
        select v.value
          from public.votes v
         where v.session_id  = p_session_id
           and v.target_type = p_target_type
           and v.target_id   = p_target_id
      ),
      0::smallint
    ) as value,
    coalesce(
      (
        select sum(v.value::numeric * v.weight)
          from public.votes v
         where v.target_type = p_target_type
           and v.target_id   = p_target_id
      ),
      0
    ) as count;
end;
$$;

-- Same tight EXECUTE posture as cast_vote: the route handler is
--   the only caller, reaching this via the service-role client.
revoke all on function public.read_vote(uuid, text, text) from public;
revoke all on function public.read_vote(uuid, text, text) from anon;
revoke all on function public.read_vote(uuid, text, text) from authenticated;
grant execute on function public.read_vote(uuid, text, text) to service_role;
