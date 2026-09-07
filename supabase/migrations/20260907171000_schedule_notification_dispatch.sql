begin;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'monti-notification-dispatch';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'monti-notification-dispatch',
  '*/15 * * * *',
  $job$
    select net.http_get(
      url := 'https://montidimezzenile.vercel.app/api/cron/check-needs',
      headers := '{"User-Agent":"vercel-cron/1.0"}'::jsonb,
      timeout_milliseconds := 10000
    );
  $job$
);

commit;
