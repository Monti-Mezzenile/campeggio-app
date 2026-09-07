begin;

alter table public.push_subscriptions
  add column if not exists general_enabled boolean not null default true;

create or replace function public.enforce_push_master_switch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.general_enabled is not true then
    new.godo_enabled := false;
    new.news_712_enabled := false;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_push_master_switch on public.push_subscriptions;
create trigger enforce_push_master_switch
before insert or update on public.push_subscriptions
for each row execute function public.enforce_push_master_switch();

commit;
