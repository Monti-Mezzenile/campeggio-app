begin;

-- Abort instead of guessing if production contains an RSVP value outside the approved mapping.
do $$
declare
  unexpected_values text;
begin
  select pg_catalog.string_agg(distinct em.stato, ', ' order by em.stato)
  into unexpected_values
  from public.event_members as em
  where em.stato is null
     or em.stato not in (
       'confermato', 'ci_saro', 'partecipo', 'forse',
       'non_partecipo', 'non_ci_saro', 'non_posso'
     );

  if unexpected_values is not null
     or exists (select 1 from public.event_members where stato is null) then
    raise exception 'Unexpected RSVP values found: %',
      pg_catalog.coalesce(unexpected_values, '<NULL>');
  end if;
end;
$$;

update public.event_members
set stato = case
  when stato in ('confermato', 'ci_saro') then 'partecipo'
  when stato in ('non_partecipo', 'non_ci_saro') then 'non_posso'
  else stato
end;

do $$
begin
  if exists (
    select 1 from public.event_members
    where stato is null or stato not in ('partecipo', 'forse', 'non_posso')
  ) then
    raise exception 'RSVP normalization did not produce canonical values';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.event_members'::pg_catalog.regclass
      and conname = 'event_members_stato_check'
  ) then
    alter table public.event_members
      add constraint event_members_stato_check
      check (stato in ('partecipo', 'forse', 'non_posso'));
  end if;
end;
$$;

-- The known duplicate must still be the same empty outbound trip, otherwise stop.
do $$
declare
  duplicate_trip public.trips%rowtype;
begin
  select * into duplicate_trip
  from public.trips
  where id = '393888c7-8592-4a9a-84a4-3381782bb861'::uuid;

  if not found
     or duplicate_trip.event_id <> 'a9d5d44e-bf75-4a85-9c66-2513ef417b22'::uuid
     or duplicate_trip.tipo <> 'andata'
     or duplicate_trip.data is not null
     or duplicate_trip.ora is not null
     or duplicate_trip.luogo_partenza is not null
     or duplicate_trip.luogo_arrivo is not null
     or exists (
       select 1 from public.trip_cars
       where trip_id = duplicate_trip.id
     ) then
    raise exception 'Known duplicate trip changed; manual review required';
  end if;

  if not exists (
    select 1 from public.trips
    where id = '251f4a71-9c68-47c5-a525-11c0354d3e03'::uuid
      and event_id = duplicate_trip.event_id
      and tipo = duplicate_trip.tipo
  ) then
    raise exception 'Trip selected for retention is missing or changed';
  end if;

  if exists (
    select 1
    from public.trips
    group by event_id, tipo
    having pg_catalog.count(*) > 1
       and not (
         event_id = duplicate_trip.event_id
         and tipo = duplicate_trip.tipo
         and pg_catalog.array_agg(id order by id) = array[
           '251f4a71-9c68-47c5-a525-11c0354d3e03'::uuid,
           '393888c7-8592-4a9a-84a4-3381782bb861'::uuid
         ]
       )
  ) then
    raise exception 'Additional trip duplicates found; manual review required';
  end if;

  delete from public.trips where id = duplicate_trip.id;
end;
$$;

create unique index if not exists trips_event_id_tipo_uidx
  on public.trips (event_id, tipo);

