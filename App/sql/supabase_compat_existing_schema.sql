-- UNITED PADEL — Compatibility Pack for Existing Schema
-- Adapts functions and views to work with your current tables as pasted (2025-08-16).

create extension if not exists "uuid-ossp";

-- 0) Safe helpers
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- 1) Columns / Tables our app expects (non-destructive)
alter table public.matches add column if not exists client_mutation_id text;
create unique index if not exists matches_client_id_uq on public.matches (client_mutation_id) where client_mutation_id is not null;

create table if not exists public.match_sets(
  match_id uuid references public.matches(id) on delete cascade,
  set_number smallint not null check (set_number between 1 and 3),
  t1 smallint not null,
  t2 smallint not null,
  super_tiebreak boolean default false,
  primary key (match_id, set_number)
);

-- Ensure unique participants per match (optional but useful)
do $$ begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='match_players_unique_pair_idx') then
    execute 'create unique index match_players_unique_pair_idx on public.match_players(match_id, user_id)';
  end if;
end $$;

create table if not exists public.elo_history(
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id) on delete set null,
  user_id uuid references public.profiles(id),
  rating_before numeric not null,
  rating_after numeric not null,
  delta numeric not null,
  k_factor int not null,
  margin_multiplier numeric not null,
  created_at timestamptz default now()
);
create index if not exists elo_history_user_idx on public.elo_history (user_id, created_at desc);

create table if not exists public.push_tokens(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz default now()
);

-- 2) Leaderboard view (rebuild)
drop materialized view if exists public.leaderboard_view;
create materialized view public.leaderboard_view as
select
  p.id as user_id,
  p.username,
  p.region,
  p.club_id,
  coalesce(p.rating, 1000) as rating,
  coalesce(p.subscription_tier, 'basic') as subscription_tier,
  p.avatar_url,
  coalesce((select jsonb_agg(ub.badge_id) from public.user_badges ub where ub.profile_id = p.id),'[]'::jsonb) as badges,
  rank() over (order by coalesce(p.rating,1000) desc) as rank
from public.profiles p;

-- 3) Notifications compatibility view (maps to your existing public.notifications)
drop view if exists public.notifications_app cascade;
create view public.notifications_app as
select
  n.id,
  n.type,
  n.user_id as to_user_id,
  coalesce(n.metadata,'{}'::jsonb) || jsonb_build_object('title', n.title, 'message', n.message) as data,
  n.is_read as read,
  n.created_at
from public.notifications n;

-- Make the view updatable for "mark all read"
create or replace function public.notifications_app_upd_trg()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    update public.notifications set
      is_read = coalesce(new.read, public.notifications.is_read)
    where id = new.id;
    return (select
      n.id,
      n.type,
      n.user_id as to_user_id,
      coalesce(n.metadata,'{}'::jsonb) || jsonb_build_object('title', n.title, 'message', n.message) as data,
      n.is_read as read,
      n.created_at
      from public.notifications n where n.id = new.id);
  end if;
  return null;
end $$;

drop trigger if exists trg_notifications_app_upd on public.notifications_app;
create trigger trg_notifications_app_upd
  instead of update on public.notifications_app
  for each row execute function public.notifications_app_upd_trg();

