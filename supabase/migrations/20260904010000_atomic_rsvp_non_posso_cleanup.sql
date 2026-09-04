begin;

create or replace function public.cleanup_event_assignments_when_rsvp_unavailable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if new.stato is not distinct from old.stato then
    return new;
  end if;

  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if new.user_id is distinct from old.user_id
     or new.event_id is distinct from old.event_id
     or new.user_id is distinct from caller_id then
    raise exception using errcode = '42501', message = 'Cannot update another user RSVP';
  end if;

  if new.stato is null
     or new.stato not in ('partecipo', 'forse', 'non_posso') then
    raise exception using errcode = '22023', message = 'Invalid RSVP status';
  end if;

  if not exists (
    select 1
    from public.events as e
    where e.id = new.event_id
  ) or not exists (
    select 1
    from public.event_members as em
    where em.id = old.id
      and em.event_id = new.event_id
      and em.user_id = caller_id
  ) then
    raise exception using errcode = '22023', message = 'Invalid event membership';
  end if;

  if new.stato <> 'non_posso' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.event_id::text || ':' || caller_id::text, 0)
  );

  perform 1
  from public.trip_cars as tc
  join public.trips as t on t.id = tc.trip_id
  join public.cars as car on car.id = tc.car_id
  where t.event_id = new.event_id
    and (tc.driver_id = caller_id or car.user_id = caller_id)
  for update of tc;

  delete from public.trip_passengers as tp
  using public.trip_cars as tc, public.trips as t
  where tp.trip_car_id = tc.id
    and tc.trip_id = t.id
    and t.event_id = new.event_id
    and tp.user_id = caller_id;

  delete from public.trip_passengers as tp
  using public.trip_cars as tc, public.trips as t, public.cars as car
  where tp.trip_car_id = tc.id
    and tc.trip_id = t.id
    and tc.car_id = car.id
    and t.event_id = new.event_id
    and (tc.driver_id = caller_id or car.user_id = caller_id);

  delete from public.trip_cars as tc
  using public.trips as t, public.cars as car
  where tc.trip_id = t.id
    and tc.car_id = car.id
    and t.event_id = new.event_id
    and (tc.driver_id = caller_id or car.user_id = caller_id);

  delete from public.tent_members as tm
  using public.event_tents as et, public.tents as tent
  where tm.event_tent_id = et.id
    and et.tent_id = tent.id
    and et.event_id = new.event_id
    and tm.user_id = caller_id
    and tent.user_id is distinct from caller_id;

  return new;
end;
$$;

revoke all on function public.cleanup_event_assignments_when_rsvp_unavailable()
  from public, anon, authenticated;

drop trigger if exists cleanup_event_assignments_when_rsvp_unavailable_trigger
  on public.event_members;
create trigger cleanup_event_assignments_when_rsvp_unavailable_trigger
before update of stato on public.event_members
for each row execute function public.cleanup_event_assignments_when_rsvp_unavailable();

commit;
