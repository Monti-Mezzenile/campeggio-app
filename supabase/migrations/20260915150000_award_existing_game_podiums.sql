begin;
-- One-time exception requested for the current historical leaderboards.
-- Preserve the exact podium at assignment time; future changes do not rewrite this snapshot.
create table public.mascot_podium_snapshot_20260915 (
 game text not null check(game in ('corsa','bullet','grigliata','merge')),
 rank integer not null check(rank between 1 and 3),
 user_id uuid not null references public.profiles(id),
 score integer not null,
 awarded_at timestamptz not null default clock_timestamp(),
 primary key(game,rank)
);
alter table public.mascot_podium_snapshot_20260915 enable row level security;
revoke all on public.mascot_podium_snapshot_20260915 from public,anon,authenticated;
grant all on public.mascot_podium_snapshot_20260915 to service_role;

insert into public.mascot_podium_snapshot_20260915(game,rank,user_id,score)
with scores as (
 select 'corsa' as game,user_id,best_score from public.runner_scores
 union all select 'bullet',user_id,best_score from public.bullet_scores
 union all select 'grigliata',user_id,best_score from public.grill_scores
 union all select 'merge',user_id,best_score from public.merge_scores
), ranked as (
 -- Identical tie-breaking to get_*_leaderboard(): score descending, user_id ascending.
 select *,row_number() over(partition by game order by best_score desc,user_id) as rank from scores
)
select game,rank::integer,user_id,best_score from ranked where rank<=3;

do $$
declare winner record;
begin
 for winner in select * from public.mascot_podium_snapshot_20260915 order by game,rank loop
  perform public.medal_progress(winner.user_id,winner.game||winner.rank,1,1,false);
 end loop;
 if exists(select 1 from public.mascot_podium_snapshot_20260915 w
   left join public.mascot_medal_state s on s.user_id=w.user_id
   where not coalesce(s.earned ? (w.game||w.rank),false)) then
  raise exception 'At least one podium medal could not be assigned';
 end if;
end $$;
commit;
