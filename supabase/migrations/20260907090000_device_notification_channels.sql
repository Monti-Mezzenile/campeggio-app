begin;

alter table public.push_subscriptions
  add column if not exists device_id text,
  add column if not exists godo_enabled boolean not null default false,
  add column if not exists news_712_enabled boolean not null default false,
  add column if not exists godo_next_index integer not null default 0,
  add column if not exists news_712_next_index integer not null default 0,
  add column if not exists godo_last_sent_on date,
  add column if not exists news_712_last_sent_on date;

update public.push_subscriptions
set device_id = gen_random_uuid()::text
where device_id is null;

alter table public.push_subscriptions
  alter column device_id set not null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.push_subscriptions'::regclass
      and con.contype = 'u'
      and con.conkey = array[
        (select attnum from pg_attribute
         where attrelid = con.conrelid and attname = 'user_id')
      ]::smallint[]
  loop
    execute format(
      'alter table public.push_subscriptions drop constraint %I',
      constraint_name
    );
  end loop;
end;
$$;

create unique index if not exists push_subscriptions_user_device_uidx
  on public.push_subscriptions (user_id, device_id);

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_godo_next_index_check,
  drop constraint if exists push_subscriptions_news_712_next_index_check;

alter table public.push_subscriptions
  add constraint push_subscriptions_godo_next_index_check
    check (godo_next_index >= 0),
  add constraint push_subscriptions_news_712_next_index_check
    check (news_712_next_index >= 0);

commit;
