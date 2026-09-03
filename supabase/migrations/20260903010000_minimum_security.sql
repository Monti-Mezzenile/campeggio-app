-- Minimum security baseline for the private, collaborative application.
-- Anonymous users lose all write access, while authenticated collaboration remains intact.

-- Keep the existing administrative deletion behavior, but expose it only to trusted server code.
create or replace function public.delete_event_complete(event_uuid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.trip_passengers
  where trip_car_id in (
    select id
    from public.trip_cars
    where trip_id = event_uuid
  );

  delete from public.trip_cars
  where trip_id = event_uuid;

  delete from public.event_members
  where event_id = event_uuid;

  delete from public.event_tents
  where event_id = event_uuid;

  delete from public.event_equipment
  where event_id = event_uuid;

  delete from public.tasks
  where event_id = event_uuid;

  delete from public.media
  where event_id = event_uuid;

  delete from public.events
  where id = event_uuid;
end;
$$;

revoke all on function public.delete_event_complete(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_event_complete(uuid)
  to service_role;

-- Anonymous visitors must never mutate application data.
revoke insert, update, delete, truncate
  on all tables in schema public
  from anon;

-- Profiles remain shared among friends, but each user can update only safe fields on their row.
drop policy if exists "Profili visibili a tutti" on public.profiles;
drop policy if exists "Tutti possono vedere profili" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Tutti possono creare profili" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Utenti possono inserire il proprio profilo" on public.profiles;
drop policy if exists "Tutti possono modificare profili" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Utenti possono aggiornare il proprio profilo" on public.profiles;

revoke select, insert, update, delete, truncate on table public.profiles
  from anon;
revoke insert, update on table public.profiles
  from authenticated;
grant select on table public.profiles
  to authenticated;
grant update (
  nome,
  titolo_campo,
  motto,
  nome_coniglio,
  padre_fondatore,
  avatar_url
) on table public.profiles to authenticated;

create policy "Authenticated users can view profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can update their own safe profile fields"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Participation details stay visible to the group, never to anonymous visitors.
drop policy if exists "Users can view event members" on public.event_members;
revoke select on table public.event_members from anon;
grant select on table public.event_members to authenticated;

create policy "Authenticated users can view event members"
  on public.event_members
  for select
  to authenticated
  using (true);

-- Curiosities remain collaborative, but writes require authentication.
drop policy if exists "Allow everyone insert curiosities" on public.curiosities;
drop policy if exists "allow insert curiosities" on public.curiosities;
drop policy if exists "curiosities_insert" on public.curiosities;
drop policy if exists "curiosities_delete" on public.curiosities;

create policy "Authenticated users can insert curiosities"
  on public.curiosities
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete curiosities"
  on public.curiosities
  for delete
  to authenticated
  using (true);

-- Shopping calls stay group-editable after login.
drop policy if exists "Utenti prenotano carne" on public.shopping_calls;
drop policy if exists "insert shopping calls" on public.shopping_calls;
drop policy if exists "Utenti modificano carne" on public.shopping_calls;
drop policy if exists "update shopping calls" on public.shopping_calls;

create policy "Authenticated users can insert shopping calls"
  on public.shopping_calls
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update shopping calls"
  on public.shopping_calls
  for update
  to authenticated
  using (true)
  with check (true);

-- Legacy menu items remain collaborative but are no longer anonymously writable.
drop policy if exists "edit menu items" on public.menu_items;
drop policy if exists "view menu items" on public.menu_items;

create policy "Authenticated users can manage menu items"
  on public.menu_items
  for all
  to authenticated
  using (true)
  with check (true);

-- Preserve the current expense flow while removing its anonymous insert path.
drop policy if exists "insert expense members" on public.expense_members;

create policy "Authenticated users can insert expense members"
  on public.expense_members
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.expenses
      where expenses.id = expense_members.expense_id
    )
  );

-- Event menus are readable by the group and editable by the same accounts allowed by the UI.
grant select, insert, update on table public.event_menus
  to authenticated;

create policy "Authenticated users can view event menus"
  on public.event_menus
  for select
  to authenticated
  using (true);

create policy "Authorized users can insert event menus"
  on public.event_menus
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and (
          profiles.ruolo = 'admin'
          or profiles.email = 'alexscisci91@gmail.com'
        )
    )
  );

create policy "Authorized users can update event menus"
  on public.event_menus
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and (
          profiles.ruolo = 'admin'
          or profiles.email = 'alexscisci91@gmail.com'
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and (
          profiles.ruolo = 'admin'
          or profiles.email = 'alexscisci91@gmail.com'
        )
    )
  );

-- Public buckets stay public for downloads; object mutations require authentication.
revoke insert, update, delete on table storage.objects
  from anon;

drop policy if exists "Users can upload badge images" on storage.objects;
drop policy if exists "Users can upload car photos" on storage.objects;

create policy "Users can upload badge images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'badges');

create policy "Users can upload car photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'cars');