-- 4) RPC: create_match(payload) adapted to your schema
create or replace function public.create_match(payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_match_id uuid := uuid_generate_v4();
  v_type text := payload->>'matchType';
  v_level text := payload->>'matchLevel';
  v_played date := (payload->>'date')::date;
  v_notes text := payload->>'notes';
  v_client_id text := payload->>'client_mutation_id';
  v_team1 uuid[] := array(select jsonb_array_elements_text(payload->'team1')::uuid);
  v_team2 uuid[] := array(select jsonb_array_elements_text(payload->'team2')::uuid);
  v_submitted uuid := auth.uid();
  v_size int := case when v_type='doubles' then 2 else 1 end;
  v_i int;
  opp uuid[];
begin
  if v_submitted is null then raise exception 'not_authenticated' using errcode='28000'; end if;
  if array_length(v_team1,1) != v_size or array_length(v_team2,1) != v_size then raise exception 'invalid_team_size'; end if;
  if exists (select 1 from unnest(v_team1) u join unnest(v_team2) v on u=v) then raise exception 'duplicate_players'; end if;
  if not (v_submitted = any(v_team1) or v_submitted = any(v_team2)) then raise exception 'submitter_not_in_match'; end if;

  insert into public.matches(id, match_type, match_level, played_at, submitted_by, status, client_mutation_id)
    values (v_match_id, v_type, v_level, v_played::timestamptz, v_submitted, 'pending', v_client_id);

  -- players: use your existing match_players schema (team_number)
  foreach v_i in array generate_subscripts(v_team1,1) loop
    insert into public.match_players(match_id, user_id, team_number) values (v_match_id, v_team1[v_i], 1) on conflict do nothing;
  end loop;
  foreach v_i in array generate_subscripts(v_team2,1) loop
    insert into public.match_players(match_id, user_id, team_number) values (v_match_id, v_team2[v_i], 2) on conflict do nothing;
  end loop;

  -- sets
  for v_i in 0..jsonb_array_length(payload->'sets')-1 loop
    declare s jsonb := (payload->'sets')->v_i;
    declare st1 int := (s->>'t1')::int;
    declare st2 int := (s->>'t2')::int;
    declare stb boolean := coalesce((s->>'super_tiebreak')::boolean, false);
    begin
      -- very light validation here (see apply_elo for scoring usage)
      insert into public.match_sets(match_id, set_number, t1, t2, super_tiebreak)
      values (v_match_id, v_i+1, st1, st2, stb);
    end;
  end loop;

  -- confirmations: create rows for all opponents
  opp := case when v_submitted = any(v_team1) then v_team2 else v_team1 end;
  foreach v_i in array generate_subscripts(opp,1) loop
    insert into public.match_confirmations(match_id, user_id, confirmed, rejected)
      values (v_match_id, opp[v_i], false, false)
    on conflict do nothing;
  end loop;

  return v_match_id;
end $$;

-- 5) RPC: record_approval(match_id, approve) mapped to match_confirmations
create or replace function public.record_approval(p_match_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  total int; approvals int; rejections int;
begin
  if uid is null then raise exception 'not_authenticated' using errcode='28000'; end if;

  update public.match_confirmations
     set confirmed = case when p_approve then true else confirmed end,
         rejected  = case when p_approve then false else true end,
         responded_at = now()
   where match_id = p_match_id and user_id = uid;

  select count(*),
         sum(case when confirmed and not coalesce(rejected,false) then 1 else 0 end),
         sum(case when rejected then 1 else 0 end)
    into total, approvals, rejections
    from public.match_confirmations where match_id = p_match_id;

  if rejections > 0 then
    update public.matches set status='rejected' where id = p_match_id;
    return;
  end if;

  if total > 0 and approvals = total then
    update public.matches set status='approved' where id = p_match_id;
    perform public.apply_elo(p_match_id);
  end if;
end $$;

-- 6) RPC: apply_elo(match_id) using profiles.rating (numeric)
create or replace function public.apply_elo(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_match record;
  t1 uuid[]; t2 uuid[];
  r1 numeric; r2 numeric;
  s1 int := 0; s2 int := 0;
  gdiff int := 0;
  mm numeric := 1.0;
  k int;
  winner_team int;
  rec record;
begin
  select * into v_match from public.matches where id = p_match_id for update;
  if not found then raise exception 'not_found'; end if;

  select array_agg(user_id) filter (where team_number=1),
         array_agg(user_id) filter (where team_number=2)
    into t1, t2 from public.match_players where match_id = p_match_id;

  for rec in select * from public.match_sets where match_id = p_match_id order by set_number loop
    if rec.t1 > rec.t2 then s1 := s1 + 1; else s2 := s2 + 1; end if;
    gdiff := gdiff + abs(rec.t1 - rec.t2);
  end loop;

  mm := least(1.4, 1 + gdiff::numeric / 12.0);
  k := case v_match.match_level when 'friendly' then 16 when 'league' then 32 when 'tournament' then 50 else 75 end;
  winner_team := case when s1 > s2 then 1 else 2 end;

  select avg(p.rating) into r1 from public.profiles p where p.id = any(t1);
  select avg(p.rating) into r2 from public.profiles p where p.id = any(t2);
  r1 := coalesce(r1,1000); r2 := coalesce(r2,1000);

  -- inner helper
  perform (
    with params as (
      select t1 as players, r2::numeric as opp union all
      select t2 as players, r1::numeric as opp
    )
    select 1
  );

  -- Team 1 updates
  if winner_team = 1 then
    perform public._elo_update_players(p_match_id, t1, r2::numeric, 1, k, mm);
    perform public._elo_update_players(p_match_id, t2, r1::numeric, 0, k, mm);
  else
    perform public._elo_update_players(p_match_id, t1, r2::numeric, 0, k, mm);
    perform public._elo_update_players(p_match_id, t2, r1::numeric, 1, k, mm);
  end if;

  update public.matches set status='finalized' where id = p_match_id;
  refresh materialized view concurrently public.leaderboard_view;
  return jsonb_build_object('k_factor', k, 'margin_multiplier', mm);
end $$;

create or replace function public._elo_update_players(p_match_id uuid, players uuid[], opp numeric, result int, k int, mm numeric)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid; before numeric; expected numeric; delta numeric; after numeric;
begin
  foreach uid in array players loop
    select rating into before from public.profiles where id = uid for update;
    before := coalesce(before,1000);
    expected := 1 / (1 + power(10, (opp - before) / 400.0));
    delta := round(k * mm * ((case when result=1 then 1 else 0 end) - expected));
    if result=1 and delta < 1 then delta := 1; end if;
    after := before + delta;
    update public.profiles set rating = after where id = uid;
    insert into public.elo_history(match_id, user_id, rating_before, rating_after, delta, k_factor, margin_multiplier)
      values (p_match_id, uid, before, after, delta, k, mm);
  end loop;
end $$;

-- 7) Optional: lightweight policies for new tables (only if RLS is enabled project-wide)
do $$ begin
  if (select relrowsecurity from pg_class where oid = 'public.push_tokens'::regclass) then
    drop policy if exists "manage own push token" on public.push_tokens;
    create policy "manage own push token" on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
