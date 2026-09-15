-- Run ONCE after the Vercel production deployment is READY. Safe to repeat.
begin;
select public.activate_mascot_medals();
do $$
declare item record; matches integer; uid uuid;
begin
 for item in select * from (values
 ('Fiocco di Neve',30000),('Scarto di Merdor',15000),('Eduardo',3000),
 ('Rogerino',1000),('Schadenfreude',1000),('404 Not Found',500),
 ('Tommy lo zingaro',500),('Malacchia',200),('Caghetta',200)
 ) allocations(name,amount) loop
  select count(*) into matches from public.mascots where lower(trim(nome_mascotte))=lower(item.name);
  if matches<>1 then raise exception 'Expected exactly one mascot named %, found %; no deductions applied',item.name,matches; end if;
  select user_id into uid from public.mascots where lower(trim(nome_mascotte))=lower(item.name);
  insert into public.mascot_fiscal_allocations(user_id,excess_xp,reason) values(uid,item.amount,'Importo stabilito dal proprietario del gioco il 15 settembre 2026: '||item.name) on conflict(user_id) do nothing;
 end loop;
 -- Existing pets outside the supplied list receive a clean record.
 insert into public.mascot_fiscal_allocations(user_id,excess_xp,reason)
 select user_id,0,'Nessuna correzione prevista nell’elenco del proprietario' from public.mascot_medal_state where earned ? 'testimone-della-griglia'
 on conflict(user_id) do nothing;
end $$;
select public.apply_mascot_fiscal_allocations();
commit;
