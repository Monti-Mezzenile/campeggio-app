begin;
-- Deploy this migration first. Activation is a separate service-role operation AFTER production is ready.
create table public.mascot_medal_launch (id boolean primary key default true check(id), launched_at timestamptz);
insert into public.mascot_medal_launch values(true,null);
create table public.mascot_medal_state (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 progress jsonb not null default '{}', earned jsonb not null default '{}', featured text[] not null default '{}',
 care_day date, care_streak integer not null default 0, game_days date[] not null default '{}',
 games jsonb not null default '{}', pigna_targets uuid[] not null default '{}',
 intro_seen boolean not null default false, audit_seen boolean not null default false,
 audit jsonb
);
create table public.mascot_medal_runs (
 id uuid primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 game text not null check(game in ('corsa','bullet','grigliata','merge')), started_at timestamptz not null default clock_timestamp(),
 finished_at timestamptz, score integer
);
create table public.mascot_medal_scores (
 user_id uuid references public.profiles(id) on delete cascade, game text not null,
 score integer not null, achieved_at timestamptz not null default clock_timestamp(), primary key(user_id, game)
);
-- An explicit, reviewed allocation is required: historical game XP was not logged.
create table public.mascot_fiscal_allocations (
 user_id uuid primary key references public.profiles(id), excess_xp integer not null check(excess_xp >= 0),
 reason text not null check(length(trim(reason)) > 0), applied_at timestamptz
);
alter table public.mascot_medal_launch enable row level security;
alter table public.mascot_medal_state enable row level security;
alter table public.mascot_medal_runs enable row level security;
alter table public.mascot_medal_scores enable row level security;
alter table public.mascot_fiscal_allocations enable row level security;
revoke all on public.mascot_medal_launch, public.mascot_medal_state, public.mascot_medal_runs, public.mascot_medal_scores, public.mascot_fiscal_allocations from public, anon, authenticated;
grant all on public.mascot_medal_launch, public.mascot_medal_state, public.mascot_medal_runs, public.mascot_medal_scores, public.mascot_fiscal_allocations to service_role;

create function public.medal_progress(p_user uuid, p_id text, p_value integer, p_target integer, p_add boolean default true) returns void
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if not exists(select 1 from public.mascot_medal_launch where launched_at <= clock_timestamp()) then return; end if;
 insert into public.mascot_medal_state(user_id) values(p_user) on conflict do nothing;
 select case when p_add then coalesce((progress->>p_id)::integer,0)+p_value else greatest(coalesce((progress->>p_id)::integer,0),p_value) end
 into n from public.mascot_medal_state where user_id=p_user for update;
 update public.mascot_medal_state set progress=jsonb_set(progress,array[p_id],to_jsonb(n)),
 earned=case when n>=p_target and not earned ? p_id then earned || jsonb_build_object(p_id,clock_timestamp()) else earned end where user_id=p_user;
end $$;

create function public.activate_mascot_medals() returns timestamptz
language plpgsql security definer set search_path='' as $$
declare t timestamptz;
begin
 select launched_at into t from public.mascot_medal_launch where id for update;
 if t is not null then return t; end if;
 t:=clock_timestamp();
 update public.mascot_medal_launch set launched_at=t where id;
 insert into public.mascot_medal_state(user_id,earned,progress,audit)
 select user_id,jsonb_build_object('testimone-della-griglia',t),jsonb_build_object('testimone-della-griglia',1),jsonb_build_object('status','pending') from public.mascots
 on conflict(user_id) do update set earned=public.mascot_medal_state.earned || excluded.earned, progress=public.mascot_medal_state.progress || excluded.progress,audit=excluded.audit;
 return t;
end $$;

create function public.apply_mascot_fiscal_allocations() returns integer
language plpgsql security definer set search_path='' as $$
declare a record; pet public.mascots; next_exp integer; next_phase integer; old_phase integer; removed integer; n integer:=0;
begin
 if not exists(select 1 from public.mascot_medal_launch where launched_at is not null) then raise exception 'Medals not active'; end if;
 for a in select * from public.mascot_fiscal_allocations where applied_at is null order by user_id for update loop
  select * into pet from public.mascots where user_id=a.user_id for update;
  if not found then continue; end if;
  if not exists(select 1 from public.mascot_medal_state where user_id=a.user_id and earned ? 'testimone-della-griglia') then raise exception 'Mascot not present at launch'; end if;
  next_exp:=greatest(0,pet.exp-a.excess_xp); removed:=pet.exp-next_exp;
  select max(phase) into old_phase from (values(1,0),(2,800),(3,2500),(4,6000),(5,12000),(6,22000),(7,38000),(8,60000),(9,100000),(10,150000)) levels(phase,xp) where pet.exp>=xp;
  select max(phase) into next_phase from (values(1,0),(2,800),(3,2500),(4,6000),(5,12000),(6,22000),(7,38000),(8,60000),(9,100000),(10,150000)) levels(phase,xp) where next_exp>=xp;
  update public.mascots set exp=next_exp,fase=next_phase where id=pet.id;
  update public.mascot_medal_state set audit=jsonb_build_object('status',case when a.excess_xp>0 then 'corrected' else 'clear' end,'before_xp',pet.exp,'after_xp',next_exp,'removed',removed,'before_phase',old_phase,'after_phase',next_phase),audit_seen=false where user_id=a.user_id;
  perform public.medal_progress(a.user_id,case when a.excess_xp>0 then 'indagato-grigliata' else 'fedina-culinaria-pulita' end,1,1,false);
  if next_phase<old_phase then perform public.medal_progress(a.user_id,'nullatenente-di-ritorno',1,1,false); end if;
  update public.mascot_fiscal_allocations set applied_at=clock_timestamp() where user_id=a.user_id;
  n:=n+1;
 end loop;
 return n;
