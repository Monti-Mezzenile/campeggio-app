-- Run inside BEGIN / ROLLBACK; all pet changes are discarded.
do $$
declare pet public.mascots; response jsonb; baseline integer; i integer; denied boolean;
begin
  select * into pet from public.mascots limit 1;
  assert pet.id is not null, 'An existing mascot is required';
  perform set_config('request.jwt.claim.sub', pet.user_id::text, true);
  delete from public.mascot_play_limits where mascot_id = pet.id;
  update public.mascots set fame = 100, sete = 100, svago = 50, exp = 1000, last_updated_at = now() where id = pet.id;
  response := public.play_with_mascot('drone');
  assert response->>'status' = 'played';
  assert (response->>'xp')::integer = 40;
  assert (response->'mascot'->>'svago')::integer = 90;
  response := public.play_with_mascot('cannetta');
  assert (response->>'xp')::integer = 10, 'Only actual replenishment awards XP';
  assert (response->>'wait_seconds')::integer = 1800;
  select exp into baseline from public.mascots where id = pet.id;
  -- Even an indigestion elsewhere cannot reopen the reward loop during rest.
  update public.mascots set svago = 85 where id = pet.id;
  for i in 1..20 loop
    response := public.play_with_mascot(case when i % 2 = 0 then 'drone' else 'cannetta' end);
    assert response->>'status' = 'resting';
    assert (response->>'xp')::integer = 0;
  end loop;
  assert (select exp from public.mascots where id = pet.id) = baseline;
  update public.mascot_play_limits set rest_until = now() - interval '1 second' where mascot_id = pet.id;
  update public.mascots set svago = 100, last_updated_at = now() where id = pet.id;
  response := public.play_with_mascot('drone');
  assert response->>'status' = 'overstimulated';
  assert (response->'mascot'->>'svago')::integer = 85;
  assert (response->>'xp')::integer = 0;
  response := public.play_with_mascot('drone');
  assert response->>'status' = 'resting';
  update public.mascot_play_limits set rest_until = now() - interval '1 second' where mascot_id = pet.id;
  update public.mascots set fame = 10, svago = 30, last_updated_at = now() where id = pet.id;
  response := public.play_with_mascot('drone');
  assert response->>'status' = 'played';
  assert (response->>'xp')::integer = 0, 'Critical needs still prevent XP';
  denied := false;
  begin perform public.play_with_mascot('unknown'); exception when others then denied := true; end;
  assert denied;
  assert not has_table_privilege('authenticated', 'public.mascot_play_limits', 'update');
  assert not has_function_privilege('anon', 'public.play_with_mascot(text)', 'execute');
end;
$$;
