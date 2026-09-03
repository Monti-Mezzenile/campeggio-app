create table if not exists public.push_notification_rate_limits (
  id bigint generated always as identity primary key,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  receiver_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default pg_catalog.clock_timestamp()
);

create index if not exists push_notification_rate_limits_sender_created_idx
  on public.push_notification_rate_limits (sender_user_id, created_at desc);

create index if not exists push_notification_rate_limits_pair_created_idx
  on public.push_notification_rate_limits (
    sender_user_id,
    receiver_user_id,
    created_at desc
  );

alter table public.push_notification_rate_limits enable row level security;

revoke all on table public.push_notification_rate_limits
  from public, anon, authenticated, service_role;

revoke all on sequence public.push_notification_rate_limits_id_seq
  from public, anon, authenticated, service_role;

create or replace function public.claim_push_notification_slot(
  p_sender_user_id uuid,
  p_receiver_user_id uuid,
  p_pair_cooldown_seconds integer default 5,
  p_sender_window_seconds integer default 60,
  p_sender_max_pushes integer default 10
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_sender_push_count bigint;
begin
  if p_sender_user_id is null
    or p_receiver_user_id is null
    or p_sender_user_id = p_receiver_user_id
    or p_pair_cooldown_seconds < 1
    or p_pair_cooldown_seconds > 300
    or p_sender_window_seconds < 1
    or p_sender_window_seconds > 3600
    or p_sender_max_pushes < 1
    or p_sender_max_pushes > 100 then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_sender_user_id::text, 0)
  );

  delete from public.push_notification_rate_limits
  where sender_user_id = p_sender_user_id
    and created_at < v_now - (p_sender_window_seconds * interval '1 second');

  if exists (
    select 1
    from public.push_notification_rate_limits
    where sender_user_id = p_sender_user_id
      and receiver_user_id = p_receiver_user_id
      and created_at > v_now - (p_pair_cooldown_seconds * interval '1 second')
  ) then
    return false;
  end if;

  select pg_catalog.count(*)
  into v_sender_push_count
  from public.push_notification_rate_limits
  where sender_user_id = p_sender_user_id
    and created_at > v_now - (p_sender_window_seconds * interval '1 second');

  if v_sender_push_count >= p_sender_max_pushes then
    return false;
  end if;

  insert into public.push_notification_rate_limits (
    sender_user_id,
    receiver_user_id,
    created_at
  )
  values (
    p_sender_user_id,
    p_receiver_user_id,
    v_now
  );

  return true;
end;
$$;

revoke all on function public.claim_push_notification_slot(
  uuid,
  uuid,
  integer,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.claim_push_notification_slot(
  uuid,
  uuid,
  integer,
  integer,
  integer
) to service_role;