end $$;

create function public.get_mascot_medals(p_user uuid default auth.uid()) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.mascot_medal_state; t timestamptz; today date:=(clock_timestamp() at time zone 'Europe/Rome')::date;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select launched_at into t from public.mascot_medal_launch where id;
 select * into s from public.mascot_medal_state where user_id=p_user;
 if p_user=auth.uid() then
  return jsonb_build_object('launched_at',t,'progress',coalesce(s.progress,'{}') || jsonb_build_object('responsabile-essere-discutibile',case when s.care_day>=today-1 then s.care_streak else 0 end), 'earned',coalesce(s.earned,'{}'),'featured',coalesce(s.featured,'{}'),'intro_seen',coalesce(s.intro_seen,false),'audit_seen',coalesce(s.audit_seen,false),'audit',s.audit);
 end if;
 return jsonb_build_object('launched_at',t,'earned',coalesce(s.earned,'{}'),'featured',coalesce(s.featured,'{}'),'progress','{}','intro_seen',true,'audit_seen',true);
end $$;

create function public.configure_mascot_medals(p_featured text[] default null, p_seen text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.mascot_medal_state;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.mascot_medal_state(user_id) values(auth.uid()) on conflict do nothing;
 select * into s from public.mascot_medal_state where user_id=auth.uid() for update;
 if p_featured is not null then
  if cardinality(p_featured)>3 or exists(select 1 from unnest(p_featured) x where not s.earned ? x) or cardinality(p_featured)<>(select count(distinct x) from unnest(p_featured) x) then raise exception 'Choose at most three earned medals'; end if;
  update public.mascot_medal_state set featured=p_featured where user_id=auth.uid();
 end if;
 if p_seen='intro' then update public.mascot_medal_state set intro_seen=true where user_id=auth.uid();
 elsif p_seen='audit' then update public.mascot_medal_state set audit_seen=true where user_id=auth.uid();
 elsif p_seen is not null then raise exception 'Invalid introduction'; end if;
 return public.get_mascot_medals();
end $$;

-- Refresh under a row lock so opening an old tab cannot restore pre-audit XP.
create function public.refresh_mascot() returns jsonb
language plpgsql security definer set search_path='' as $$
declare pet public.mascots; t timestamptz:=clock_timestamp(); h numeric;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into pet from public.mascots where user_id=auth.uid() for update;
 if not found then raise exception 'Mascot not found'; end if;
 h:=greatest(0,extract(epoch from t-coalesce(pet.last_updated_at,t))/3600.0);
 pet.exp:=greatest(0,pet.exp-floor(greatest(0,h-least(pet.fame/3.5,pet.sete/4.5,pet.svago/3.0))*2)::integer);
 if h>0.05 then pet.fame:=greatest(0,round(pet.fame-h*3.5)); pet.sete:=greatest(0,round(pet.sete-h*4.5)); pet.svago:=greatest(0,round(pet.svago-h*3.0)); end if;
 select max(phase) into pet.fase from (values(1,0),(2,800),(3,2500),(4,6000),(5,12000),(6,22000),(7,38000),(8,60000),(9,100000),(10,150000)) levels(phase,xp) where pet.exp>=xp;
 update public.mascots set fame=pet.fame,sete=pet.sete,svago=pet.svago,exp=pet.exp,fase=pet.fase,last_updated_at=t where id=pet.id returning * into pet;
 return to_jsonb(pet);
end $$;
revoke all on function public.refresh_mascot() from public,anon;
grant execute on function public.refresh_mascot() to authenticated;

-- Care and counters commit in one transaction, including drone cooldown validation.
create function public.care_for_mascot(p_item text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare pet public.mascots; before_pet public.mascots; result jsonb; hours numeric; hunger numeric; thirst numeric; fun numeric;
 amount integer; gained integer:=0; k text; t timestamptz:=clock_timestamp(); today date:=(t at time zone 'Europe/Rome')::date; streak integer; successful boolean:=false; was_full boolean;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_item is null or p_item not in ('carota','cosciotto','acqua','birra','drone','cannetta') then raise exception 'Invalid item'; end if;
 select * into pet from public.mascots where user_id=auth.uid() for update;
 if not found then raise exception 'Mascot not found'; end if;
 before_pet:=pet;
 hours:=greatest(0,extract(epoch from t-coalesce(pet.last_updated_at,t))/3600.0);
 hunger:=coalesce(pet.fame,100); thirst:=coalesce(pet.sete,100); fun:=coalesce(pet.svago,100);
 if hours>0.05 then hunger:=greatest(0,hunger-hours*3.5); thirst:=greatest(0,thirst-hours*4.5); fun:=greatest(0,fun-hours*3); end if;
 was_full:=round(hunger)>=100 and round(thirst)>=100 and round(fun)>=100;
 if p_item in ('drone','cannetta') then
  result:=public.play_with_mascot(p_item);
  successful:=result->>'status'='played';
  select * into pet from public.mascots where id=pet.id;
 else
  pet.exp:=greatest(0,pet.exp-floor(greatest(0,hours-least(coalesce(pet.fame,100)/3.5,coalesce(pet.sete,100)/4.5,coalesce(pet.svago,100)/3.0))*2)::integer);
  k:=case when p_item in ('carota','cosciotto') then 'fame' else 'sete' end;
  amount:=case p_item when 'carota' then 15 when 'acqua' then 20 else 35 end;
  successful:=round(case when k='fame' then hunger else thirst end)<100;
  if successful then
   if hunger>=20 and thirst>=20 and fun>=20 then gained:=least(amount,floor(100-case when k='fame' then hunger else thirst end)::integer); end if;
   if k='fame' then hunger:=least(100,hunger+amount); else thirst:=least(100,thirst+amount); end if;
  else fun:=greatest(0,fun-15); end if;
  pet.exp:=pet.exp+gained;
  select max(phase) into pet.fase from (values(1,0),(2,800),(3,2500),(4,6000),(5,12000),(6,22000),(7,38000),(8,60000),(9,100000),(10,150000)) levels(phase,xp) where pet.exp>=xp;
  update public.mascots set fame=round(hunger),sete=round(thirst),svago=round(fun),exp=pet.exp,fase=pet.fase,last_updated_at=t where id=pet.id returning * into pet;
  result:=jsonb_build_object('status',case when successful then 'played' else 'overfed' end,'mascot',to_jsonb(pet),'xp',gained,'wait_seconds',0);
 end if;
 if successful and exists(select 1 from public.mascot_medal_launch where launched_at<=t) then
  k:=case p_item when 'carota' then 'carota-identita' when 'birra' then 'fegato-comodato' when 'drone' then 'patentino-revocato' else null end;
  if k is not null then perform public.medal_progress(auth.uid(),k,1,100); end if;
  insert into public.mascot_medal_state(user_id) values(auth.uid()) on conflict do nothing;
  select case when care_day=today then care_streak when care_day=today-1 then care_streak+1 else 1 end into streak from public.mascot_medal_state where user_id=auth.uid() for update;
  update public.mascot_medal_state set care_day=today,care_streak=streak where user_id=auth.uid();
  perform public.medal_progress(auth.uid(),'responsabile-essere-discutibile',streak,15,false);
  if not was_full and pet.fame=100 and pet.sete=100 and pet.svago=100 then perform public.medal_progress(auth.uid(),'tagliando-completo',1,50); end if;
 end if;
 return result;
end $$;

create function public.medal_evolution_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.exp<12000 and new.exp>=12000 then perform public.medal_progress(new.user_id,'non-era-un-coniglio',1,1,false); end if;
 return new;
end $$;
create trigger mascot_medal_evolution after update of exp on public.mascots for each row execute function public.medal_evolution_trigger();

create function public.medal_rival_action(p_target_mascot_id uuid,p_action_type text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; hit boolean;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 -- Serialize the sender's progress before locking the target inside the existing action.
 insert into public.mascot_medal_state(user_id) values(auth.uid()) on conflict do nothing;
 perform 1 from public.mascot_medal_state where user_id=auth.uid() for update;
 result:=public.apply_mascot_action(p_target_mascot_id,p_action_type);
 if not exists(select 1 from public.mascot_medal_launch where launched_at<=clock_timestamp()) then return result; end if;
 if p_action_type in ('pigna','troll') then perform public.medal_progress(auth.uid(),'problema-condominiale',1,50);
 else perform public.medal_progress(auth.uid(),'protezione-civile-cavie',1,50); end if;
 if p_action_type='pigna' then
  perform public.medal_progress(auth.uid(),'pigna-di-traverso',1,1,false);
  update public.mascot_medal_state set pigna_targets=array_append(array_remove(pigna_targets,p_target_mascot_id),p_target_mascot_id) where user_id=auth.uid();
 elsif p_action_type='birra' then
  perform public.medal_progress(auth.uid(),'diplomazia-alla-spina',1,50);
  select p_target_mascot_id=any(pigna_targets) into hit from public.mascot_medal_state where user_id=auth.uid();
  if hit then perform public.medal_progress(auth.uid(),'pace-armata',1,1,false); end if;
 end if;
 return result;
end $$;

create function public.begin_medal_game(p_game text,p_run uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_game is null or p_game not in ('corsa','bullet','grigliata','merge') then raise exception 'Invalid game'; end if;
 if not exists(select 1 from public.mascot_medal_launch where launched_at<=clock_timestamp()) then return; end if;
 insert into public.mascot_medal_runs(id,user_id,game) values(p_run,auth.uid(),p_game) on conflict do nothing;
end $$;

create function public.finish_medal_game(p_run uuid,p_score integer,p_combo integer default 0) returns void
language plpgsql security definer set search_path='' as $$
declare r public.mascot_medal_runs; s public.mascot_medal_state; g jsonb; best integer; misses integer; today date:=(clock_timestamp() at time zone 'Europe/Rome')::date; podium record;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_score is null or p_score<0 or p_score>100000000 or p_combo is null or p_combo<0 or p_combo>100000 then raise exception 'Invalid result'; end if;
 select * into r from public.mascot_medal_runs where id=p_run and user_id=auth.uid() for update;
 if not found or r.finished_at is not null then return; end if;
 update public.mascot_medal_runs set finished_at=clock_timestamp(),score=p_score where id=p_run;
 perform pg_advisory_xact_lock(hashtext('mascot-medals-'||r.game));
 insert into public.mascot_medal_state(user_id) values(auth.uid()) on conflict do nothing;
 select * into s from public.mascot_medal_state where user_id=auth.uid() for update;
 g:=coalesce(s.games->r.game,'{}'); best:=coalesce((g->>'best')::integer,-1); misses:=coalesce((g->>'misses')::integer,0);
 if p_score>best then
  if misses>=10 then perform public.medal_progress(auth.uid(),'miracolo-documentato',1,1,false); end if;
  misses:=0;
 else misses:=misses+1; end if;
 update public.mascot_medal_state set games=jsonb_set(games,array[r.game],jsonb_build_object('best',greatest(best,p_score),'misses',misses)),game_days=case when today=any(game_days) then game_days else array_append(game_days,today) end where user_id=auth.uid() returning * into s;
 perform public.medal_progress(auth.uid(),'accanimento-terapeutico',misses,10,false);
 perform public.medal_progress(auth.uid(),'curriculum-poco-spendibile',(select count(*)::integer from jsonb_object_keys(s.games)),4,false);
 perform public.medal_progress(auth.uid(),'era-lultima-giuro',cardinality(s.game_days),50,false);
 if r.game='grigliata' then perform public.medal_progress(auth.uid(),'commercialista-della-brace',p_combo,35,false); end if;
 -- Serialize ranking updates for this game; only new-season runs enter these standings.
 perform pg_advisory_xact_lock(hashtext('mascot-medals-'||r.game));
 insert into public.mascot_medal_scores(user_id,game,score) values(auth.uid(),r.game,p_score)
 on conflict(user_id,game) do update set score=excluded.score,achieved_at=clock_timestamp() where excluded.score>public.mascot_medal_scores.score;
 select * into podium from (select user_id,row_number() over(order by score desc,achieved_at,user_id) as rank from public.mascot_medal_scores where game=r.game) ranked where user_id=auth.uid();
 if podium.rank<=3 then perform public.medal_progress(auth.uid(),r.game||podium.rank,1,1,false); end if;
end $$;

revoke all on function public.medal_progress(uuid,text,integer,integer,boolean),public.activate_mascot_medals(),public.apply_mascot_fiscal_allocations(),public.medal_evolution_trigger() from public,anon,authenticated;
grant execute on function public.activate_mascot_medals(),public.apply_mascot_fiscal_allocations() to service_role;
revoke all on function public.get_mascot_medals(uuid),public.configure_mascot_medals(text[],text),public.care_for_mascot(text),public.medal_rival_action(uuid,text),public.begin_medal_game(text,uuid),public.finish_medal_game(uuid,integer,integer) from public,anon;
grant execute on function public.get_mascot_medals(uuid),public.configure_mascot_medals(text[],text),public.care_for_mascot(text),public.medal_rival_action(uuid,text),public.begin_medal_game(text,uuid),public.finish_medal_game(uuid,integer,integer) to authenticated;
commit;
