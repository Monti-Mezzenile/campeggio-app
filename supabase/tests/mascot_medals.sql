-- Execute in a transaction and always ROLLBACK. Uses existing pets only inside that transaction.
do $$
declare u uuid; v uuid; target uuid; r uuid; result jsonb; n integer; before_xp integer; i integer;
begin
 select user_id into u from public.mascots order by user_id limit 1;
 select user_id,id into v,target from public.mascots where user_id<>u order by user_id limit 1;
 perform set_config('request.jwt.claim.sub',u::text,true);
 perform public.medal_progress(u,'carota-identita',100,100);
 if exists(select 1 from public.mascot_medal_state) then raise exception 'Prelaunch counters advanced'; end if;
 r:=gen_random_uuid(); perform public.begin_medal_game('grigliata',r);
 if exists(select 1 from public.mascot_medal_runs) then raise exception 'Prelaunch game registered'; end if;
 perform public.activate_mascot_medals();
 if (public.get_mascot_medals()->'progress'->>'carota-identita') is not null then raise exception 'Retroactive care'; end if;
 if not(public.get_mascot_medals()->'earned' ? 'testimone-della-griglia') then raise exception 'Missing event badge'; end if;
 -- Unsuccessful feeding is not a valid care action.
 update public.mascots set fame=100,sete=100,svago=100,last_updated_at=clock_timestamp() where user_id=u;
 result:=public.care_for_mascot('carota');
 if result->>'status'<>'overfed' then raise exception 'Full feeding accepted'; end if;
 if coalesce((public.get_mascot_medals()->'progress'->>'carota-identita')::integer,0)<>0 then raise exception 'Rejected care counted'; end if;
 for i in 1..100 loop
  update public.mascots set fame=85,sete=100,svago=100,last_updated_at=clock_timestamp() where user_id=u;
  perform public.care_for_mascot('carota');
 end loop;
 result:=public.get_mascot_medals();
 if not(result->'earned' ? 'carota-identita') or not(result->'earned' ? 'tagliando-completo') then raise exception 'Care thresholds failed'; end if;
 if (result->'progress'->>'responsabile-essere-discutibile')::integer<>1 then raise exception 'Same day counted twice'; end if;
 update public.mascot_medal_state set care_day=(clock_timestamp() at time zone 'Europe/Rome')::date-1,care_streak=14 where user_id=u;
 update public.mascots set fame=50,last_updated_at=clock_timestamp() where user_id=u;
 perform public.care_for_mascot('carota');
 if not(public.get_mascot_medals()->'earned' ? 'responsabile-essere-discutibile') then raise exception '15-day streak failed'; end if;
 update public.mascot_medal_state set care_day=(clock_timestamp() at time zone 'Europe/Rome')::date-3 where user_id=u;
 update public.mascots set fame=50,last_updated_at=clock_timestamp() where user_id=u;
 perform public.care_for_mascot('carota');
 if (public.get_mascot_medals()->'progress'->>'responsabile-essere-discutibile')::integer<>1 then raise exception 'Streak did not reset'; end if;
 delete from public.mascot_play_limits where mascot_id=(select id from public.mascots where user_id=u);
 update public.mascots set svago=60,last_updated_at=clock_timestamp() where user_id=u;
 perform public.care_for_mascot('drone'); perform public.care_for_mascot('drone');
 if (public.get_mascot_medals()->'progress'->>'patentino-revocato')::integer<>1 then raise exception 'Resting drone counted'; end if;
 perform public.medal_rival_action(target,'pigna'); perform public.medal_rival_action(target,'birra');
 if not(public.get_mascot_medals()->'earned' ? 'pace-armata') then raise exception 'Peace not awarded'; end if;
 r:=gen_random_uuid(); perform public.begin_medal_game('grigliata',r); perform public.finish_medal_game(r,100,35); perform public.finish_medal_game(r,9999,99);
 if (select score from public.mascot_medal_runs where id=r)<>100 then raise exception 'Duplicate completion changed score'; end if;
 if not(public.get_mascot_medals()->'earned' ? 'commercialista-della-brace') then raise exception 'Grill streak failed'; end if;
 for i in 1..10 loop r:=gen_random_uuid(); perform public.begin_medal_game('grigliata',r); perform public.finish_medal_game(r,50,0); end loop;
 r:=gen_random_uuid(); perform public.begin_medal_game('grigliata',r); perform public.finish_medal_game(r,101,0);
 if not(public.get_mascot_medals()->'earned' ? 'accanimento-terapeutico') or not(public.get_mascot_medals()->'earned' ? 'miracolo-documentato') then raise exception 'Persistence badges failed'; end if;
 perform public.configure_mascot_medals(array['carota-identita'],'intro');
 if not(public.get_mascot_medals()->>'intro_seen')::boolean then raise exception 'Intro not persisted'; end if;
 begin perform public.configure_mascot_medals(array['not-earned']); raise exception 'Unearned pin accepted'; exception when others then if sqlerrm='Unearned pin accepted' then raise; end if; end;
 if has_function_privilege('authenticated','public.activate_mascot_medals()','EXECUTE') or has_table_privilege('authenticated','public.mascot_medal_state','UPDATE') then raise exception 'Unsafe permissions'; end if;
 select exp into before_xp from public.mascots where user_id=u;
 insert into public.mascot_fiscal_allocations values(u,500,'TEST',null);
 n:=public.apply_mascot_fiscal_allocations();
 if n<>1 or (select exp from public.mascots where user_id=u)<>greatest(0,before_xp-500) then raise exception 'Fiscal allocation failed'; end if;
 n:=public.apply_mascot_fiscal_allocations(); if n<>0 then raise exception 'Fiscal deduction repeated'; end if;
 raise notice 'PASS: launch gate, care, thresholds, streak/reset, rest, rivals, idempotency, games, pinning, permissions, fiscal correction';
end $$;
