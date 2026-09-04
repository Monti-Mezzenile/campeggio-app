begin;

create table if not exists public.event_push_notification_deliveries (
  event_id uuid not null
    references public.events (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  reminder_key text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (event_id, user_id, reminder_key),
  constraint event_push_notification_reminder_key_check
    check (reminder_key in ('days_7', 'days_3', 'days_1', 'day_0'))
);

alter table public.event_push_notification_deliveries enable row level security;

revoke all on table public.event_push_notification_deliveries
  from public, anon, authenticated, service_role;

create or replace function public.claim_event_push_notification(
  p_event_id uuid,
  p_user_id uuid,
  p_reminder_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_rows integer;
begin
  if p_event_id is null
     or p_user_id is null
     or p_reminder_key not in ('days_7', 'days_3', 'days_1', 'day_0') then
    return false;
  end if;

  insert into public.event_push_notification_deliveries (
    event_id,
    user_id,
    reminder_key
  ) values (
    p_event_id,
    p_user_id,
    p_reminder_key
  )
  on conflict (event_id, user_id, reminder_key) do nothing;

  get diagnostics inserted_rows = row_count;
  return inserted_rows = 1;
end;
$$;

revoke all on function public.claim_event_push_notification(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_event_push_notification(uuid, uuid, text)
  to service_role;

commit;
