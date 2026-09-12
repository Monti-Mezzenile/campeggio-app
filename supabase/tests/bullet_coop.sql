-- Run inside a transaction and roll back: no test rooms or account changes persist.
do $$
declare ids uuid[]; room public.bullet_rooms; joined public.bullet_rooms; denied boolean;
begin
  select array_agg(id) into ids from (select id from public.profiles order by id limit 3) p;
  if coalesce(array_length(ids, 1), 0) < 3 then raise exception 'Three existing profiles are required for the isolated room test'; end if;
  perform set_config('request.jwt.claim.sub', ids[1]::text, true);
  room := public.create_bullet_room();
  assert room.host_id = ids[1] and length(room.code) = 6;
  assert public.can_access_bullet_channel('bullet:' || room.id || ':host', true);
  assert not public.can_access_bullet_channel('bullet:' || room.id || ':guest', true);
  denied := false;
  begin perform public.join_bullet_room(room.code); exception when others then denied := true; end;
  assert denied, 'Host cannot fill the guest slot';
  perform set_config('request.jwt.claim.sub', ids[2]::text, true);
  assert not public.can_access_bullet_channel('bullet:' || room.id || ':host', false);
  joined := public.join_bullet_room(lower(room.code));
  assert joined.guest_id = ids[2];
  assert public.can_access_bullet_channel('bullet:' || room.id || ':host', false);
  assert public.can_access_bullet_channel('bullet:' || room.id || ':guest', true);
  assert not public.can_access_bullet_channel('bullet:' || room.id || ':host', true);
  denied := false;
  begin perform public.start_bullet_room(room.id); exception when others then denied := true; end;
  assert denied, 'Guest cannot start the room';
  perform set_config('request.jwt.claim.sub', ids[3]::text, true);
  denied := false;
  begin perform public.join_bullet_room(room.code); exception when others then denied := true; end;
  assert denied, 'A third player cannot enter';
  assert not public.can_access_bullet_channel('bullet:' || room.id || ':host', false);
  assert (public.get_bullet_room(room.id)).id is null;
  perform set_config('request.jwt.claim.sub', ids[1]::text, true);
  perform public.start_bullet_room(room.id);
  assert (public.get_bullet_room(room.id)).status = 'playing';
  perform set_config('request.jwt.claim.sub', ids[2]::text, true);
  perform public.close_bullet_room(room.id);
  assert not public.can_access_bullet_channel('bullet:' || room.id || ':guest', true);
  assert not has_function_privilege('anon', 'public.create_bullet_room()', 'execute');
end;
$$;
