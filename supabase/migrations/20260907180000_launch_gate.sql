begin;

create table if not exists public.app_runtime_settings (
  id text primary key,
  is_locked boolean not null default true,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint app_runtime_settings_known_id
    check (id = 'launch_gate')
);

insert into public.app_runtime_settings (id, is_locked)
values ('launch_gate', true)
on conflict (id) do nothing;

alter table public.app_runtime_settings enable row level security;

revoke all on table public.app_runtime_settings from public, anon;
grant select, update on table public.app_runtime_settings to authenticated;

drop policy if exists "Authenticated users can read app settings"
  on public.app_runtime_settings;
create policy "Authenticated users can read app settings"
  on public.app_runtime_settings
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can update app settings"
  on public.app_runtime_settings;
create policy "Admins can update app settings"
  on public.app_runtime_settings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.ruolo = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.ruolo = 'admin'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_runtime_settings'
  ) then
    alter publication supabase_realtime
      add table public.app_runtime_settings;
  end if;
end;
$$;

commit;
