begin;
-- Reuse the angelic grill artwork for an achievement all audited pets can earn.
-- Preserve the original launch date and every other medal/counter.
create function public.medal_grill_rehabilitation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.finished_at is null and new.finished_at is not null and new.game='grigliata'
    and exists(select 1 from public.mascot_fiscal_allocations a where a.user_id=new.user_id and a.applied_at<=new.started_at) then
  perform public.medal_progress(new.user_id,'riabilitato-alla-brace',1,10);
 end if;
 return new;
end $$;
revoke all on function public.medal_grill_rehabilitation() from public,anon,authenticated;
create trigger mascot_grill_rehabilitation after update of finished_at on public.mascot_medal_runs
 for each row execute function public.medal_grill_rehabilitation();

-- Only completed runs in the new, server-registered ledger qualify; never import old local scores.
do $$
declare r record;
begin
 for r in select g.user_id,count(*)::integer as games from public.mascot_medal_runs g
 join public.mascot_fiscal_allocations a on a.user_id=g.user_id and a.applied_at<=g.started_at
 where g.game='grigliata' and g.finished_at is not null group by g.user_id loop
  perform public.medal_progress(r.user_id,'riabilitato-alla-brace',r.games,10,false);
 end loop;
end $$;

create or replace function public.apply_mascot_fiscal_allocations() returns integer
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
  if a.excess_xp>0 then perform public.medal_progress(a.user_id,'indagato-grigliata',1,1,false); end if;
  if next_phase<old_phase then perform public.medal_progress(a.user_id,'nullatenente-di-ritorno',1,1,false); end if;
  update public.mascot_fiscal_allocations set applied_at=clock_timestamp() where user_id=a.user_id;
  n:=n+1;
 end loop;
 return n;
end $$;

commit;
