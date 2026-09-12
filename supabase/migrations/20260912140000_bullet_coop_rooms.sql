begin;
create table public.bullet_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'closed')),
  expires_at timestamptz not null default now() + interval '2 hours',
  check (guest_id is null or guest_id <> host_id)
);
alter table public.bullet_rooms enable row level security;
revoke all on public.bullet_rooms from public, anon, authenticated;

create function public.create_bullet_room() returns public.bullet_rooms
language plpgsql security definer set search_path = '' as $$
declare room public.bullet_rooms;
begin
  if auth.uid() is null then raise exception 'Accedi per giocare online'; end if;
  update public.bullet_rooms set status = 'closed' where host_id = auth.uid() and status <> 'closed';
  loop
    begin
      insert into public.bullet_rooms(code, host_id) values (upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)), auth.uid()) returning * into room;
      return room;
    exception when unique_violation then null;
    end;
  end loop;
end;
$$;
create function public.join_bullet_room(p_code text) returns public.bullet_rooms
language plpgsql security definer set search_path = '' as $$
declare room public.bullet_rooms;
begin
  if auth.uid() is null then raise exception 'Accedi per giocare online'; end if;
  select * into room from public.bullet_rooms where code = upper(trim(p_code)) for update;
  if room.id is null or room.status = 'closed' or room.expires_at <= now() then raise exception 'Codice non valido o stanza scaduta'; end if;
  if room.host_id = auth.uid() then raise exception 'Questo codice è tuo: usa un altro account per il secondo giocatore'; end if;
  if room.guest_id = auth.uid() then return room; end if;
  if room.guest_id is not null or room.status <> 'waiting' then raise exception 'La stanza è già piena'; end if;
  update public.bullet_rooms set guest_id = auth.uid() where id = room.id returning * into room;
  return room;
end;
$$;
create function public.get_bullet_room(p_id uuid) returns public.bullet_rooms
language sql stable security definer set search_path = '' as $$
  select r from public.bullet_rooms r where r.id = p_id and auth.uid() in (r.host_id, r.guest_id);
$$;
create function public.start_bullet_room(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.bullet_rooms set status = 'playing' where id = p_id and host_id = auth.uid() and guest_id is not null and status <> 'closed' and expires_at > now();
  if not found then raise exception 'La stanza non è pronta'; end if;
end;
$$;
create function public.close_bullet_room(p_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.bullet_rooms set status = 'closed' where id = p_id and auth.uid() in (host_id, guest_id);
$$;
create function public.can_access_bullet_channel(p_topic text, p_write boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bullet_rooms r
    where p_topic in ('bullet:' || r.id::text || ':host', 'bullet:' || r.id::text || ':guest')
    and r.status <> 'closed' and r.expires_at > now()
    and auth.uid() in (r.host_id, r.guest_id)
    and (not p_write or (p_topic = 'bullet:' || r.id::text || ':host' and auth.uid() = r.host_id)
      or (p_topic = 'bullet:' || r.id::text || ':guest' and auth.uid() = r.guest_id)));
$$;
revoke all on function public.create_bullet_room(), public.join_bullet_room(text), public.get_bullet_room(uuid), public.start_bullet_room(uuid), public.close_bullet_room(uuid), public.can_access_bullet_channel(text, boolean) from public, anon;
grant execute on function public.create_bullet_room(), public.join_bullet_room(text), public.get_bullet_room(uuid), public.start_bullet_room(uuid), public.close_bullet_room(uuid), public.can_access_bullet_channel(text, boolean) to authenticated;
create policy "Bullet room participants receive" on realtime.messages for select to authenticated
using (public.can_access_bullet_channel((select realtime.topic()), false));
create policy "Bullet participants publish only their own stream" on realtime.messages for insert to authenticated
with check (public.can_access_bullet_channel((select realtime.topic()), true));
commit;
