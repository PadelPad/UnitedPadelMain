-- UNITED PADEL — MV Fix (no touch to your existing leaderboard_view)
-- Creates an app-only materialized view: public.leaderboard_view_app

create extension if not exists "uuid-ossp";

-- Drop ONLY our app MV name if it exists
drop materialized view if exists public.leaderboard_view_app;

create materialized view public.leaderboard_view_app as
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

-- Unique index on user_id to allow CONCURRENT refreshes later if desired
drop index if exists leaderboard_view_app_uid_uq;
create unique index leaderboard_view_app_uid_uq on public.leaderboard_view_app(user_id);

-- Optional helper to refresh
create or replace function public.refresh_leaderboard_app()
returns void language sql as $$
  refresh materialized view concurrently public.leaderboard_view_app;
$$;
