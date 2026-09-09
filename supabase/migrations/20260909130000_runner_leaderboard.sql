begin;

create table public.runner_scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  best_score integer not null check (best_score >= 0),
  updated_at timestamptz not null default now()
);
alter table public.runner_scores enable row level security;
revoke all on public.runner_scores from anon, authenticated;

-- Accept only the caller's score; keep their personal best atomically.
create or replace function public.submit_runner_score(p_score integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_score is null or p_score < 0 then raise exception 'Invalid score'; end if;
  insert into public.runner_scores (user_id, best_score)
  values (auth.uid(), p_score)
  on conflict (user_id) do update
    set best_score = greatest(public.runner_scores.best_score, excluded.best_score),
        updated_at = now();
end;
$$;

create or replace function public.get_runner_leaderboard()
returns table (user_id uuid, nome text, best_score integer)
language sql stable security definer set search_path = '' as $$
  select s.user_id, p.nome::text, s.best_score
  from public.runner_scores s join public.profiles p on p.id = s.user_id
  where auth.uid() is not null
  order by s.best_score desc, s.user_id
;
$$;
revoke all on function public.submit_runner_score(integer) from public, anon;
revoke all on function public.get_runner_leaderboard() from public, anon;
grant execute on function public.submit_runner_score(integer) to authenticated;
grant execute on function public.get_runner_leaderboard() to authenticated;

commit;
