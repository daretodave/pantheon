-- ABOUT:
--   Adds a clean integer `raw_count` to `cast_vote` and
--   `read_vote` so the per-season VotePair can stop displaying
--   the weighted aggregate (SUM(value*weight)) as if it were a
--   count of votes.
--
--   Issue #64: the pill showed "0.2 votes" on first visit and
--   blipped "0.2 -> 1.2 -> 0.45" / "-0.55" on click. Root cause:
--   `count` is SUM(value*weight) — a fractional ranking signal
--   (anon weight 0.10, new-account 0.25, full 1.00). Adding an
--   optimistic +/-1 onto a weighted base can never reconcile,
--   so every click leaked the weighting internals into the UI.
--
--   `raw_count` = SUM(value) — the unweighted integer net (up
--   minus down). The optimistic +/-1 the client applies now
--   matches the server delta exactly, so the blips disappear
--   and the number is always a clean integer.
--
--   `count` (weighted) is retained on both contracts for ranking
--   diagnostics; the route handler now sends `raw_count` as the
--   client-facing number and never exposes the weighted value.
--
--   Return signatures change (a new OUT column), so both
--   functions are dropped and recreated rather than CREATE OR
--   REPLACEd. Bodies are otherwise verbatim from
--   20260513000005_cast_vote_rpc.sql and
--   20260513000016_read_vote_rpc.sql. EXECUTE posture is
--   reasserted (service_role only — the route handler is the
--   sole caller).

drop function if exists public.read_vote(uuid, text, text);

create function public.read_vote(
  p_session_id  uuid,
  p_target_type text,
  p_target_id   text
)
returns table (value smallint, count numeric, raw_count bigint)
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
    ) as count,
    coalesce(
      (
        select sum(v.value)::bigint
          from public.votes v
         where v.target_type = p_target_type
           and v.target_id   = p_target_id
      ),
      0::bigint
    ) as raw_count;
end;
$$;

revoke all on function public.read_vote(uuid, text, text) from public;
revoke all on function public.read_vote(uuid, text, text) from anon;
revoke all on function public.read_vote(uuid, text, text) from authenticated;
grant execute on function public.read_vote(uuid, text, text) to service_role;

drop function if exists public.cast_vote(uuid, text, text, smallint);

create function public.cast_vote(
  p_session_id  uuid,
  p_target_type text,
  p_target_id   text,
  p_value       smallint
)
returns table (value smallint, weight numeric, count numeric, raw_count bigint, persisted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub        text;
  v_age_days   int;
  v_weight     numeric;
  v_session_count int;
  v_total      numeric;
  v_raw        bigint;
begin
  if p_value is null or p_value not in (-1, 0, 1) then
    raise exception 'invalid_vote_value: % (expected -1, 0, or 1)', p_value
      using errcode = '22023';
  end if;

  if p_target_type is null or p_target_type not in ('season', 'comment') then
    raise exception 'invalid_target_type: % (expected season or comment)', p_target_type
      using errcode = '22023';
  end if;

  if p_target_id is null or p_target_id = '' then
    raise exception 'invalid_target_id: empty'
      using errcode = '22023';
  end if;

  insert into public.sessions (id)
  values (p_session_id)
  on conflict (id) do nothing;

  select s.auth0_sub
    into v_sub
    from public.sessions s
   where s.id = p_session_id;

  if v_sub is null then
    v_weight := 0.100;
  else
    select extract(day from now() - u.created_at)::int
      into v_age_days
      from public.users u
     where u.auth0_sub = v_sub;

    if v_age_days is null then
      v_weight := 0.250;
    elsif v_age_days < 7 then
      v_weight := 0.250;
    else
      v_weight := 1.000;
    end if;
  end if;

  select count(*)
    into v_session_count
    from public.votes v
   where v.session_id = p_session_id
     and v.created_at > now() - interval '24 hours';

  if v_sub is null and v_session_count >= 100 then
    raise exception 'rate_limited: anon session over 100 votes / 24h'
      using errcode = '23505',
            hint    = 'brigade-limit-exceeded';
  elsif v_sub is not null and v_session_count >= 1000 then
    raise exception 'rate_limited: authed session over 1000 votes / 24h'
      using errcode = '23505',
            hint    = 'brigade-limit-exceeded';
  end if;

  insert into public.votes (session_id, target_type, target_id, value, weight)
  values (p_session_id, p_target_type, p_target_id, p_value, v_weight)
  on conflict (session_id, target_type, target_id) do update
    set value      = excluded.value,
        weight     = excluded.weight,
        updated_at = now();

  select coalesce(sum(v.value::numeric * v.weight), 0),
         coalesce(sum(v.value)::bigint, 0::bigint)
    into v_total, v_raw
    from public.votes v
   where v.target_type = p_target_type
     and v.target_id   = p_target_id;

  return query select p_value, v_weight, v_total, v_raw, true;
end;
$$;

revoke all on function public.cast_vote(uuid, text, text, smallint) from public;
revoke all on function public.cast_vote(uuid, text, text, smallint) from anon;
revoke all on function public.cast_vote(uuid, text, text, smallint) from authenticated;
grant execute on function public.cast_vote(uuid, text, text, smallint) to service_role;
