-- UNITED PADEL — FULL SQL (schema + policies + functions + seeds) — FIXED
-- NOTE: Replaces unsupported `CREATE POLICY IF NOT EXISTS` with DROP+CREATE.
--       Adds DROP IF EXISTS for triggers & materialized view for idempotency.

create extension if not exists "uuid-ossp";

-- Utility: updated_at trigger function
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =====================
-- SCHEMA
-- =====================

-- profiles
create table if not exists profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  email text,
  region text,
  club_id uuid,
  rating int not null default 1000,
  subscription_tier text check (subscription_tier in ('free','individual_plus','club_plus','elite')) default 'free',
  avatar_url text,
  gender text check (gender in ('male','female','other')) null,
  birthdate date,
  badges jsonb not null default '[]'::jsonb,
  streak_days int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists profiles_rating_idx on profiles (rating desc);
drop trigger if exists profiles_updated on profiles;
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

-- clubs
create table if not exists clubs(
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  tier text not null check (tier in ('free','plus','elite')) default 'free',
  region text,
  logo_url text,
  owner_id uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists clubs_updated on clubs;
create trigger clubs_updated before update on clubs for each row execute function set_updated_at();

-- matches
create table if not exists matches(
  id uuid primary key default uuid_generate_v4(),
  match_type text not null check (match_type in ('singles','doubles')),
  match_level text not null check (match_level in ('friendly','league','tournament','nationals')),
  played_at date not null,
  submitted_by uuid not null references auth.users(id),
  tournament_id uuid null,
  status text not null check (status in ('pending','approved','rejected','finalized')) default 'pending',
  notes text,
  client_mutation_id text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists matches_client_id_uq on matches (client_mutation_id) where client_mutation_id is not null;
drop trigger if exists matches_updated on matches;
create trigger matches_updated before update on matches for each row execute function set_updated_at();

-- players per match
create table if not exists match_players(
  match_id uuid references matches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  team smallint not null check (team in (1,2)),
  primary key (match_id, user_id)
);
create index if not exists match_players_match_team_idx on match_players (match_id, team);

-- set scores
create table if not exists match_sets(
  match_id uuid references matches(id) on delete cascade,
  set_number smallint not null check (set_number between 1 and 3),
  t1 smallint not null, t2 smallint not null,
  super_tiebreak boolean default false,
  primary key (match_id, set_number)
);

-- approvals
create table if not exists match_approvals(
  match_id uuid references matches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  responded boolean default false,
  approved boolean,
  responded_at timestamptz,
  primary key (match_id, user_id)
);

-- elo history
create table if not exists elo_history(
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete set null,
  user_id uuid references auth.users(id),
  rating_before int not null,
  rating_after int not null,
  delta int not null,
  k_factor int not null,
  margin_multiplier numeric not null,
  created_at timestamptz default now()
);
create index if not exists elo_history_user_idx on elo_history (user_id, created_at desc);

-- badges
create table if not exists badges(
  id text primary key, name text not null, description text not null, icon_url text,
  created_at timestamptz default now()
);
create table if not exists user_badges(
  user_id uuid references auth.users(id) on delete cascade,
  badge_id text references badges(id),
  awarded_at timestamptz default now(),
  primary key (user_id, badge_id)
);

-- tournaments
create table if not exists tournaments(
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('knockout','league','group')),
  club_id uuid references clubs(id),
  created_by uuid references auth.users(id),
  status text not null check (status in ('draft','upcoming','live','completed','cancelled')) default 'draft',
  starts_at timestamptz, ends_at timestamptz,
  is_elite_only boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
drop trigger if exists tournaments_updated on tournaments;
create trigger tournaments_updated before update on tournaments for each row execute function set_updated_at();

-- tournament participants
create table if not exists tournament_participants(
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade,
  team uuid[] not null,
  check (cardinality(team) in (1,2))
);
create index if not exists tparts_tournament_idx on tournament_participants (tournament_id);

-- fixtures
create table if not exists fixtures(
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round int not null,
  scheduled_at timestamptz,
  team1 uuid[] not null,
  team2 uuid[] not null,
  status text not null check (status in ('scheduled','in_progress','completed','walkover','cancelled')) default 'scheduled',
  match_id uuid null references matches(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists fixtures_round_idx on fixtures (tournament_id, round);
drop trigger if exists fixtures_updated on fixtures;
create trigger fixtures_updated before update on fixtures for each row execute function set_updated_at();

-- notifications
create table if not exists notifications(
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  to_user_id uuid not null references auth.users(id),
  data jsonb not null,
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists notif_user_idx on notifications (to_user_id, created_at desc);

-- push tokens
create table if not exists push_tokens(
  user_id uuid primary key references auth.users(id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz default now()
);

-- subscriptions
create table if not exists subscriptions(
  id uuid primary key default uuid_generate_v4(),
  subject_type text not null check (subject_type in ('user','club')),
  subject_id uuid not null,
  product_id text not null,
  source text not null check (source in ('iap_ios','iap_android','stripe')),
  status text not null check (status in ('active','past_due','cancelled','expired')),
  current_period_end timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists subs_subject_idx on subscriptions (subject_type, subject_id);

-- leaderboard view (reset to avoid IF NOT EXISTS issues)
drop materialized view if exists leaderboard_view;
create materialized view leaderboard_view as
select 
  p.id as user_id, p.username, p.region, p.club_id, p.rating, p.subscription_tier, p.avatar_url,
  coalesce((select jsonb_agg(ub.badge_id) from user_badges ub where ub.user_id = p.id),'[]'::jsonb) as badges,
  rank() over (order by p.rating desc) as rank
from profiles p;

-- =====================
-- RLS + POLICIES
-- =====================
alter table profiles enable row level security;
alter table clubs enable row level security;
alter table matches enable row level security;
alter table match_players enable row level security;
alter table match_sets enable row level security;
alter table match_approvals enable row level security;
alter table elo_history enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table tournaments enable row level security;
alter table tournament_participants enable row level security;
alter table fixtures enable row level security;
alter table notifications enable row level security;
alter table push_tokens enable row level security;
alter table subscriptions enable row level security;

-- profiles
drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles for select using (true);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- matches
drop policy if exists "insert match" on matches;
create policy "insert match" on matches for insert with check (auth.role() = 'authenticated');

drop policy if exists "select match if participant" on matches;
create policy "select match if participant" on matches for select using (
  submitted_by = auth.uid() or id in (select match_id from match_players where user_id = auth.uid())
);

drop policy if exists "update own pending match" on matches;
create policy "update own pending match" on matches for update using (submitted_by = auth.uid());

-- match_players
drop policy if exists "select match_players" on match_players;
create policy "select match_players" on match_players for select using (true);

drop policy if exists "write match_players if owner" on match_players;
create policy "write match_players if owner" on match_players for all using (
  exists(select 1 from matches m where m.id = match_id and m.submitted_by = auth.uid())
);

-- notifications
drop policy if exists "read own notifications" on notifications;
create policy "read own notifications" on notifications for select using (to_user_id = auth.uid());

drop policy if exists "insert notifications (service)" on notifications;
create policy "insert notifications (service)" on notifications for insert with check (auth.role() = 'service_role');

-- tournaments
drop policy if exists "read tournaments" on tournaments;
create policy "read tournaments" on tournaments for select using (true);

drop policy if exists "create tournaments (owner)" on tournaments;
create policy "create tournaments (owner)" on tournaments for insert with check (auth.uid() = created_by);

-- tournament_participants
drop policy if exists "read tournament participants" on tournament_participants;
create policy "read tournament participants" on tournament_participants for select using (
  exists (select 1 from tournaments t where t.id = tournament_participants.tournament_id)
);

drop policy if exists "manage tournament participants (owner)" on tournament_participants;
create policy "manage tournament participants (owner)" on tournament_participants for all using (
  exists (select 1 from tournaments t where t.id = tournament_participants.tournament_id and t.created_by = auth.uid())
) with check (
  exists (select 1 from tournaments t where t.id = tournament_participants.tournament_id and t.created_by = auth.uid())
);

-- subscriptions
drop policy if exists "read own subscriptions" on subscriptions;
create policy "read own subscriptions" on subscriptions for select using (
  (subject_type='user' and subject_id = auth.uid()) or
  (subject_type='club' and subject_id in (select id from clubs where owner_id = auth.uid()))
);

-- push_tokens
drop policy if exists "manage own push token" on push_tokens;
create policy "manage own push token" on push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================
-- FUNCTIONS & RPCs
-- =====================

-- Helper: validate a set score
create or replace function is_valid_set(t1 int, t2 int, super_tb boolean)
returns boolean language sql immutable as $$
  select case
    when super_tb then (greatest(t1,t2) >= 10 and abs(t1-t2) >= 2)
    when greatest(t1,t2) = 6 and least(t1,t2) <= 4 then true
    when greatest(t1,t2) = 7 and least(t1,t2) in (5,6) then true
    else false
  end;
$$;

-- RPC: create_match(payload jsonb) -> uuid
create or replace function create_match(payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_match_id uuid := uuid_generate_v4();
  v_type text := payload->>'matchType';
  v_level text := payload->>'matchLevel';
  v_played date := (payload->>'played_at')::date;
  v_notes text := payload->>'notes';
  v_client_id text := payload->>'client_mutation_id';
  v_team1 uuid[] := array(select jsonb_array_elements_text(payload->'team1')::uuid);
  v_team2 uuid[] := array(select jsonb_array_elements_text(payload->'team2')::uuid);
  v_submitted uuid := auth.uid();
  v_size int := case when v_type='doubles' then 2 else 1 end;
  v_i int;
  submitter_team int;
begin
  if v_submitted is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if array_length(v_team1,1) != v_size or array_length(v_team2,1) != v_size then
    raise exception 'invalid_team_size';
  end if;

  if exists (select 1 from unnest(v_team1) u join unnest(v_team2) v on u=v) then
    raise exception 'duplicate_players';
  end if;

  if not (v_submitted = any(v_team1) or v_submitted = any(v_team2)) then
    raise exception 'submitter_not_in_match';
  end if;

  insert into matches(id, match_type, match_level, played_at, submitted_by, notes, client_mutation_id)
    values (v_match_id, v_type, v_level, v_played, v_submitted, v_client_id);

  foreach v_i in array generate_subscripts(v_team1,1) loop
    insert into match_players(match_id, user_id, team) values (v_match_id, v_team1[v_i], 1);
  end loop;
  foreach v_i in array generate_subscripts(v_team2,1) loop
    insert into match_players(match_id, user_id, team) values (v_match_id, v_team2[v_i], 2);
  end loop;

  for v_i in 0..jsonb_array_length(payload->'sets')-1 loop
    declare s jsonb := (payload->'sets')->v_i;
    declare st1 int := (s->>'t1')::int;
    declare st2 int := (s->>'t2')::int;
    declare stb boolean := coalesce((s->>'super_tiebreak')::boolean, false);
    begin
      if not is_valid_set(st1, st2, stb) then
        raise exception 'scores_invalid';
      end if;
      insert into match_sets(match_id, set_number, t1, t2, super_tiebreak) values
       (v_match_id, v_i+1, st1, st2, stb);
    end;
  end loop;

  submitter_team := case when v_submitted = any(v_team1) then 1 else 2 end;
  if submitter_team = 1 then
    foreach v_i in array generate_subscripts(v_team2,1) loop
      if v_team2[v_i] <> v_submitted then
        insert into match_approvals(match_id, user_id) values (v_match_id, v_team2[v_i]);
      end if;
    end loop;
  else
    foreach v_i in array generate_subscripts(v_team1,1) loop
      if v_team1[v_i] <> v_submitted then
        insert into match_approvals(match_id, user_id) values (v_match_id, v_team1[v_i]);
      end if;
    end loop;
  end if;

  return v_match_id;
end $$;

-- RPC: record_approval(match_id uuid, approve boolean)
create or replace function record_approval(p_match_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  total int;
  approvals int;
begin
  if uid is null then raise exception 'not_authenticated' using errcode='28000'; end if;

  update match_approvals
     set responded = true, approved = p_approve, responded_at = now()
   where match_id = p_match_id and user_id = uid;

  if p_approve = false then
    update matches set status='rejected' where id = p_match_id;
    return;
  end if;

  select count(*), sum(case when responded and coalesce(approved,false) then 1 else 0 end) 
    into total, approvals from match_approvals where match_id = p_match_id;

  if total > 0 and approvals = total then
    update matches set status='approved' where id = p_match_id;
    perform apply_elo(p_match_id);
  end if;
end $$;

-- Helper to update ratings for a set of players
create or replace function update_player_ratings(p_match_id uuid, players uuid[], opp_avg int, s int, k int, mm numeric)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
  r_before int;
  e numeric;
  delta int;
  r_after int;
begin
  foreach uid in array players loop
    select rating into r_before from profiles where id = uid for update;
    e := 1 / (1 + power(10, (opp_avg - r_before) / 400.0));
    delta := round(k * mm * ((case when s=1 then 1 else 0 end) - e));
    if s=1 and delta < 1 then delta := 1; end if;
    r_after := r_before + delta;
    update profiles set rating = r_after where id = uid;
    insert into elo_history(match_id, user_id, rating_before, rating_after, delta, k_factor, margin_multiplier)
      values (p_match_id, uid, r_before, r_after, delta, k, mm);
  end loop;
end $$;

-- RPC: apply_elo(match_id uuid) -> jsonb
create or replace function apply_elo(p_match_id uuid)
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
begin
  select * into v_match from matches where id = p_match_id for update;
  if not found then raise exception 'not_found'; end if;

  select array_agg(user_id) filter (where team=1), array_agg(user_id) filter (where team=2)
    into t1, t2 from match_players where match_id = p_match_id;

  for s in select * from match_sets where match_id = p_match_id order by set_number loop
    if s.t1 > s.t2 then s1 := s1 + 1; else s2 := s2 + 1; end if;
    gdiff := gdiff + abs(s.t1 - s.t2);
  end loop;

  mm := least(1.4, 1 + gdiff::numeric / 12.0);
  k := case v_match.match_level when 'friendly' then 16 when 'league' then 32 when 'tournament' then 50 else 75 end;
  winner_team := case when s1 > s2 then 1 else 2 end;

  select avg(p.rating)::int into r1 from profiles p where p.id = any(t1);
  select avg(p.rating)::int into r2 from profiles p where p.id = any(t2);

  if winner_team = 1 then
    perform update_player_ratings(p_match_id, t1, r2::int, 1, k, mm);
    perform update_player_ratings(p_match_id, t2, r1::int, 0, k, mm);
  else
    perform update_player_ratings(p_match_id, t1, r2::int, 0, k, mm);
    perform update_player_ratings(p_match_id, t2, r1::int, 1, k, mm);
  end if;

  update matches set status='finalized' where id = p_match_id;
  return jsonb_build_object('k_factor', k, 'margin_multiplier', mm);
end $$;

-- RPC: generate_fixtures
create or replace function generate_fixtures(p_tournament_id uuid, p_format text)
returns int language plpgsql security definer set search_path = public as $$
declare
  teams uuid[][];
  n int;
  created int := 0;
  i int; j int; r int := 1;
begin
  select array_agg(team) into teams from tournament_participants where tournament_id = p_tournament_id;
  n := coalesce(array_length(teams,1), 0);
  if n < 2 then return 0; end if;

  -- simple all-play-all for now
  for i in 1..n-1 loop
    for j in i+1..n loop
      insert into fixtures(tournament_id, round, team1, team2) values (p_tournament_id, r, teams[i], teams[j]);
      created := created + 1; r := r + 1;
    end loop;
  end loop;
  return created;
end $$;

-- RPC: award_badges_for_user
create or replace function award_badges_for_user(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare awarded int := 0;
begin
  -- first_win
  if (select count(*) from elo_history where user_id = p_user) = 1 then
    insert into user_badges(user_id, badge_id) values (p_user, 'first_win') on conflict do nothing;
    awarded := awarded + 1;
  end if;
  return awarded;
end $$;

-- =====================
-- SEEDS
-- =====================
insert into badges(id, name, description) values
  ('first_win','First Win','Won your first rated match'),
  ('streak_3','3-Day Streak','Logged matches 3 days in a row'),
  ('streak_7','7-Day Streak','Logged matches 7 days in a row'),
  ('clean_sweep','Clean Sweep','Won without dropping a set'),
  ('upset_win','Upset Win','Beat a stronger opponent by 150+ Elo')
on conflict do nothing;
