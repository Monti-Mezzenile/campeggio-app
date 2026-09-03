begin;

create or replace function public.increment_mascot_exp(p_delta integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  new_exp integer;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_delta is null or p_delta <= 0 then
    raise exception using errcode = '22023', message = 'Invalid XP increment';
  end if;

  update public.mascots
  set exp = exp + p_delta
  where user_id = caller_id
  returning exp into new_exp;

  if new_exp is null then
    raise exception using errcode = '22023', message = 'Mascot not found';
  end if;

  return new_exp;
end;
$$;

revoke all on function public.increment_mascot_exp(integer)
  from public, anon;
grant execute on function public.increment_mascot_exp(integer)
  to authenticated;

create or replace function public.set_checklist_item_completion(
  p_item_id uuid,
  p_completed boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  item_record record;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_item_id is null or p_completed is null then
    raise exception using errcode = '22023', message = 'Invalid checklist update';
  end if;

  select
    ci.id,
    ci.equipment_id,
    c.event_id,
    c.user_id,
    e.categoria
  into item_record
  from public.checklist_items as ci
  join public.checklists as c on c.id = ci.checklist_id
  left join public.equipment as e on e.id = ci.equipment_id
  where ci.id = p_item_id
  for update of ci;

  if not found or item_record.user_id is distinct from caller_id then
    raise exception using errcode = '42501', message = 'Checklist item not found';
  end if;

  if item_record.equipment_id is not null
     and item_record.categoria is distinct from 'Vestiti e Oggetti Personali' then
    if p_completed then
      insert into public.event_equipment (
        event_id,
        equipment_id,
        assegnato_a,
        confermato
      ) values (
        item_record.event_id,
        item_record.equipment_id,
        caller_id,
        true
      )
      on conflict (event_id, equipment_id, assegnato_a)
      do update set confermato = excluded.confermato;
    else
      delete from public.event_equipment
      where event_id = item_record.event_id
        and equipment_id = item_record.equipment_id
        and assegnato_a = caller_id;
    end if;
  end if;

  update public.checklist_items
  set completato = p_completed
  where id = item_record.id;
end;
$$;

revoke all on function public.set_checklist_item_completion(uuid, boolean)
  from public, anon;
grant execute on function public.set_checklist_item_completion(uuid, boolean)
  to authenticated;

commit;
