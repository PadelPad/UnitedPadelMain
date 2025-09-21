-- UNITED PADEL — REPAIR PATCH (2025-08-16)
-- Fixes: missing matches.client_mutation_id (adds column + unique partial index)
-- Also ensures profiles.avatar_url exists and rebuilds leaderboard materialized view.

-- 1) Add missing columns if they don't exist
alter table matches add column if not exists client_mutation_id text;
alter table profiles add column if not exists avatar_url text;

-- 2) Recreate/ensure the unique index on client_mutation_id
create unique index if not exists matches_client_id_uq
  on matches (client_mutation_id)
  where client_mutation_id is not null;

-- 3) Rebuild leaderboard materialized view to include avatar_url safely
drop materialized view if exists leaderboard_view;
create materialized view leaderboard_view as
select 
  p.id as user_id, p.username, p.region, p.club_id, p.rating, p.subscription_tier, p.avatar_url,
  coalesce((select jsonb_agg(ub.badge_id) from user_badges ub where ub.user_id = p.id),'[]'::jsonb) as badges,
  rank() over (order by p.rating desc) as rank
from profiles p;