-- Refuse unplanned cleanup: all following constraints must fit current data as-is.
do $$
begin
  if exists (select 1 from public.expenses where importo <= 0) then
    raise exception 'Non-positive expenses exist';
  end if;
  if exists (select 1 from public.expense_members where quota <= 0) then
    raise exception 'Non-positive expense shares exist';
  end if;
  if exists (
    select 1 from public.expense_members
    group by expense_id, user_id having pg_catalog.count(*) > 1
  ) then
    raise exception 'Duplicate expense members exist';
  end if;
  if exists (select 1 from public.cars where posti_totali <= 0) then
    raise exception 'Cars with invalid capacity exist';
  end if;
  if exists (select 1 from public.trip_cars where posti_disponibili < 0) then
    raise exception 'Trip cars with invalid capacity exist';
  end if;
  if exists (
    select 1 from public.trip_cars
    group by trip_id, car_id having pg_catalog.count(*) > 1
  ) then
    raise exception 'Duplicate trip cars exist';
  end if;
  if exists (
    select 1 from public.trip_passengers
    group by trip_car_id, user_id having pg_catalog.count(*) > 1
  ) then
    raise exception 'Duplicate trip passengers exist';
  end if;
  if exists (select 1 from public.tents where posti <= 0) then
    raise exception 'Tents with invalid capacity exist';
  end if;
  if exists (
    select 1 from public.event_tents
    group by event_id, tent_id having pg_catalog.count(*) > 1
  ) then
    raise exception 'Duplicate event tents exist';
  end if;
  if exists (
    select 1 from public.tent_members
    group by event_tent_id, user_id having pg_catalog.count(*) > 1
  ) then
    raise exception 'Duplicate tent members exist';
  end if;
end;
$$;

alter table public.expenses
  add constraint expenses_importo_positive_check check (importo > 0);
alter table public.expense_members
  add constraint expense_members_quota_positive_check check (quota > 0);
alter table public.cars
  add constraint cars_posti_totali_positive_check check (posti_totali > 0);
alter table public.trip_cars
  add constraint trip_cars_posti_disponibili_nonnegative_check
  check (posti_disponibili >= 0);
alter table public.tents
  add constraint tents_posti_positive_check check (posti > 0);

create unique index expense_members_expense_user_uidx
  on public.expense_members (expense_id, user_id);
create unique index trip_cars_trip_car_uidx
  on public.trip_cars (trip_id, car_id);
create unique index trip_passengers_trip_car_user_uidx
  on public.trip_passengers (trip_car_id, user_id);
create unique index event_tents_event_tent_uidx
  on public.event_tents (event_id, tent_id);
create unique index tent_members_event_tent_user_uidx
  on public.tent_members (event_tent_id, user_id);

