-- Function (safe to re-run)
create or replace function public.auto_approve_friendly_matches()
returns int language plpgsql security definer set search_path = public as $fn$
declare
  m record;
  touched int := 0;
begin
  for m in
    select id
    from public.matches
    where match_level = 'friendly'
      and status = 'pending'
      and now() - coalesce(played_at::timestamptz, created_at) >= interval '48 hours'
      and not exists (select 1 from public.match_confirmations mc where mc.match_id = matches.id and mc.rejected = true)
  loop
    update public.matches set status = 'approved' where id = m.id;
    perform public.apply_elo(m.id);
    touched := touched + 1;
  end loop;
  return touched;
end
$fn$;

-- Schedule hourly via pg_cron if available
do $do$
declare jid int;
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    for jid in select jobid from cron.job where jobname in ('auto_approve_friendly_matches_30m','auto_approve_friendly_matches_hourly') loop
      perform cron.unschedule(jid);
    end loop;
    perform cron.schedule('auto_approve_friendly_matches_hourly','0 * * * *','SELECT public.auto_approve_friendly_matches();');
  else
    raise notice 'pg_cron not installed. You can call the function from a scheduled Edge Function instead.';
  end if;
end
$do$;
