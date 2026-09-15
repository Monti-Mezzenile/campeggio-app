-- Run inside a transaction after loading the migration; always roll back.
do $$
declare u uuid; run uuid; i integer; n integer; applied timestamptz;
begin
 select user_id,applied_at into u,applied from public.mascot_fiscal_allocations where applied_at is not null order by user_id limit 1;
 if u is null then raise exception 'An audited test mascot is required'; end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
 update public.mascot_medal_state set progress=progress-'riabilitato-alla-brace',earned=earned-'riabilitato-alla-brace' where user_id=u;
 -- A run started before the audit does not count even when completed afterward.
 run:=gen_random_uuid(); perform public.begin_medal_game('grigliata',run);
 update public.mascot_medal_runs set started_at=applied-interval '1 second' where id=run;
 perform public.finish_medal_game(run,50,0);
 run:=gen_random_uuid(); perform public.begin_medal_game('corsa',run); perform public.finish_medal_game(run,50,0);
 if public.get_mascot_medals()->'progress' ? 'riabilitato-alla-brace' then raise exception 'Ineligible game counted'; end if;
 for i in 1..9 loop
  run:=gen_random_uuid(); perform public.begin_medal_game('grigliata',run); perform public.finish_medal_game(run,50,0);
 end loop;
 if public.get_mascot_medals()->'earned' ? 'riabilitato-alla-brace' then raise exception 'Medal awarded before ten games'; end if;
 run:=gen_random_uuid(); perform public.begin_medal_game('grigliata',run); perform public.finish_medal_game(run,50,0);
 if not(public.get_mascot_medals()->'earned' ? 'riabilitato-alla-brace') then raise exception 'Ten games did not award medal'; end if;
 perform public.finish_medal_game(run,100,0);
 select (progress->>'riabilitato-alla-brace')::integer into n from public.mascot_medal_state where user_id=u;
 if n<>10 then raise exception 'Repeated result counted more than once'; end if;
 if has_function_privilege('authenticated','public.medal_grill_rehabilitation()','EXECUTE') then raise exception 'Trigger helper exposed'; end if;
end $$;