create or replace function public.apply_mascot_action(
  p_target_mascot_id uuid,
  p_action_type text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  sender_mascot public.mascots%rowtype;
  target_mascot public.mascots%rowtype;
  log_message text;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_target_mascot_id is null
     or p_action_type not in ('pigna', 'birra', 'cibo', 'troll', 'gioca') then
    raise exception using errcode = '22023', message = 'Invalid mascot action';
  end if;

  select * into sender_mascot
  from public.mascots
  where user_id = caller_id;
  if not found then
    raise exception using errcode = '22023', message = 'Sender mascot not found';
  end if;

  select * into target_mascot
  from public.mascots
  where id = p_target_mascot_id
  for update;
  if not found or target_mascot.user_id = caller_id then
    raise exception using errcode = '22023', message = 'Invalid mascot target';
  end if;

  if p_action_type = 'pigna' then
    target_mascot.svago := pg_catalog.greatest(0, target_mascot.svago - 12);
    log_message := sender_mascot.nome_mascotte || ' ti ha tirato una pigna in faccia! (-12% Svago)';
  elsif p_action_type = 'birra' then
    target_mascot.sete := pg_catalog.least(100, target_mascot.sete + 25);
    log_message := sender_mascot.nome_mascotte || ' ti ha offerto una birra fresca! (+25% Sete)';
  elsif p_action_type = 'cibo' then
    target_mascot.fame := pg_catalog.least(100, target_mascot.fame + 25);
    log_message := sender_mascot.nome_mascotte || ' ti ha lanciato un cosciotto! (+25% Fame)';
  elsif p_action_type = 'troll' then
    target_mascot.svago := pg_catalog.greatest(0, target_mascot.svago - 8);
    target_mascot.fame := pg_catalog.greatest(0, target_mascot.fame - 8);
    log_message := sender_mascot.nome_mascotte || ' ti ha spaventato a morte! (-8% Fame e Svago)';
  else
    target_mascot.svago := pg_catalog.least(100, target_mascot.svago + 25);
    log_message := sender_mascot.nome_mascotte || ' ha giocato un po'' con te! (+25% Svago)';
  end if;

  update public.mascots
  set fame = target_mascot.fame,
      sete = target_mascot.sete,
      svago = target_mascot.svago
  where id = target_mascot.id;

  insert into public.mascot_logs (
    sender_name, receiver_user_id, action_type, message
  ) values (
    sender_mascot.nome_mascotte, target_mascot.user_id,
    p_action_type, log_message
  );

  return pg_catalog.jsonb_build_object(
    'id', target_mascot.id,
    'fame', target_mascot.fame,
    'sete', target_mascot.sete,
    'svago', target_mascot.svago,
    'last_updated_at', target_mascot.last_updated_at
  );
end;
$$;

revoke all on function public.apply_mascot_action(uuid, text)
  from public, anon;
grant execute on function public.apply_mascot_action(uuid, text)
  to authenticated;
revoke insert on table public.mascot_logs from authenticated;

create or replace function public.create_expense_with_members(
  p_event_id uuid,
  p_description text,
  p_amount numeric,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  new_expense_id uuid;
  member_count integer;
  distinct_member_count integer;
  share_amount numeric;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_event_id is null
     or pg_catalog.btrim(p_description) = ''
     or p_amount is null
     or p_amount <= 0
     or p_member_ids is null
     or pg_catalog.cardinality(p_member_ids) = 0 then
    raise exception using errcode = '22023', message = 'Invalid expense data';
  end if;

  if not exists (
    select 1 from public.event_members
    where event_id = p_event_id
      and user_id = caller_id
      and stato = 'partecipo'
  ) then
    raise exception using errcode = '42501', message = 'Not an event participant';
  end if;

  select pg_catalog.count(*), pg_catalog.count(distinct member_id)
  into member_count, distinct_member_count
  from pg_catalog.unnest(p_member_ids) as members(member_id);

  if member_count <> distinct_member_count
     or exists (
       select 1 from pg_catalog.unnest(p_member_ids) as members(member_id)
       where member_id is null
     ) then
    raise exception using errcode = '22023', message = 'Duplicate or invalid expense member';
  end if;

  if (
    select pg_catalog.count(*)
    from public.event_members
    where event_id = p_event_id
      and user_id = any(p_member_ids)
      and stato = 'partecipo'
  ) <> member_count then
    raise exception using errcode = '22023', message = 'Expense member is not an event participant';
  end if;

  share_amount := p_amount / member_count;
  if share_amount <= 0 then
    raise exception using errcode = '22023', message = 'Invalid expense share';
  end if;

  insert into public.expenses (event_id, payer_id, descrizione, importo)
  values (p_event_id, caller_id, pg_catalog.btrim(p_description), p_amount)
  returning id into new_expense_id;

  insert into public.expense_members (expense_id, user_id, quota)
  select new_expense_id, member_id, share_amount
  from pg_catalog.unnest(p_member_ids) as members(member_id);

  return new_expense_id;
end;
$$;

revoke all on function public.create_expense_with_members(uuid, text, numeric, uuid[])
  from public, anon;
grant execute on function public.create_expense_with_members(uuid, text, numeric, uuid[])
  to authenticated;
revoke insert on table public.expenses from authenticated;
revoke insert on table public.expense_members from authenticated;

create or replace function public.validate_trip_car_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_uuid uuid;
  owner_uuid uuid;
  total_seats integer;
begin
  select t.event_id, c.user_id, c.posti_totali
  into event_uuid, owner_uuid, total_seats
  from public.trips as t
  cross join public.cars as c
  where t.id = new.trip_id and c.id = new.car_id;

  if event_uuid is null
     or new.driver_id is null
     or owner_uuid is distinct from new.driver_id
     or new.posti_disponibili is null
     or new.posti_disponibili > total_seats - 1
     or not exists (
       select 1 from public.event_members
       where event_id = event_uuid
         and user_id = new.driver_id
         and stato = 'partecipo'
     ) then
    raise exception using errcode = '22023', message = 'Invalid event car';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_trip_car_integrity() from public, anon, authenticated;
drop trigger if exists validate_trip_car_integrity_trigger on public.trip_cars;
create trigger validate_trip_car_integrity_trigger
before insert or update on public.trip_cars
for each row execute function public.validate_trip_car_integrity();

create or replace function public.validate_trip_passenger_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_uuid uuid;
  passenger_capacity integer;
  driver_uuid uuid;
begin
  select t.event_id, tc.posti_disponibili, tc.driver_id
  into event_uuid, passenger_capacity, driver_uuid
  from public.trip_cars as tc
  join public.trips as t on t.id = tc.trip_id
  where tc.id = new.trip_car_id
  for update of tc;

  if event_uuid is null or new.user_id is null then
    raise exception using errcode = '22023', message = 'Invalid trip passenger';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(event_uuid::text || ':' || new.user_id::text, 0)
  );

  if new.user_id = driver_uuid
     or not exists (
       select 1 from public.event_members
       where event_id = event_uuid
         and user_id = new.user_id
         and stato = 'partecipo'
     )
     or exists (
       select 1
       from public.trip_passengers as tp
       join public.trip_cars as other_tc on other_tc.id = tp.trip_car_id
       join public.trips as other_t on other_t.id = other_tc.trip_id
       where other_t.event_id = event_uuid
         and tp.user_id = new.user_id
         and tp.id <> pg_catalog.coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
     ) then
    raise exception using errcode = '23514', message = 'Passenger already assigned or not eligible';
  end if;

  if (
    select pg_catalog.count(*)
    from public.trip_passengers
    where trip_car_id = new.trip_car_id
      and id <> pg_catalog.coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= passenger_capacity then
    raise exception using errcode = '23514', message = 'Car capacity exceeded';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_trip_passenger_integrity() from public, anon, authenticated;
drop trigger if exists validate_trip_passenger_integrity_trigger on public.trip_passengers;
create trigger validate_trip_passenger_integrity_trigger
before insert or update on public.trip_passengers
for each row execute function public.validate_trip_passenger_integrity();

create or replace function public.validate_tent_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.user_id is distinct from auth.uid() then
    raise exception using errcode = '42501', message = 'Tent owner must be the authenticated user';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_tent_owner() from public, anon, authenticated;
drop trigger if exists validate_tent_owner_trigger on public.tents;
create trigger validate_tent_owner_trigger
before insert or update of user_id on public.tents
for each row execute function public.validate_tent_owner();

create or replace function public.validate_tent_member_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_uuid uuid;
  tent_capacity integer;
begin
  select et.event_id, t.posti
  into event_uuid, tent_capacity
  from public.event_tents as et
  join public.tents as t on t.id = et.tent_id
  where et.id = new.event_tent_id
  for update of et;

  if event_uuid is null or new.user_id is null then
    raise exception using errcode = '22023', message = 'Invalid tent member';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(event_uuid::text || ':' || new.user_id::text, 0)
  );

  if not exists (
       select 1 from public.event_members
       where event_id = event_uuid and user_id = new.user_id
     )
     or exists (
       select 1
       from public.tent_members as tm
       join public.event_tents as other_et on other_et.id = tm.event_tent_id
       where other_et.event_id = event_uuid
         and tm.user_id = new.user_id
         and tm.id <> pg_catalog.coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
     ) then
    raise exception using errcode = '23514', message = 'Tent member already assigned or not eligible';
  end if;

  if (
    select pg_catalog.count(*)
    from public.tent_members
    where event_tent_id = new.event_tent_id
      and id <> pg_catalog.coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= tent_capacity then
    raise exception using errcode = '23514', message = 'Tent capacity exceeded';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_tent_member_integrity() from public, anon, authenticated;
drop trigger if exists validate_tent_member_integrity_trigger on public.tent_members;
create trigger validate_tent_member_integrity_trigger
before insert or update on public.tent_members
for each row execute function public.validate_tent_member_integrity();

commit;
