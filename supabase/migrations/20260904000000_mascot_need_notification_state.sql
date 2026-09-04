begin;

create table if not exists public.mascot_need_notification_state (
  mascot_id uuid primary key
    references public.mascots (id) on delete cascade,
  last_signature text not null,
  last_sent_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint mascot_need_notification_signature_length
    check (
      pg_catalog.char_length(last_signature) between 1 and 64
    )
);

alter table public.mascot_need_notification_state enable row level security;

revoke all on table public.mascot_need_notification_state
  from public, anon, authenticated, service_role;

create or replace function public.claim_mascot_need_notification(
  p_mascot_id uuid,
  p_need_signature text,
  p_cooldown_seconds integer default 72000
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_mascot_id is null
    or p_need_signature is null
    or pg_catalog.char_length(p_need_signature) not between 1 and 64
    or p_cooldown_seconds < 60
    or p_cooldown_seconds > 86400 then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('mascot-needs:' || p_mascot_id::text, 0)
  );

  if exists (
    select 1
    from public.mascot_need_notification_state
    where mascot_id = p_mascot_id
      and last_signature = p_need_signature
      and last_sent_at > v_now - (p_cooldown_seconds * interval '1 second')
  ) then
    return false;
  end if;

  insert into public.mascot_need_notification_state (
    mascot_id,
    last_signature,
    last_sent_at
  )
  values (
    p_mascot_id,
    p_need_signature,
    v_now
  )
  on conflict (mascot_id)
  do update set
    last_signature = excluded.last_signature,
    last_sent_at = excluded.last_sent_at;

  return true;
end;
$$;

revoke all on function public.claim_mascot_need_notification(
  uuid,
  text,
  integer
) from public, anon, authenticated;

grant execute on function public.claim_mascot_need_notification(
  uuid,
  text,
  integer
) to service_role;

commit;
