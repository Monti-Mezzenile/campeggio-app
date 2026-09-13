begin;
create table public.mascot_play_limits (
  mascot_id uuid primary key references public.mascots(id) on delete cascade,
  rest_until timestamptz not null
);
alter table public.mascot_play_limits enable row level security;
revoke all on public.mascot_play_limits from public, anon, authenticated;

create function public.play_with_mascot(p_item text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  pet public.mascots;
  action_at timestamptz := clock_timestamp();
  rest_at timestamptz;
  hours_passed numeric;
  zero_after numeric;
  hunger numeric;
  thirst numeric;
  fun numeric;
  amount integer;
  gained integer := 0;
  result text := 'played';
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_item is null or p_item not in ('drone', 'cannetta') then raise exception 'Invalid play item'; end if;
  select * into pet from public.mascots where user_id = auth.uid() for update;
  if not found then raise exception 'Mascot not found'; end if;
  select rest_until into rest_at from public.mascot_play_limits where mascot_id = pet.id;
  if rest_at > action_at then
    return jsonb_build_object('status', 'resting', 'wait_seconds', ceil(extract(epoch from rest_at - action_at)), 'xp', 0);
  end if;
  hours_passed := greatest(0, extract(epoch from action_at - coalesce(pet.last_updated_at, action_at)) / 3600.0);
  hunger := coalesce(pet.fame, 100); thirst := coalesce(pet.sete, 100); fun := coalesce(pet.svago, 100);
  zero_after := least(hunger / 3.5, thirst / 4.5, fun / 3.0);
  pet.exp := greatest(0, coalesce(pet.exp, 0) - floor(greatest(0, hours_passed - zero_after) * 2)::integer);
  if hours_passed > 0.05 then
    hunger := greatest(0, hunger - hours_passed * 3.5);
    thirst := greatest(0, thirst - hours_passed * 4.5);
    fun := greatest(0, fun - hours_passed * 3.0);
  end if;
  amount := case when p_item = 'drone' then 40 else 25 end;
  if round(fun) >= 100 then
    result := 'overstimulated';
    fun := greatest(0, fun - 15);
    rest_at := action_at + interval '30 minutes';
  else
    -- Award only actual replenishment, never a full item's XP for a tiny deficit.
    if hunger >= 20 and thirst >= 20 and fun >= 20 then gained := least(amount, floor(100 - fun)::integer); end if;
    fun := least(100, fun + amount);
    if round(fun) >= 100 then rest_at := action_at + interval '30 minutes'; end if;
  end if;
  pet.exp := pet.exp + gained;
  select max(phase) into pet.fase from (values (1,0),(2,800),(3,2500),(4,6000),(5,12000),(6,22000),(7,38000),(8,60000),(9,100000),(10,150000)) as levels(phase, threshold) where pet.exp >= threshold;
  update public.mascots set fame = round(hunger), sete = round(thirst), svago = round(fun), exp = pet.exp, fase = pet.fase, last_updated_at = action_at
    where id = pet.id returning * into pet;
  if rest_at > action_at then
    insert into public.mascot_play_limits values (pet.id, rest_at)
      on conflict (mascot_id) do update set rest_until = excluded.rest_until;
  end if;
  return jsonb_build_object('status', result, 'mascot', to_jsonb(pet), 'xp', gained,
    'wait_seconds', greatest(0, ceil(extract(epoch from rest_at - action_at))));
end;
$$;
revoke all on function public.play_with_mascot(text) from public, anon;
grant execute on function public.play_with_mascot(text) to authenticated;
commit;
