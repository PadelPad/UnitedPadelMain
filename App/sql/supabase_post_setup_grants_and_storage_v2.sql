-- UNITED PADEL — Post-Setup Grants & Storage (v2, fixed GRANT syntax)
-- Safe to run multiple times.

-- 1) Ensure anon/authenticated can SELECT from our app views
do $$ begin
  if to_regclass('public.leaderboard_view_app') is not null then
    grant select on table public.leaderboard_view_app to anon, authenticated;
  end if;
  if to_regclass('public.notifications_app') is not null then
    grant select on table public.notifications_app to anon, authenticated;
  end if;
end $$;

-- 2) Ensure clients can call needed RPCs
do $$ begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='create_match'
  ) then
    grant execute on function public.create_match(jsonb) to authenticated;
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='record_approval'
  ) then
    grant execute on function public.record_approval(uuid, boolean) to authenticated;
  end if;
end $$;

-- 3) Avatars storage bucket + policies (re-run safe)
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

-- Public read of avatars
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Avatar read public') then
    create policy "Avatar read public"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;
end $$;

-- User can insert/update/delete only their own avatar paths
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Avatar write own') then
    create policy "Avatar write own"
      on storage.objects for insert
      with check (
        bucket_id = 'avatars' and (
          name = auth.uid()::text || '.jpg'
          or name like auth.uid()::text || '/%'
          or name = 'avatars/' || auth.uid()::text || '.jpg'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Avatar update own') then
    create policy "Avatar update own"
      on storage.objects for update
      using (
        bucket_id = 'avatars' and (
          name = auth.uid()::text || '.jpg'
          or name like auth.uid()::text || '/%'
          or name = 'avatars/' || auth.uid()::text || '.jpg'
        )
      )
      with check (
        bucket_id = 'avatars' and (
          name = auth.uid()::text || '.jpg'
          or name like auth.uid()::text || '/%'
          or name = 'avatars/' || auth.uid()::text || '.jpg'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Avatar delete own') then
    create policy "Avatar delete own"
      on storage.objects for delete
      using (
        bucket_id = 'avatars' and (
          name = auth.uid()::text || '.jpg'
          or name like auth.uid()::text || '/%'
          or name = 'avatars/' || auth.uid()::text || '.jpg'
        )
      );
  end if;
end $$;
