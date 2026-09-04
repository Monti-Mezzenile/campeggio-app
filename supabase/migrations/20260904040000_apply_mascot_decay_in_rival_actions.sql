begin;

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
  action_at timestamptz := pg_catalog.clock_timestamp();
  hours_passed double precision;
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

  hours_passed := greatest(
    0,
    extract(
      epoch from action_at - coalesce(target_mascot.last_updated_at, action_at)
    ) / 3600.0
  );

  if hours_passed > 0.05 then
    target_mascot.fame := greatest(
      0,
      coalesce(target_mascot.fame, 100) - hours_passed * 3.5
    );
    target_mascot.sete := greatest(
      0,
      coalesce(target_mascot.sete, 100) - hours_passed * 4.5
    );
    target_mascot.svago := greatest(
      0,
      coalesce(target_mascot.svago, 100) - hours_passed * 3.0
    );
  end if;

  if p_action_type = 'pigna' then
    target_mascot.svago := greatest(0, target_mascot.svago - 12);
    log_message := sender_mascot.nome_mascotte || ' ti ha tirato una pigna in faccia! (-12% Svago)';
  elsif p_action_type = 'birra' then
    target_mascot.sete := least(100, target_mascot.sete + 25);
    log_message := sender_mascot.nome_mascotte || ' ti ha offerto una birra fresca! (+25% Sete)';
  elsif p_action_type = 'cibo' then
    target_mascot.fame := least(100, target_mascot.fame + 25);
    log_message := sender_mascot.nome_mascotte || ' ti ha lanciato un cosciotto! (+25% Fame)';
  elsif p_action_type = 'troll' then
    target_mascot.svago := greatest(0, target_mascot.svago - 8);
    target_mascot.fame := greatest(0, target_mascot.fame - 8);
    log_message := sender_mascot.nome_mascotte || ' ti ha spaventato a morte! (-8% Fame e Svago)';
  else
    target_mascot.svago := least(100, target_mascot.svago + 25);
    log_message := sender_mascot.nome_mascotte || ' ha giocato un po'' con te! (+25% Svago)';
  end if;

  update public.mascots
  set fame = target_mascot.fame,
      sete = target_mascot.sete,
      svago = target_mascot.svago,
      last_updated_at = action_at
  where id = target_mascot.id;

  insert into public.mascot_logs (
    sender_name,
    receiver_user_id,
    action_type,
    message
  ) values (
    sender_mascot.nome_mascotte,
    target_mascot.user_id,
    p_action_type,
    log_message
  );

  return pg_catalog.jsonb_build_object(
    'id', target_mascot.id,
    'fame', target_mascot.fame,
    'sete', target_mascot.sete,
    'svago', target_mascot.svago,
    'last_updated_at', action_at
  );
end;
$$;

revoke all on function public.apply_mascot_action(uuid, text)
  from public, anon;
grant execute on function public.apply_mascot_action(uuid, text)
  to authenticated;

commit;
